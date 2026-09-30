/**
 * AVARTH Rapid-Impact Screening Risk Engine (Phase 1 Functional Core)
 *
 * Deterministic client-side risk screening formula:
 *
 * Hazard Score (0–100):
 *   35% Rainfall
 *   25% Storm Surge
 *   20% Wind Speed
 *   20% Flood Susceptibility (terrain / distance / tidal backflow)
 *
 * Overall Risk Score (0–100):
 *   50% Hazard Score
 *   30% Infrastructure Exposure
 *   20% Vulnerability
 *
 * Risk Level Thresholds:
 *   0–30:   LOW
 *   31–55:  MODERATE
 *   56–75:  HIGH
 *   76–100: CRITICAL
 *
 * DISCLAIMER:
 * Prototype decision-support screening model for emergency pre-landfall staging.
 * Simulated scenario values — not official meteorological forecasts.
 */

import {
  RiskLevel,
  SharedScenario,
  EnvironmentalInputs,
  NewlyExposedAsset,
  SimulationResultCore,
} from './types.ts';

export const BASELINE_SCENARIO: SharedScenario = {
  scenarioId: 'AV-VARUN-04',
  cycloneName: 'CYCLONE VARUN',
  region: 'BAY OF BENGAL / SECTOR-04',
  windKmh: 185,
  rainfallMm: 220,
  stormSurgeM: 2.4,
  landfallDistanceKm: 12,
  forecastHour: -36,
};

export const BASELINE_OUTPUT = {
  riskScore: 87,
  riskLevel: 'CRITICAL' as RiskLevel,
  floodExposure: 78,
  roadsExposed: 7,
  medicalFacilitiesExposed: 2,
  powerAssetsExposed: 4,
  sheltersExposed: 6,
};

/**
 * Normalizes 24h rainfall (mm) into 0–100 range.
 * Baseline (220mm) maps to 75.0.
 */
export function normalizeRainfall(mm: number): number {
  if (mm <= 0) return 0;
  if (mm < 100) {
    return Math.min(30, (mm / 100) * 30);
  } else if (mm < 220) {
    // 100..220 -> 30..75 (slope = 45 / 120 = 0.375)
    return 30 + ((mm - 100) / 120) * 45;
  } else if (mm < 280) {
    // 220..280 -> 75..88 (slope = 13 / 60 = ~0.216)
    return 75 + ((mm - 220) / 60) * 13;
  } else {
    // 280..450 -> 88..100
    return Math.min(100, 88 + ((mm - 280) / 170) * 12);
  }
}

/**
 * Normalizes peak storm surge (m) into 0–100 range.
 * Baseline (2.4m) maps to 75.0.
 */
export function normalizeStormSurge(surgeM: number): number {
  if (surgeM <= 0) return 0;
  if (surgeM < 1.0) {
    return Math.min(30, surgeM * 30);
  } else if (surgeM < 2.4) {
    // 1.0..2.4 -> 30..75 (slope = 45 / 1.4 = ~32.14)
    return 30 + ((surgeM - 1.0) / 1.4) * 45;
  } else if (surgeM < 2.8) {
    // 2.4..2.8 -> 75..87
    return 75 + ((surgeM - 2.4) / 0.4) * 12;
  } else {
    // 2.8..4.5 -> 87..100
    return Math.min(100, 87 + ((surgeM - 2.8) / 1.7) * 13);
  }
}

/**
 * Normalizes sustained wind speed (km/h) into 0–100 range.
 * Baseline (185 km/h) maps to 75.0.
 */
export function normalizeWind(kmh: number): number {
  if (kmh <= 60) return 0;
  if (kmh < 120) {
    return Math.min(30, ((kmh - 60) / 60) * 30);
  } else if (kmh < 185) {
    // 120..185 -> 30..75 (slope = 45 / 65)
    return 30 + ((kmh - 120) / 65) * 45;
  } else if (kmh < 205) {
    // 185..205 -> 75..86
    return 75 + ((kmh - 185) / 20) * 11;
  } else {
    // 205..260 -> 86..100
    return Math.min(100, 86 + ((kmh - 205) / 55) * 14);
  }
}

/**
 * Normalizes terrain / compound flood susceptibility based on proximity and tidal forcing.
 * Baseline (12 km, 2.4m surge) maps to 75.0.
 */
export function normalizeFloodSusceptibility(
  landfallDistKm: number,
  surgeM: number,
  rainfallMm: number
): number {
  const distPenalty = (landfallDistKm - 12) * 0.5; // closer distance increases susceptibility
  const surgeEffect = (surgeM - 2.4) * 15;
  const rainEffect = (rainfallMm - 220) * 0.08;
  const raw = 75 + surgeEffect + rainEffect - distPenalty;
  return Math.min(100, Math.max(10, Math.round(raw * 10) / 10));
}

