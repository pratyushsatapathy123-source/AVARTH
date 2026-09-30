/**
 * AVARTH Rapid-Impact Screening Model
 *
 * NOTE: PROTOTYPE DECISION-SUPPORT SCORE ONLY.
 * These weights are rapid screening heuristics, not scientifically certified warning models.
 *
 * WEIGHTS:
 * Hazard Score:
 *   35% Rainfall
 *   25% Storm Surge
 *   20% Wind Speed
 *   20% Flood Susceptibility (terrain / tidal backflow)
 *
 * Overall Risk Score:
 *   50% Hazard Score
 *   30% Infrastructure Exposure
 *   20% Vulnerability
 *
 * Normalization:
 *   0–30:   LOW
 *   31–55:  MODERATE
 *   56–75:  HIGH
 *   76–100: CRITICAL
 */

import { RiskLevel, InfrastructureAsset } from '../models/types.ts';

export const RISK_ENGINE_METADATA = {
  model_name: 'AVARTH Rapid Impact Screening Prototype v4.1',
  hazard_weights: {
    rainfall: 0.35,
    storm_surge: 0.25,
    wind: 0.20,
    flood_susceptibility: 0.20,
  },
  overall_weights: {
    hazard: 0.50,
    exposure: 0.30,
    vulnerability: 0.20,
  },
  thresholds: {
    LOW: [0, 30],
    MODERATE: [31, 55],
    HIGH: [56, 75],
    CRITICAL: [76, 100],
  },
  disclaimer: 'Prototype screening heuristics for emergency pre-landfall staging. Not an official meteorological forecast.',
};

/**
 * Normalizes 24h rainfall (mm) into 0–100 range
 * 0–100 mm: low (0-30)
 * 100–200 mm: moderate (30-65)
 * 200–300 mm: high (65-88) [220mm -> ~72, 280mm -> ~85]
 * 300+ mm: extreme (88-100)
 */
export function normalizeRainfall(mm: number): number {
  if (mm <= 0) return 0;
  if (mm < 100) {
    return Math.min(30, (mm / 100) * 30);
  } else if (mm < 200) {
    return 30 + ((mm - 100) / 100) * 35; // 30..65
  } else if (mm < 300) {
    return 65 + ((mm - 200) / 100) * 23; // 65..88 (220mm -> 69.6, 280mm -> 83.4)
  } else {
    return Math.min(100, 88 + ((mm - 300) / 150) * 12);
  }
}

/**
 * Normalizes storm surge (m) into 0–100 range
 * 0–1 m: low (0-30)
 * 1–2 m: moderate (30-65)
 * 2–3 m: high (65-90) [2.4m -> ~75, 2.8m -> ~85]
 * 3+ m: extreme (90-100)
 */
export function normalizeStormSurge(surgeM: number): number {
  if (surgeM <= 0) return 0;
  if (surgeM < 1.0) {
    return Math.min(30, surgeM * 30);
  } else if (surgeM < 2.0) {
    return 30 + (surgeM - 1.0) * 35; // 30..65
  } else if (surgeM < 3.0) {
    return 65 + (surgeM - 2.0) * 25; // 65..90 (2.4m -> 75, 2.8m -> 85)
  } else {
    return Math.min(100, 90 + ((surgeM - 3.0) / 1.5) * 10);
  }
}

/**
 * Normalizes wind speed (km/h) into 0–100 range
 * <120 km/h: low (0-30)
 * 120–160: moderate (30-65)
 * 160–200: high (65-88) [185km/h -> ~78]
 * 200+: extreme (88-100) [205km/h -> ~90]
 */
export function normalizeWind(kmh: number): number {
  if (kmh < 120) {
    return Math.max(0, Math.min(30, (kmh / 120) * 30));
  } else if (kmh < 160) {
    return 30 + ((kmh - 120) / 40) * 35; // 30..65
  } else if (kmh < 200) {
    return 65 + ((kmh - 160) / 40) * 23; // 65..88 (185km/h -> 79.4)
  } else {
    return Math.min(100, 88 + ((kmh - 200) / 60) * 12);
  }
}

/**
 * Computes terrain flood susceptibility based on proximity to coast and elevation
 */
