export type RiskLevel = 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
export type AssetType = 'medical' | 'power' | 'road' | 'shelter' | 'water' | 'telecommunications';

export interface VulnerabilityFactor {
  name: string;
  weight: number;
}

export interface InfrastructureAsset {
  id: string;
  name: string;
  type: AssetType;
  criticality: 'high' | 'medium' | 'low';
  zone: string;
  sub_zone?: string;
  elevation_m: number;
  dist_to_surge_m: number;
  risk_score: number;
  risk_level: RiskLevel;
  primary_hazard: string;
  access_risk: string;
  vulnerability_factors: VulnerabilityFactor[];
  likely_consequence: string;
  recommended_preparation: string;
  coordinates: [number, number]; // [longitude, latitude]
  svg_pos: { x: number; y: number };
  status: string;
  capacity?: string;
  genset_fuel_hours?: number;
  oxygen_reserve_hours?: number;
  submersion_depth_m?: number;
  is_newly_exposed?: boolean;
}

export interface CycloneScenario {
  scenario_id: string;
  name: string;
  classification: string;
  region: string;
  forecast_hour: number;
  wind_kmh: number;
  wind_gusts_kmh: number;
  rainfall_mm: number;
  storm_surge_m: number;
  landfall_distance_km: number;
  central_pressure_hpa: number;
  drift: string;
  risk_score: number;
  risk_level: RiskLevel;
  flood_exposure: number;
  inundation_area_km2: number;
  critical_assets_endangered: number;
  population_in_cone: string;
  evac_target: string;
  mode: 'DEMO' | 'LIVE';
}

export interface SimulationResult {
  scenario_id: string;
  risk_score: number;
  risk_level: RiskLevel;
  flood_exposure: number;
  roads_exposed: number;
  medical_facilities_exposed: number;
  power_assets_exposed: number;
  shelters_exposed: number;
  newly_exposed_assets: InfrastructureAsset[];
  risk_delta: number;
  baseline: Partial<CycloneScenario>;
  simulated: Partial<CycloneScenario>;
}

export interface ForecastTimelineItem {
  step: number;
  label: string;
  time_ist: string;
  coords: { x: number; y: number; lat: number; lng: number };
  wind: string;
  wind_kmh: number;
  pressure: string;
  pressure_hpa: number;
  precip: string;
  precip_mm: number;
  surge: string;
  surge_m: number;
  risk_score_str: string;
  risk_score: number;
  flood_exposure_pct: number;
  exposed_infrastructure_count: number;
  operational_phase: string;
  action_summary: string;
}

export interface ZoneDetail {
  id: string;
  name: string;
  sub_region: string;
  risk_score: number;
  risk_level: RiskLevel;
  hazard_profile: {
    precip: string;
    surge: string;
    mean_elevation: string;
    drainage_status: string;
  };
  exposure: {
    roads: number;
    hospitals: number;
    power_grids: number;
    shelters: number;
  };
  vulnerability: string;
  impact_pathway: string[];
  priority_action: string;
  analyst_brief: string;
}

export interface TacticalDirective {
  code: string;
  title: string;
  window: string;
  directive: string;
  agency: string;
  assets: string;
}

export interface Advisory {
  advisory_id: string;
  severity: RiskLevel | 'WATCH';
  area: string;
  scenario: string;
  threat_profile: {
    wind: string;
    rain: string;
    surge: string;
    central_pressure: string;
    eta: string;
  };
  expected_impacts: string[];
  priority_actions: TacticalDirective[];
  advisory_text: string;
  issued_at: string;
  status: 'DRAFT' | 'ISSUED' | 'DISPATCH_SIMULATED';
  dispatched_at?: string;
  is_simulated: boolean;
}

export interface AlertItem {
  id: string;
  area: string;
  severity: 'critical' | 'high' | 'moderate' | 'watch';
  trigger: string;
  timestamp: string;
  status: 'ACTIVE' | 'ACTION PENDING' | 'UNDER REVIEW' | 'MONITORING';
  risk_score: number;
}

export interface AIAnalysisRequest {
  question: string;
  scenario?: Partial<CycloneScenario>;
  zone_id?: string;
  asset_id?: string;
}

export interface AIAnalysisResponse {
  summary: string;
  risk_level: RiskLevel;
  risk_score: number;
  primary_concern: string;
  risk_drivers: Array<{
    factor: string;
    severity: RiskLevel | string;
    evidence: string;
  }>;
  vulnerable_assets: Array<{
    asset_id: string;
    asset_name: string;
    risk_score: number;
    primary_concern: string;
  }>;
  impact_pathway: string[];
  scenario_change?: {
    baseline_risk: number;
    simulated_risk: number;
    risk_delta: number;
    newly_exposed_assets: number;
  };
  recommended_actions: string[];
  uncertainty: string;
  advisory_text: string;
  risk_interpretation?: string;
  simulated_delta?: {
    baseline_risk: number;
    simulated_risk: number;
    risk_delta: number;
    newly_exposed_count: number;
  };
  status?: string;
  message?: string;
}
