export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';

export interface SharedScenario {
  scenarioId: string;
  cycloneName: string;
  region: string;
  windKmh: number;
  rainfallMm: number;
  stormSurgeM: number;
  landfallDistanceKm: number;
  forecastHour: number; // e.g., -36, -24, -12, 0, 6
}

export interface EnvironmentalInputs {
  floodSusceptibility?: number; // 0-100
  infrastructureExposure?: number; // 0-100
  vulnerability?: number; // 0-100
}

export interface NewlyExposedAsset {
  id: string;
  name: string;
  type: 'road' | 'medical' | 'power' | 'shelter' | 'water';
  riskScore: number;
  riskDelta: number;
  criticality: 'CRITICAL' | 'HIGH' | 'MODERATE';
  status: string;
  reason: string;
}

export interface SimulationResultCore {
  scenario: SharedScenario;
  riskScore: number;
  riskLevel: RiskLevel;
  hazardScore: number;
  floodExposure: number;
  infrastructureExposure: number;
  vulnerability: number;
  roadsExposed: number;
  medicalFacilitiesExposed: number;
  powerAssetsExposed: number;
  sheltersExposed: number;
  newlyExposedAssets: NewlyExposedAsset[];
  delta: {
    riskScoreDelta: number;
    floodExposureDelta: number;
    roadsDelta: number;
    medicalDelta: number;
    powerDelta: number;
    sheltersDelta: number;
  };
}

export interface ForecastState {
  id: string;
  label: string;
  forecastHour: number;
  windKmh: number;
  rainfallMm: number;
  stormSurgeM: number;
  landfallDistanceKm: number;
  estimatedRisk: number;
  riskLevel: RiskLevel;
  floodExposure: number;
  roadsExposed: number;
  medicalExposed: number;
  powerExposed: number;
  sheltersExposed: number;
  coordinates: { x: number; y: number; lat: number; lng: number };
  operationalPhase: string;
  actionSummary: string;
}
