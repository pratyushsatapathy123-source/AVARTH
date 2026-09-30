import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import type {
  InfrastructureAsset,
  ZoneDetail,
  Advisory,
  AlertItem,
  AIAnalysisResponse,
} from '../../server/models/types.ts';
import {
  SharedScenario,
  SimulationResultCore,
  ForecastState,
  RiskLevel,
} from '../core/types.ts';
import {
  BASELINE_SCENARIO,
  BASELINE_OUTPUT,
  calculateRisk as coreCalculateRisk,
  runSimulation as coreRunSimulation,
} from '../core/riskEngine.ts';
import { FORECAST_STATES } from '../core/forecastStates.ts';
import {
  DEMO_INFRASTRUCTURE,
  DEMO_ZONES,
  DEMO_ADVISORY,
  DEMO_ALERTS,
} from '../../server/data/demoData.ts';

// Full merged scenario model supporting both camelCase and legacy snake_case
export interface ExtendedScenario extends SharedScenario {
  // Calculated outputs
  riskScore: number;
  riskLevel: RiskLevel;
  floodExposure: number;
  roadsExposed: number;
  medicalFacilitiesExposed: number;
  powerAssetsExposed: number;
  sheltersExposed: number;
  inundationAreaKm2: number;
  criticalAssetsEndangered: number;

  // Legacy snake_case compatibility
  scenario_id: string;
  name: string;
  classification: string;
  wind_kmh: number;
  wind_gusts_kmh: number;
  rainfall_mm: number;
  storm_surge_m: number;
  landfall_distance_km: number;
  forecast_hour: number;
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

interface SimulationParams {
  windKmh?: number;
  rainfallMm?: number;
  stormSurgeM?: number;
  landfallDistanceKm?: number;
  wind_kmh?: number;
  rainfall_mm?: number;
  storm_surge_m?: number;
  landfall_distance_km?: number;
  forecastHour?: number;
}

export interface EnvironmentalContextState {
  mode: 'LIVE' | 'DEMO';
  elevation: {
    meanM: number;
    minM: number;
    maxM: number;
  };
  landCover: {
    builtUpFraction: number;
    waterFraction: number;
    vegetationFraction: number;
  };
  dataSources: string[];
  timestamp: string;
  aoiName?: string;
  satelliteContext?: {
    platform: string;
    radarBackscatterDeltaDb?: number;
    sceneDate?: string;
    status: string;
  };
}

export interface EnvironmentalLayerMetadata {
  layer: string;
  source: string;
  mode: string;
  updatedAt: string;
  available: boolean;
  description: string;
}

export interface SystemHealthStatus {
  status: string;
  services: {
    gemini: string;
    earthEngine: string;
    meteorology: string;
    riskEngine: string;
  };
  mode?: string;
  timestamp?: string;
}

export interface AttributionItem {
  dataset: string;
  provider: string;
  catalogId: string;
  resolution: string;
  purpose: string;
}

interface ScenarioContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;

  // Centralized scenario state
  scenario: ExtendedScenario;
  sharedScenario: SharedScenario;

  // Simulation engine & results
  simulationResult: SimulationResultCore;
  isSimulating: boolean;
  isForecasting: boolean;
  calculateRisk: typeof coreCalculateRisk;
  runSimulation: (params: SimulationParams) => SimulationResultCore;
  resetToBaseline: () => void;

  // Forecast states & timeline
  forecastStates: ForecastState[];
  activeForecastStep: number;
  activeForecastState: ForecastState;
  setForecastStep: (step: number | string) => void;
  runForecastSimulation: () => Promise<void>;

  // Ancillary operational state
  zones: Record<string, ZoneDetail>;
  selectedZone: ZoneDetail | null;
  setSelectedZoneId: (id: string) => void;
  assets: InfrastructureAsset[];
  selectedAsset: InfrastructureAsset | null;
  setSelectedAssetId: (id: string) => void;
  currentAdvisory: Advisory | null;
  alerts: AlertItem[];
  dispatchNotification: { show: boolean; message: string; timestamp: string } | null;
  dismissDispatchNotification: () => void;
  dispatchAdvisory: (advisoryId?: string) => Promise<void>;
  askAIAnalyst: (question: string) => Promise<AIAnalysisResponse>;
  refreshInfrastructure: (filters?: Record<string, string>) => Promise<void>;