export function getFloodSusceptibility(landfallDistKm: number, elevationMeanM: number = 2.1): number {
  // Closer to landfall + lower elevation = higher susceptibility
  const distFactor = Math.max(0, 100 - landfallDistKm * 1.5);
  const elevFactor = Math.max(10, 100 - elevationMeanM * 18);
  return Math.round(0.6 * elevFactor + 0.4 * distFactor);
}

/**
 * Computes the composite Hazard Score (0-100)
 */
export function calculateHazardScore(
  rainfallMm: number,
  stormSurgeM: number,
  windKmh: number,
  landfallDistKm: number
): number {
  const normRain = normalizeRainfall(rainfallMm);
  const normSurge = normalizeStormSurge(stormSurgeM);
  const normWind = normalizeWind(windKmh);
  const normFlood = getFloodSusceptibility(landfallDistKm);

  const rawHazard =
    0.35 * normRain +
    0.25 * normSurge +
    0.20 * normWind +
    0.20 * normFlood;

  return Math.min(100, Math.max(0, Math.round(rawHazard)));
}

/**
 * Classifies a numerical risk score (0-100) into standard AVARTH levels
 */
export function classifyRiskLevel(score: number): RiskLevel {
  if (score <= 30) return 'LOW';
  if (score <= 55) return 'MODERATE';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
}

/**
 * Computes composite sector risk score
 */
export function calculateCompositeSectorRisk(
  hazardScore: number,
  exposurePct: number,
  vulnerabilityPct: number
): { riskScore: number; riskLevel: RiskLevel } {
  const composite = 0.50 * hazardScore + 0.30 * exposurePct + 0.20 * vulnerabilityPct;
  const rounded = Math.min(100, Math.max(0, Math.round(composite)));
  return {
    riskScore: rounded,
    riskLevel: classifyRiskLevel(rounded),
  };
}

/**
 * Calculates asset-level vulnerability and dynamic risk based on scenario parameters
 */
export function evaluateAssetRisk(
  asset: InfrastructureAsset,
  scenario: { wind_kmh: number; rainfall_mm: number; storm_surge_m: number; landfall_dist_km: number }
): { risk_score: number; risk_level: RiskLevel; is_newly_exposed: boolean; status: string } {
  const rainDelta = Math.max(0, scenario.rainfall_mm - 220);
  const surgeDelta = Math.max(0, scenario.storm_surge_m - 2.4);
  const windDelta = Math.max(0, scenario.wind_kmh - 185);

  let score = asset.risk_score;

  // Escalation factors for sensitive assets under increased rain/surge
  if (asset.elevation_m < 2.5) {
    score += Math.round(surgeDelta * 10 + (rainDelta / 60) * 5);
  }
  if (asset.type === 'road') {
    score += Math.round((rainDelta / 60) * 6 + surgeDelta * 6);
  } else if (asset.type === 'power') {
    score += Math.round((windDelta / 20) * 4 + surgeDelta * 7);
  } else if (asset.type === 'medical') {
    score += Math.round(surgeDelta * 5 + (rainDelta / 60) * 4);
  }

  score = Math.min(99, Math.max(30, score));
  const risk_level = classifyRiskLevel(score);

  // Baseline threshold: if asset was <= 80 and jumps to >= 85, or specifically exposed
  const is_newly_exposed = (scenario.rainfall_mm > 240 || scenario.storm_surge_m > 2.6) &&
    (asset.id === 'MED-OD-402' || asset.id === 'TRN-NH-516' || asset.id === 'PWR-CB-104' || asset.id === 'TRN-BY-04');

  let status = asset.status;
  if (scenario.rainfall_mm >= 280) {
    if (asset.id === 'MED-OD-402') status = 'CRITICAL ISOLATION // ACCESS ROADS BREACHED';
    if (asset.id === 'TRN-NH-516') status = 'COMPLETE SUBMERSION // 1.2M INUNDATION';
    if (asset.id === 'PWR-CB-104') status = 'SURGE OVERTOPPING // TRIP IMMINENT';
  }

  return {
    risk_score: score,
    risk_level,
    is_newly_exposed,
    status,
  };
}