/**
 * Classifies 0–100 numerical score into standard AVARTH risk level.
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 55) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Core function: calculateRisk(scenario, envOverrides?)
 * Computes deterministic hazard and overall risk.
 */
export function calculateRisk(
  scenario: SharedScenario,
  envOverrides?: EnvironmentalInputs
): {
  riskScore: number;
  riskLevel: RiskLevel;
  hazardScore: number;
  floodSusceptibility: number;
  infrastructureExposure: number;
  vulnerability: number;
} {
  const normRain = normalizeRainfall(scenario.rainfallMm);
  const normSurge = normalizeStormSurge(scenario.stormSurgeM);
  const normWind = normalizeWind(scenario.windKmh);
  const normFlood =
    envOverrides?.floodSusceptibility !== undefined
      ? envOverrides.floodSusceptibility
      : normalizeFloodSusceptibility(
          scenario.landfallDistanceKm,
          scenario.stormSurgeM,
          scenario.rainfallMm
        );

  // 35% rainfall, 25% surge, 20% wind, 20% flood susceptibility
  const hazardScore =
    0.35 * normRain + 0.25 * normSurge + 0.2 * normWind + 0.2 * normFlood;

  // Infrastructure exposure and vulnerability
  // At baseline: hazard=75.0, infraExposure=97, vulnerability=100 -> 0.5*75 + 0.3*97 + 0.2*100 = 86.6 -> 87
  const baseInfraExposure = 97;
  const infraExposure =
    envOverrides?.infrastructureExposure !== undefined
      ? envOverrides.infrastructureExposure
      : Math.min(
          100,
          Math.max(
            30,
            baseInfraExposure +
              (scenario.stormSurgeM - 2.4) * 4 +
              (scenario.rainfallMm - 220) * 0.04
          )
        );

  const vulnerability =
    envOverrides?.vulnerability !== undefined ? envOverrides.vulnerability : 100;

  // Overall: 50% hazard, 30% infrastructure exposure, 20% vulnerability
  const rawRisk = 0.5 * hazardScore + 0.3 * infraExposure + 0.2 * vulnerability;
  const riskScore = Math.min(100, Math.max(1, Math.round(rawRisk)));
  const riskLevel = classifyRiskLevel(riskScore);

  return {
    riskScore,
    riskLevel,
    hazardScore: Math.round(hazardScore * 10) / 10,
    floodSusceptibility: Math.round(normFlood * 10) / 10,
    infrastructureExposure: Math.round(infraExposure),
    vulnerability,
  };
}

/**
 * Calculates exposed assets based on scenario parameters.
 */
