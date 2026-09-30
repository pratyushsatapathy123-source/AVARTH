/**
 * AVARTH Data Orchestrator Service
 *
 * Gathers and normalizes:
 * 1. Meteorological forecast (ECMWF or Demo)
 * 2. Terrain elevation statistics (SRTM 30m)
 * 3. Land cover proportions (Dynamic World 10m)
 * 4. Infrastructure exposure (Demo GIS Assets)
 * 5. Current simulation parameters
 *
 * Computes prototype screening indices:
 * - RAPID FLOOD SUSCEPTIBILITY (0–100)
 * - SURGE POTENTIAL (m)
 * - COASTAL EXPOSURE INDEX (0–100)
 *
 * Passes normalized environmental values into the existing deterministic risk engine.
 */

import { DEMO_AOI, FORECAST_HORIZON_MAP } from '../config/geoConfig.ts';
import { earthEngineService } from './earthEngineService.ts';
import { meteorologicalService, MeteorologicalForecastResult } from './meteorologicalService.ts';
import { infrastructureService } from './infrastructureService.ts';
import { riskEngine } from './riskEngine.ts';
import { InfrastructureAsset } from '../models/types.ts';
import { normalizeRainfall, normalizeStormSurge } from '../engine/riskCalculation.ts';
import { logEvent } from '../utils/logger.ts';

export interface NormalizedOrchestratorData {
  scenario: {
    scenarioId: string;
    cycloneName: string;
    forecastHour: number;
    timelineStep: string;
    windKmh: number;
    rainfallMm: number;
    stormSurgeM: number;
    landfallDistanceKm: number;
  };
  meteorology: {
    mode: 'LIVE' | 'DEMO';
    windSpeedKmh: number;
    windDirectionDeg: number;
    uMs: number;
    vMs: number;
    precipitationTotalMm: number;
    precipitationRateMmPerHour: number;
    surfacePressureHpa: number;
    source: string;
  };
  terrain: {
    meanElevationM: number;
    minElevationM: number;
    maxElevationM: number;
    /** PROTOTYPE SCREENING INDEX (0–100). Not a hydrodynamic model. */
    rapidFloodSusceptibility: number;
    /** Screening index based on surge + low elevation (0–100). */
    coastalExposureIndex: number;
    /** SCENARIO SURGE POTENTIAL (m). Not confirmed surge. */
    surgePotentialM: number;
    elevationSource: string;
  };
  landCover: {
    builtUpFraction: number;
    waterFraction: number;
    vegetationFraction: number;
    source: string;
  };
  infrastructure: {
    totalAssetsCount: number;
    roadsExposed: number;
    medicalFacilitiesExposed: number;
    powerAssetsExposed: number;
    sheltersExposed: number;
    newlyExposedCount: number;
    source: 'DEMO INFRASTRUCTURE DATA';
  };
  sources: {
    weather: 'LIVE' | 'DEMO';
    earthEngine: 'LIVE' | 'DEMO';
    infrastructure: 'DEMO';
  };
  riskOutputs: {
    riskScore: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    floodExposure: number;
    infrastructureExposure: number;
    hazardScore: number;
  };
  timestamp: string;
}

