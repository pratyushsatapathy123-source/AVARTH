/**
 * AVARTH Scenario Simulator Service
 * Computes deterministic multi-hazard simulation runs and impacts on critical assets.
 */

import { SimulationResult, InfrastructureAsset } from '../models/types.ts';
import { riskEngine } from './riskEngine.ts';
import { infrastructureService } from './infrastructureService.ts';
import { BASELINE_SCENARIO } from '../data/demoData.ts';
import { logEvent } from '../utils/logger.ts';

export interface SimulationInput {
  wind_kmh: number;
  rainfall_mm: number;
  storm_surge_m: number;
  landfall_distance_km: number;
  forecast_hour?: number;
}

class SimulationEngine {
  public runSimulation(input: SimulationInput): SimulationResult {
    logEvent('simulation started', {
      wind: input.wind_kmh,
      rain: input.rainfall_mm,
      surge: input.storm_surge_m,
      distance: input.landfall_distance_km,
    });

    const baseline = BASELINE_SCENARIO;

    // Run deterministic risk calculation
    const calc = riskEngine.calculateScenarioRisk({
      wind_kmh: input.wind_kmh,
      rainfall_mm: input.rainfall_mm,
      storm_surge_m: input.storm_surge_m,
      landfall_dist_km: input.landfall_distance_km,
    });

    // Update infrastructure assets based on simulated forcing
    const updatedAssets = infrastructureService.updateForScenario({
      wind_kmh: input.wind_kmh,
      rainfall_mm: input.rainfall_mm,
      storm_surge_m: input.storm_surge_m,
      landfall_dist_km: input.landfall_distance_km,
    });

    // Count exposed assets by type under current forcing
    const rainDelta = Math.max(0, input.rainfall_mm - 220);
    const surgeDelta = Math.max(0, input.storm_surge_m - 2.4);

    // Baseline counts: 7 roads, 2 medical, 4 power, 6 shelters
    const roads_exposed = Math.min(19, Math.round(7 + (rainDelta / 60) * 5 + surgeDelta * 2));
    const medical_facilities_exposed = Math.min(3, Math.round(2 + (rainDelta / 60) * 1 + (surgeDelta > 0.3 ? 1 : 0)));
    const power_assets_exposed = Math.min(7, Math.round(4 + (rainDelta / 60) * 2 + surgeDelta * 1));
    const shelters_exposed = Math.min(10, Math.round(6 + (rainDelta / 60) * 2));

    const newly_exposed_assets: InfrastructureAsset[] = updatedAssets.filter(
      a => a.is_newly_exposed
    );

    const risk_delta = calc.overallRisk - baseline.risk_score;
    const scenario_id = `AV-SIM-${Math.round(input.rainfall_mm)}MM-${Math.round(input.wind_kmh)}K`;

    const simulatedState = {
      scenario_id,
      wind_kmh: input.wind_kmh,
      rainfall_mm: input.rainfall_mm,
      storm_surge_m: input.storm_surge_m,
      landfall_distance_km: input.landfall_distance_km,
      forecast_hour: input.forecast_hour || 36,
      risk_score: calc.overallRisk,
      risk_level: calc.riskLevel,
      flood_exposure: calc.floodExposurePct,
      inundation_area_km2: calc.inundationAreaKm2,
      critical_assets_endangered: updatedAssets.filter(a => a.risk_score >= 76).length,
    };

    // Synchronize current risk engine scenario
    riskEngine.updateScenario(simulatedState);

    logEvent('simulation completed', {
      scenario_id,
      risk_score: calc.overallRisk,
      risk_delta,
      newly_exposed_count: newly_exposed_assets.length,
    });

    return {
      scenario_id,
      risk_score: calc.overallRisk,
      risk_level: calc.riskLevel,
      flood_exposure: calc.floodExposurePct,
      roads_exposed,
      medical_facilities_exposed,
      power_assets_exposed,
      shelters_exposed,
      newly_exposed_assets,
      risk_delta,
      baseline: {
        scenario_id: baseline.scenario_id,
        wind_kmh: baseline.wind_kmh,
        rainfall_mm: baseline.rainfall_mm,
        storm_surge_m: baseline.storm_surge_m,
        risk_score: baseline.risk_score,
        risk_level: baseline.risk_level,
        flood_exposure: baseline.flood_exposure,
      },
      simulated: simulatedState,
    };
  }
}

export const simulationEngine = new SimulationEngine();