  // Phase 3: Environmental & Meteorological Telemetry
  environmentalContext: EnvironmentalContextState | null;
  environmentalLayers: EnvironmentalLayerMetadata[];
  systemHealth: SystemHealthStatus | null;
  attributions: AttributionItem[];
  isEnvironmentalLoading: boolean;
  refreshEnvironmentalData: () => Promise<void>;
  showAttributionModal: boolean;
  setShowAttributionModal: (show: boolean) => void;
}

const ScenarioContext = createContext<ScenarioContextType | undefined>(undefined);

function buildExtendedScenario(
  base: SharedScenario,
  sim: SimulationResultCore
): ExtendedScenario {
  return {
    ...base,
    riskScore: sim.riskScore,
    riskLevel: sim.riskLevel,
    floodExposure: sim.floodExposure,
    roadsExposed: sim.roadsExposed,
    medicalFacilitiesExposed: sim.medicalFacilitiesExposed,
    powerAssetsExposed: sim.powerAssetsExposed,
    sheltersExposed: sim.sheltersExposed,
    inundationAreaKm2: Math.round(142 + (sim.floodExposure - 78) * 3.5),
    criticalAssetsEndangered:
      sim.roadsExposed +
      sim.medicalFacilitiesExposed +
      sim.powerAssetsExposed +
      sim.sheltersExposed,

    // Snake_case aliases
    scenario_id: base.scenarioId,
    name: base.cycloneName,
    classification: 'CAT 4 EQUIVALENT',
    wind_kmh: base.windKmh,
    wind_gusts_kmh: Math.round(base.windKmh * 1.16),
    rainfall_mm: base.rainfallMm,
    storm_surge_m: base.stormSurgeM,
    landfall_distance_km: base.landfallDistanceKm,
    forecast_hour: Math.abs(base.forecastHour),
    central_pressure_hpa: Math.round(980 - (base.windKmh - 120) * 0.42),
    drift: 'NNW @ 14 KM/H',
    risk_score: sim.riskScore,
    risk_level: sim.riskLevel,
    flood_exposure: sim.floodExposure,
    inundation_area_km2: Math.round(142 + (sim.floodExposure - 78) * 3.5),
    critical_assets_endangered:
      sim.roadsExposed +
      sim.medicalFacilitiesExposed +
      sim.powerAssetsExposed +
      sim.sheltersExposed,
    population_in_cone: '1.42M',
    evac_target: '280K',
    mode: 'DEMO',
  };
}