export class DataOrchestrator {
  /**
   * Orchestrates multi-source ingestion and feeds values into the risk engine
   */
  public async getScenarioData(scenarioInput?: any): Promise<NormalizedOrchestratorData> {
    const currentScenario = riskEngine.getCurrentScenario();
    const scenarioId = scenarioInput?.scenarioId || currentScenario.scenario_id || 'AV-VARUN-04';
    const cycloneName = scenarioInput?.cycloneName || currentScenario.name || 'CYCLONE VARUN';

    // Map forecast timeline step to forecastHour offset
    const timelineStep = scenarioInput?.timelineStep || 'T-36H';
    const horizonConfig = FORECAST_HORIZON_MAP[timelineStep] || FORECAST_HORIZON_MAP['T-36H'];
    const forecastHour = scenarioInput?.forecastHour ?? horizonConfig.forecastHour;

    // 1. Ingest Meteorological Forecast (ECMWF or Demo)
    const weatherResult: MeteorologicalForecastResult = await meteorologicalService.getForecast(
      DEMO_AOI,
      forecastHour
    );

    // Dynamic wind/rain from meteorology if not explicitly overridden by interactive simulator slider
    const windKmh = Number(scenarioInput?.windKmh ?? weatherResult.wind.speedKmh);
    const rainfallMm = Number(scenarioInput?.rainfallMm ?? weatherResult.precipitation.totalMm);
    const stormSurgeM = Number(scenarioInput?.stormSurgeM ?? currentScenario.storm_surge_m ?? 2.4);
    const landfallDistanceKm = Number(scenarioInput?.landfallDistanceKm ?? currentScenario.landfall_distance_km ?? 12);

    // 2. Ingest Environmental Context (SRTM Elevation & Dynamic World Land Cover)
    const envContext = await earthEngineService.getEnvironmentalContext(DEMO_AOI, timelineStep);

    const meanElevation = envContext.elevation.meanM;
    const minElevation = envContext.elevation.minM;
    const maxElevation = envContext.elevation.maxM;

    // 3. Compute Prototype Screening Indices
    // RAPID FLOOD SUSCEPTIBILITY (0–100)
    // Formula: 35% rainfall + 25% surge + 25% low-elevation + 15% land-cover (water/impervious built-up)
    const rainNorm = normalizeRainfall(rainfallMm);
    const surgeNorm = normalizeStormSurge(stormSurgeM);
    // Lower elevation -> higher screening susceptibility: elevation <= 1m is 100, 10m+ is 0
    const elevationFactor = Math.max(0, Math.min(100, (10 - meanElevation) * 10));
    // Water and built-up land cover amplify drainage obstruction
    const landCoverFactor = Math.min(
      100,
      (envContext.landCover.waterFraction * 70 + envContext.landCover.builtUpFraction * 30) * 100
    );

    const rapidFloodSusceptibility = Math.round(
      0.35 * rainNorm +
      0.25 * surgeNorm +
      0.25 * elevationFactor +
      0.15 * landCoverFactor
    );

    // COASTAL EXPOSURE INDEX (0–100)
    // Lower elevation + higher surge potential
    const coastalExposureIndex = Math.min(
      100,
      Math.max(0, Math.round(stormSurgeM * 25 + (10 - minElevation) * 4))
    );

    // 4. Ingest Infrastructure Exposure
    const allAssets = infrastructureService.getAssets({});
    const exposedAssets = allAssets.filter((a: InfrastructureAsset) => {
      // Asset is exposed if its elevation is below surge height + 0.5m buffer,
      // or rainfall exceeds 200mm, or wind exceeds 175 km/h
      return (
        a.elevation_m <= stormSurgeM + 0.5 ||
        rainfallMm >= 210 ||
        windKmh >= 180
      );
    });

    const roadsExposed = exposedAssets.filter((a: InfrastructureAsset) => a.type === 'road').length;
    const medicalFacilitiesExposed = exposedAssets.filter((a: InfrastructureAsset) => a.type === 'medical').length;
    const powerAssetsExposed = exposedAssets.filter((a: InfrastructureAsset) => a.type === 'power').length;
    const sheltersExposed = exposedAssets.filter((a: InfrastructureAsset) => a.type === 'shelter').length;

    // 5. Connect into Risk Engine (DO NOT bypass risk calculation)
    // Feeds real environmental parameters into deterministic riskEngine
    const infrastructureExposureScore = Math.min(
      100,
      Math.round((exposedAssets.length / Math.max(1, allAssets.length)) * 100)
    );

    const simulatedRiskOutput = riskEngine.calculateRisk(
      windKmh,
      rainfallMm,
      stormSurgeM,
      landfallDistanceKm,
      rapidFloodSusceptibility,
      infrastructureExposureScore,
      82 // Vulnerability baseline for estuarine delta
    );

    const eeStatus = earthEngineService.getStatus();

    const normalizedData: NormalizedOrchestratorData = {
      scenario: {
        scenarioId,
        cycloneName,
        forecastHour,
        timelineStep,
        windKmh,
        rainfallMm,
        stormSurgeM,
        landfallDistanceKm,
      },
      meteorology: {
        mode: weatherResult.mode,
        windSpeedKmh: windKmh,
        windDirectionDeg: weatherResult.wind.directionDeg,
        uMs: weatherResult.wind.uMs,
        vMs: weatherResult.wind.vMs,
        precipitationTotalMm: rainfallMm,
        precipitationRateMmPerHour: weatherResult.precipitation.rateMmPerHour,
        surfacePressureHpa: weatherResult.pressureHpa,
        source: weatherResult.source,
      },
      terrain: {
        meanElevationM: meanElevation,
        minElevationM: minElevation,
        maxElevationM: maxElevation,
        rapidFloodSusceptibility,
        coastalExposureIndex,
        surgePotentialM: stormSurgeM,
        elevationSource: envContext.dataSources[2] || 'SRTM 30m Global DEM',
      },
      landCover: {
        builtUpFraction: envContext.landCover.builtUpFraction,
        waterFraction: envContext.landCover.waterFraction,
        vegetationFraction: envContext.landCover.vegetationFraction,
        source: envContext.dataSources[1] || 'Dynamic World 10m NRT',
      },
      infrastructure: {
        totalAssetsCount: allAssets.length,
        roadsExposed,
        medicalFacilitiesExposed,
        powerAssetsExposed,
        sheltersExposed,
        newlyExposedCount: Math.max(0, exposedAssets.length - 12),
        source: 'DEMO INFRASTRUCTURE DATA',
      },
      sources: {
        weather: weatherResult.mode,
        earthEngine: eeStatus.mode,
        infrastructure: 'DEMO',
      },
      riskOutputs: {
        riskScore: simulatedRiskOutput.risk_score,
        riskLevel: simulatedRiskOutput.risk_level,
        floodExposure: simulatedRiskOutput.flood_exposure,
        infrastructureExposure: simulatedRiskOutput.infrastructure_exposure ?? infrastructureExposureScore,
        hazardScore: simulatedRiskOutput.hazard_score,
      },
      timestamp: new Date().toISOString(),
    };

    logEvent('DataOrchestrator: Scenario data generated', {
      riskScore: normalizedData.riskOutputs.riskScore,
      weatherMode: normalizedData.sources.weather,
      eeMode: normalizedData.sources.earthEngine,
    });

    return normalizedData;
  }
}

export const dataOrchestrator = new DataOrchestrator();