export function calculateExposures(
  scenario: SharedScenario,
  riskScore: number
): {
  floodExposure: number;
  roadsExposed: number;
  medicalFacilitiesExposed: number;
  powerAssetsExposed: number;
  sheltersExposed: number;
  newlyExposedAssets: NewlyExposedAsset[];
} {
  // Flood Exposure (%) baseline = 78%
  // Scales with rainfall and surge
  const rainDelta = scenario.rainfallMm - 220;
  const surgeDelta = scenario.stormSurgeM - 2.4;
  const distDelta = 12 - scenario.landfallDistanceKm; // closer distance adds exposure

  const floodExposure = Math.min(
    99,
    Math.max(
      20,
      Math.round(78 + surgeDelta * 12 + rainDelta * 0.12 + distDelta * 0.3)
    )
  );

  // Roads exposed: baseline = 7
  const roadsExposed = Math.min(
    18,
    Math.max(2, Math.round(7 + (floodExposure - 78) * 0.35 + rainDelta * 0.025))
  );

  // Medical facilities exposed: baseline = 2
  const medicalFacilitiesExposed = Math.min(
    5,
    Math.max(1, Math.round(2 + (floodExposure - 78) * 0.08 + surgeDelta * 0.8))
  );

  // Power assets exposed: baseline = 4
  const windDelta = scenario.windKmh - 185;
  const powerAssetsExposed = Math.min(
    8,
    Math.max(1, Math.round(4 + (floodExposure - 78) * 0.12 + windDelta * 0.04))
  );

  // Shelters cut off: baseline = 6
  const sheltersExposed = Math.min(
    12,
    Math.max(2, Math.round(6 + (floodExposure - 78) * 0.15))
  );

  // Detect newly exposed critical assets
  const newlyExposedAssets: NewlyExposedAsset[] = [];

  // 1. Regional Medical & Trauma Complex
  if (medicalFacilitiesExposed > 2 || scenario.rainfallMm >= 260 || scenario.stormSurgeM >= 2.7) {
    newlyExposedAssets.push({
      id: 'MED-OD-402',
      name: 'REGIONAL MEDICAL & TRAUMA COMPLEX',
      type: 'medical',
      riskScore: Math.min(99, riskScore),
      riskDelta: Math.max(1, riskScore - 91),
      criticality: 'CRITICAL',
      status: 'CRITICAL ISOLATION // ACCESS ROADS BREACHED',
      reason: 'Low elevation alluvial silt basin; access routes cut by compound estuary backflow.',
    });
  }

  // 2. NH-516 Arterial Route
  if (roadsExposed > 7 || scenario.rainfallMm >= 250 || scenario.stormSurgeM >= 2.6) {
    newlyExposedAssets.push({
      id: 'TRN-NH-516',
      name: 'NH-516 ARTERIAL (MP 12-19)',
      type: 'road',
      riskScore: Math.min(99, riskScore - 3),
      riskDelta: Math.max(1, (riskScore - 3) - 83),
      criticality: 'CRITICAL',
      status: 'COMPLETE SUBMERSION // 1.2M INUNDATION',
      reason: 'Estuary backflow drainage choking at high tide; primary patient transport severed.',
    });
  }

  // 3. Chandbali 132kV Substation
  if (powerAssetsExposed > 4 || scenario.windKmh >= 195 || scenario.stormSurgeM >= 2.7) {
    newlyExposedAssets.push({
      id: 'PWR-CB-104',
      name: 'CHANDBALI 132kV SUBSTATION',
      type: 'power',
      riskScore: Math.min(99, riskScore - 8),
      riskDelta: Math.max(1, (riskScore - 8) - 74),
      criticality: 'HIGH',
      status: 'SURGE OVERTOPPING // TRIP IMMINENT',
      reason: 'Substation pad perimeter submerged; 18,400 households at imminent grid blackout.',
    });
  }

  // 4. Emergency Shelter #8 (if severely elevated)
  if (sheltersExposed > 6 || floodExposure >= 85) {
    newlyExposedAssets.push({
      id: 'SHL-DH-08',
      name: 'DHAMRA CYCLONE SHELTER #8',
      type: 'shelter',
      riskScore: Math.min(99, riskScore - 12),
      riskDelta: Math.max(1, (riskScore - 12) - 68),
      criticality: 'HIGH',
      status: 'PERIMETER INUNDATED // RESUPPLY CUT',
      reason: 'Access road submerged; generator fuel resupply compromised by rising floodwaters.',
    });
  }

  return {
    floodExposure,
    roadsExposed,
    medicalFacilitiesExposed,
    powerAssetsExposed,
    sheltersExposed,
    newlyExposedAssets,
  };
}

/**
 * Reusable function: runSimulation(scenario)
 * Runs deterministic simulation, compares baseline vs simulated, and returns structured result.
 */
export function runSimulation(scenario: SharedScenario): SimulationResultCore {
  const riskResult = calculateRisk(scenario);
  const exposures = calculateExposures(scenario, riskResult.riskScore);

  const baselineRisk = BASELINE_OUTPUT.riskScore; // 87
  const baselineFlood = BASELINE_OUTPUT.floodExposure; // 78
  const baselineRoads = BASELINE_OUTPUT.roadsExposed; // 7
  const baselineMedical = BASELINE_OUTPUT.medicalFacilitiesExposed; // 2
  const baselinePower = BASELINE_OUTPUT.powerAssetsExposed; // 4
  const baselineShelters = BASELINE_OUTPUT.sheltersExposed; // 6

  return {
    scenario,
    riskScore: riskResult.riskScore,
    riskLevel: riskResult.riskLevel,
    hazardScore: riskResult.hazardScore,
    floodExposure: exposures.floodExposure,
    infrastructureExposure: riskResult.infrastructureExposure,
    vulnerability: riskResult.vulnerability,
    roadsExposed: exposures.roadsExposed,
    medicalFacilitiesExposed: exposures.medicalFacilitiesExposed,
    powerAssetsExposed: exposures.powerAssetsExposed,
    sheltersExposed: exposures.sheltersExposed,
    newlyExposedAssets: exposures.newlyExposedAssets,
    delta: {
      riskScoreDelta: riskResult.riskScore - baselineRisk,
      floodExposureDelta: exposures.floodExposure - baselineFlood,
      roadsDelta: exposures.roadsExposed - baselineRoads,
      medicalDelta: exposures.medicalFacilitiesExposed - baselineMedical,
      powerDelta: exposures.powerAssetsExposed - baselinePower,
      sheltersDelta: exposures.sheltersExposed - baselineShelters,
    },
  };
}