export const ScenarioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('command-center');

  // Shared Scenario state (pure client-side state)
  const [sharedScenario, setSharedScenario] = useState<SharedScenario>({
    ...BASELINE_SCENARIO,
  });

  // Active Forecast Timeline Step
  const [activeForecastStep, setActiveForecastStep] = useState<number>(0);

  // Simulation Result State
  const initialSimResult = useMemo(() => coreRunSimulation(BASELINE_SCENARIO), []);
  const [simulationResult, setSimulationResult] = useState<SimulationResultCore>(initialSimResult);

  // Extended scenario (derived)
  const [scenario, setScenario] = useState<ExtendedScenario>(() =>
    buildExtendedScenario(BASELINE_SCENARIO, initialSimResult)
  );

  // UI state
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [isForecasting, setIsForecasting] = useState<boolean>(false);

  // Zones & Assets
  const [zones, setZones] = useState<Record<string, ZoneDetail>>(() => DEMO_ZONES);
  const [selectedZone, setSelectedZone] = useState<ZoneDetail | null>(
    () => DEMO_ZONES['Zone B'] || Object.values(DEMO_ZONES)[0] || null
  );

  const [assets, setAssets] = useState<InfrastructureAsset[]>(() => DEMO_INFRASTRUCTURE);
  const [selectedAsset, setSelectedAsset] = useState<InfrastructureAsset | null>(
    () => DEMO_INFRASTRUCTURE.find(a => a.id === 'MED-OD-402') || DEMO_INFRASTRUCTURE[0]
  );

  const [currentAdvisory, setCurrentAdvisory] = useState<Advisory | null>(() => DEMO_ADVISORY);
  const [alerts, setAlerts] = useState<AlertItem[]>(() => DEMO_ALERTS);
  const [dispatchNotification, setDispatchNotification] = useState<{
    show: boolean;
    message: string;
    timestamp: string;
  } | null>(null);

  // Phase 3: Environmental & Meteorological Telemetry State
  const [environmentalContext, setEnvironmentalContext] = useState<EnvironmentalContextState | null>(null);
  const [environmentalLayers, setEnvironmentalLayers] = useState<EnvironmentalLayerMetadata[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealthStatus | null>(null);
  const [attributions, setAttributions] = useState<AttributionItem[]>([]);
  const [isEnvironmentalLoading, setIsEnvironmentalLoading] = useState<boolean>(false);
  const [showAttributionModal, setShowAttributionModal] = useState<boolean>(false);

  // Active forecast state
  const activeForecastState = useMemo(
    () => FORECAST_STATES[activeForecastStep] || FORECAST_STATES[0],
    [activeForecastStep]
  );

  /**
   * Refreshes environmental context, layers, and health from backend
   */
  const refreshEnvironmentalData = useCallback(async () => {
    setIsEnvironmentalLoading(true);
    try {
      const [envRes, layerRes, healthRes, attrRes] = await Promise.all([
        fetch(`/api/environment/context?forecastTime=${encodeURIComponent(activeForecastState.id)}`).catch(() => null),
        fetch('/api/map/environmental-layers').catch(() => null),
        fetch('/api/health').catch(() => null),
        fetch('/api/attributions').catch(() => null),
      ]);

      if (envRes && envRes.ok) {
        const envData = await envRes.json();
        setEnvironmentalContext(envData);
      }
      if (layerRes && layerRes.ok) {
        const layerData = await layerRes.json();
        setEnvironmentalLayers(layerData);
      }
      if (healthRes && healthRes.ok) {
        const healthData = await healthRes.json();
        setSystemHealth(healthData);
      }
      if (attrRes && attrRes.ok) {
        const attrData = await attrRes.json();
        setAttributions(attrData.attributions || []);
      }
    } catch (err) {
      console.error('Environmental data refresh error:', err);
    } finally {
      setIsEnvironmentalLoading(false);
    }
  }, [activeForecastState.id]);

  useEffect(() => {
    refreshEnvironmentalData();
  }, [refreshEnvironmentalData]);

  /**
   * Deterministic simulation runner that updates state and recalculates
   */
  const executeSimulation = useCallback((params: SimulationParams): SimulationResultCore => {
    const newWind = params.windKmh ?? params.wind_kmh ?? sharedScenario.windKmh;
    const newRain = params.rainfallMm ?? params.rainfall_mm ?? sharedScenario.rainfallMm;
    const newSurge = params.stormSurgeM ?? params.storm_surge_m ?? sharedScenario.stormSurgeM;
    const newDist = params.landfallDistanceKm ?? params.landfall_distance_km ?? sharedScenario.landfallDistanceKm;
    const newHour = params.forecastHour ?? sharedScenario.forecastHour;

    const newScenario: SharedScenario = {
      ...sharedScenario,
      windKmh: newWind,
      rainfallMm: newRain,
      stormSurgeM: newSurge,
      landfallDistanceKm: newDist,
      forecastHour: newHour,
    };

    const newSimResult = coreRunSimulation(newScenario);
    const updatedExtended = buildExtendedScenario(newScenario, newSimResult);

    setSharedScenario(newScenario);
    setSimulationResult(newSimResult);
    setScenario(updatedExtended);

    // Update asset exposure markers dynamically based on simulation
    setAssets(prevAssets =>
      prevAssets.map(asset => {
        const isNewly = newSimResult.newlyExposedAssets.some(na => na.id === asset.id);
        const newly = newSimResult.newlyExposedAssets.find(na => na.id === asset.id);

        let dynamicScore = asset.risk_score;
        let dynamicStatus = asset.status;

        if (isNewly && newly) {
          dynamicScore = newly.riskScore;
          dynamicStatus = newly.status;
        } else if (newRain >= 280) {
          if (asset.id === 'MED-OD-402') dynamicScore = 94;
          if (asset.id === 'PWR-CB-104') dynamicScore = 86;
        } else if (newRain <= 220 && newSurge <= 2.4) {
          if (asset.id === 'MED-OD-402') dynamicScore = 91;
          if (asset.id === 'PWR-CB-104') dynamicScore = 74;
        }

        return {
          ...asset,
          risk_score: dynamicScore,
          is_newly_exposed: isNewly,
          status: dynamicStatus,
        };
      })
    );

    // Notify backend simulation engine to synchronize server-side scenario state
    fetch('/api/simulation/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        wind_kmh: newWind,
        rainfall_mm: newRain,
        storm_surge_m: newSurge,
        landfall_distance_km: newDist,
        forecast_hour: newHour,
      }),
    }).catch(() => {});

    return newSimResult;
  }, [sharedScenario]);

  const runSimulation = useCallback((params: SimulationParams): SimulationResultCore => {
    setIsSimulating(true);
    const result = executeSimulation(params);
    setTimeout(() => {
      setIsSimulating(false);
    }, 250);
    return result;
  }, [executeSimulation]);

  /**
   * Updates forecast step and automatically synchronizes the shared scenario
   */
  const setForecastStep = useCallback((stepInput: number | string) => {
    let index = 0;
    if (typeof stepInput === 'string') {
      const foundIdx = FORECAST_STATES.findIndex(
        s => s.id === stepInput || s.label.toLowerCase().includes(stepInput.toLowerCase())
      );
      index = foundIdx >= 0 ? foundIdx : 0;
    } else {
      index = Math.max(0, Math.min(FORECAST_STATES.length - 1, stepInput));
    }

    setActiveForecastStep(index);
    const state = FORECAST_STATES[index];

    executeSimulation({
      windKmh: state.windKmh,
      rainfallMm: state.rainfallMm,
      stormSurgeM: state.stormSurgeM,
      landfallDistanceKm: state.landfallDistanceKm,
      forecastHour: state.forecastHour,
    });
  }, [executeSimulation]);

  /**
   * Reset back to baseline
   */
  const resetToBaseline = useCallback(() => {
    setActiveForecastStep(0);
    const baseSim = coreRunSimulation(BASELINE_SCENARIO);
    setSharedScenario({ ...BASELINE_SCENARIO });
    setSimulationResult(baseSim);
    setScenario(buildExtendedScenario(BASELINE_SCENARIO, baseSim));
    setAssets(DEMO_INFRASTRUCTURE);
    setSelectedZone(DEMO_ZONES['Zone B'] || Object.values(DEMO_ZONES)[0] || null);
    setSelectedAsset(DEMO_INFRASTRUCTURE.find(a => a.id === 'MED-OD-402') || DEMO_INFRASTRUCTURE[0]);
    setCurrentAdvisory(DEMO_ADVISORY);
    setAlerts(DEMO_ALERTS);

    // Notify backend
    fetch('/api/scenario/reset', { method: 'POST' }).catch(() => {});
  }, []);

  const runForecastSimulation = useCallback(async () => {
    setIsForecasting(true);
    try {
      // Step to next forecast step or T-24H
      const nextStep = (activeForecastStep + 1) % FORECAST_STATES.length;
      setForecastStep(nextStep);
    } finally {
      setIsForecasting(false);
    }
  }, [activeForecastStep, setForecastStep]);

  const setSelectedZoneId = useCallback((id: string) => {
    if (zones[id]) setSelectedZone(zones[id]);
  }, [zones]);

  const setSelectedAssetId = useCallback((id: string) => {
    const found = assets.find(a => a.id === id);
    if (found) setSelectedAsset(found);
  }, [assets]);

  const refreshInfrastructure = useCallback(async (filters?: Record<string, string>) => {
    // Client-side instant filter refresh
    if (!filters) {
      setAssets(DEMO_INFRASTRUCTURE);
      return;
    }
  }, []);

  const dispatchAdvisory = useCallback(async (advisoryId?: string) => {
    const id = advisoryId || currentAdvisory?.advisory_id || 'SEOC/OD/VARUN-04/DIR-09';
    const nowTime = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST';
    setDispatchNotification({
      show: true,
      message: `DISPATCH SIMULATED — Operational directive ${id} transmitted to simulated multi-agency queue.`,
      timestamp: nowTime,
    });
    if (currentAdvisory) {
      setCurrentAdvisory({
        ...currentAdvisory,
        status: 'DISPATCH_SIMULATED',
      });
    }
  }, [currentAdvisory]);

  const dismissDispatchNotification = useCallback(() => {
    setDispatchNotification(null);
  }, []);

  const askAIAnalyst = useCallback(async (question: string): Promise<AIAnalysisResponse> => {
    try {
      const res = await fetch('/api/ai/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          scenario,
          zone_id: selectedZone?.id,
          asset_id: selectedAsset?.id,
        }),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Fallback client reasoning
    }

    // Client-side structured reasoning fallback
    const riskDiff = simulationResult.delta.riskScoreDelta;
    return {
      summary:
        riskDiff > 0
          ? `Composite risk has escalated by +${riskDiff} points to ${scenario.riskScore}/100 (${scenario.riskLevel}) under simulated parameter surge.`
          : `Baseline sector risk remains at ${scenario.riskScore}/100 (${scenario.riskLevel}).`,
      risk_level: scenario.riskLevel,
      risk_score: scenario.riskScore,
      primary_concern: 'Reduced access to critical healthcare infrastructure and arterial road breach.',
      risk_interpretation: `Risk shifted from 87 to ${scenario.riskScore} because 24h precipitation is at ${scenario.rainfallMm}mm and storm surge is +${scenario.stormSurgeM}m.`,
      risk_drivers: [
        { factor: '24h Precipitation', severity: 'HIGH', evidence: `${scenario.rainfallMm}mm basin accumulation` },
        { factor: 'Storm Surge', severity: 'CRITICAL', evidence: `+${scenario.stormSurgeM}m at high-tide` },
      ],
      vulnerable_assets: [
        { asset_id: 'MED-OD-402', asset_name: 'Regional Medical Center', risk_score: scenario.rainfallMm >= 280 ? 94 : 91, primary_concern: 'Access road submerged' },
      ],
      impact_pathway: [
        `Heavy rainfall (${scenario.rainfallMm}mm) accumulation coastal basin`,
        `Estuary backflow drainage choking at high tide (+${scenario.stormSurgeM}m surge)`,
        `Arterial road disruption: ${simulationResult.roadsExposed} roads submerged`,
        `Medical isolation: ${simulationResult.medicalFacilitiesExposed} facilities cut off`,
      ],
      scenario_change: {
        baseline_risk: 87,
        simulated_risk: scenario.riskScore,
        risk_delta: riskDiff,
        newly_exposed_assets: simulationResult.newlyExposedAssets.length,
      },
      recommended_actions: [
        'Prepare alternate inland medical access bypass Route R-4.',
        'Pre-position high-capacity dewatering pump units at Sector 7 culverts.',
        'Issue pre-emptive trip advisory for Chandbali 132kV substation prior to saline contact.',
      ],
      uncertainty: '±4% based on SLOSH hydrodynamic calibration',
      advisory_text: `Official directive: Sector-04B at ${scenario.riskScore}/100 (${scenario.riskLevel}).`,
      simulated_delta: {
        baseline_risk: 87,
        simulated_risk: scenario.riskScore,
        risk_delta: riskDiff,
        newly_exposed_count: simulationResult.newlyExposedAssets.length,
      },
    };
  }, [scenario, selectedZone, selectedAsset, simulationResult]);

  return (
    <ScenarioContext.Provider
      value={{
        activeTab,
        setActiveTab,
        scenario,
        sharedScenario,
        simulationResult,
        isSimulating,
        isForecasting,
        calculateRisk: coreCalculateRisk,
        runSimulation,
        resetToBaseline,
        forecastStates: FORECAST_STATES,
        activeForecastStep,
        activeForecastState,
        setForecastStep,
        runForecastSimulation,
        zones,
        selectedZone,
        setSelectedZoneId,
        assets,
        selectedAsset,
        setSelectedAssetId,
        currentAdvisory,
        alerts,
        dispatchNotification,
        dismissDispatchNotification,
        dispatchAdvisory,
        askAIAnalyst,
        refreshInfrastructure,
        environmentalContext,
        environmentalLayers,
        systemHealth,
        attributions,
        isEnvironmentalLoading,
        refreshEnvironmentalData,
        showAttributionModal,
        setShowAttributionModal,
      }}
    >
      {children}
    </ScenarioContext.Provider>
  );
};

export const useScenario = () => {
  const context = useContext(ScenarioContext);
  if (!context) {
    throw new Error('useScenario must be used within a ScenarioProvider');
  }
  return context;
};
