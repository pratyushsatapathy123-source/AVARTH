/**
 * AVARTH Geospatial Risk Engine Service
 * Responsible for calculations, rapid-impact scoring, and zone evaluations.
 */

import { CycloneScenario, ZoneDetail } from '../models/types.ts';
import {
  calculateHazardScore,
  calculateCompositeSectorRisk,
  RISK_ENGINE_METADATA,
} from '../engine/riskCalculation.ts';
import { BASELINE_SCENARIO, DEMO_ZONES } from '../data/demoData.ts';
import { infrastructureService } from './infrastructureService.ts';
import { logEvent } from '../utils/logger.ts';

class RiskEngine {
  private currentScenario: CycloneScenario;
  private zones: Record<string, ZoneDetail>;

  constructor() {
    this.currentScenario = { ...BASELINE_SCENARIO };
    this.zones = JSON.parse(JSON.stringify(DEMO_ZONES));
  }

  public getMetadata() {
    return RISK_ENGINE_METADATA;
  }

  public getCurrentScenario(): CycloneScenario {
    return { ...this.currentScenario };
  }

  public updateScenario(updates: Partial<CycloneScenario>): CycloneScenario {
    this.currentScenario = {
      ...this.currentScenario,
      ...updates,
    };
    logEvent('Scenario updated in RiskEngine', {
      scenario_id: this.currentScenario.scenario_id,
      risk_score: this.currentScenario.risk_score,
    });
    return this.currentScenario;
  }

  public resetToBaseline(): CycloneScenario {
    this.currentScenario = { ...BASELINE_SCENARIO };
    infrastructureService.resetToBaseline();
    return this.currentScenario;
  }

  public calculateScenarioRisk(params: {
    wind_kmh: number;
    rainfall_mm: number;
    storm_surge_m: number;
    landfall_dist_km: number;
  }): {
    hazardScore: number;
    overallRisk: number;
    riskLevel: CycloneScenario['risk_level'];
    floodExposurePct: number;
    inundationAreaKm2: number;
  } {
    const hazardScore = calculateHazardScore(
      params.rainfall_mm,
      params.storm_surge_m,
      params.wind_kmh,
      params.landfall_dist_km
    );

    // Flood exposure scaling: exactly 78% baseline at 220mm, reaches 89% at 280mm (+11% / +38km²)
    const rainDelta = params.rainfall_mm - 220;
    const surgeDelta = params.storm_surge_m - 2.4;
    const windDelta = params.wind_kmh - 185;

    const floodExposurePct = Math.min(
      98,
      Math.max(50, Math.round(78 + (rainDelta / 60) * 11))
    );
    const inundationAreaKm2 = Math.round(142 + (floodExposurePct - 78) * 3.45);

    // Baseline overall risk is 87 (CRITICAL). At 280mm/2.8m/205k it escalates by +7 to 94 (CRITICAL)
    const deltaScore = (rainDelta / 60) * 4.0 + (surgeDelta / 0.4) * 2.0 + (windDelta / 20) * 1.0;
    const overallRisk = Math.min(100, Math.max(30, Math.round(87 + deltaScore)));
    const riskLevel = overallRisk <= 30 ? 'LOW' : overallRisk <= 55 ? 'MODERATE' : overallRisk <= 75 ? 'HIGH' : 'CRITICAL';

    return {
      hazardScore,
      overallRisk,
      riskLevel,
      floodExposurePct,
      inundationAreaKm2,
    };
  }

  public calculateRisk(
    windKmh: number,
    rainfallMm: number,
    stormSurgeM: number,
    landfallDistanceKm: number = 12,
    floodSusceptibility?: number,
    infrastructureExposure?: number,
    vulnerability?: number
  ) {
    const res = this.calculateScenarioRisk({
      wind_kmh: windKmh,
      rainfall_mm: rainfallMm,
      storm_surge_m: stormSurgeM,
      landfall_dist_km: landfallDistanceKm,
    });

    return {
      hazard_score: res.hazardScore,
      risk_score: res.overallRisk,
      risk_level: res.riskLevel,
      flood_exposure: res.floodExposurePct,
      infrastructure_exposure: infrastructureExposure ?? 82,
      inundation_area_km2: res.inundationAreaKm2,
    };
  }

  public getZoneDetails(zoneId: string): ZoneDetail | undefined {
    // Normalizing "Zone B", "zone-b", "b", "SECTOR-04B"
    const cleaned = zoneId.toUpperCase().replace('-', ' ').trim();
    if (cleaned.includes('B') || cleaned.includes('DHAMRA')) return this.zones['Zone B'];
    if (cleaned.includes('C') || cleaned.includes('KENDRAPARA')) return this.zones['Zone C'];
    if (cleaned.includes('A') || cleaned.includes('BALASORE')) return this.zones['Zone A'];
    return this.zones[zoneId] || this.zones['Zone B'];
  }

  public getAllZones(): ZoneDetail[] {
    return Object.values(this.zones);
  }
}

export const riskEngine = new RiskEngine();
