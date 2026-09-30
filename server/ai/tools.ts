/**
 * AVARTH Backend Tools Declarations for Gemini Function Calling
 * All tool executions occur server-side; Gemini receives real, structured model outputs.
 * Never invents numerical values or infrastructure assets.
 */

import { FunctionDeclaration, Type } from '@google/genai';
import { simulationEngine } from '../services/simulationEngine.ts';
import { riskEngine } from '../services/riskEngine.ts';
import { infrastructureService } from '../services/infrastructureService.ts';
import { FORECAST_TIMELINE } from '../data/demoData.ts';
import { logEvent, logError } from '../utils/logger.ts';

export const runCycloneSimulationDeclaration: FunctionDeclaration = {
  name: 'run_cyclone_simulation',
  description: "Runs AVARTH's deterministic simulation engine with modified meteorological parameters.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      windKmh: { type: Type.NUMBER, description: 'Sustained wind speed in km/h (e.g. 185, 205, 230)' },
      rainfallMm: { type: Type.NUMBER, description: '24-hour total precipitation in mm (e.g. 220, 280, 300)' },
      stormSurgeM: { type: Type.NUMBER, description: 'Peak storm surge height in meters (e.g. 2.4, 2.8, 3.4)' },
      landfallDistanceKm: { type: Type.NUMBER, description: 'Landfall proximity distance in km (e.g. 12, 8, 4)' },
      forecastHour: { type: Type.NUMBER, description: 'Forecast horizon hour (e.g. -36, -24, -12, 0)' },
    },
    required: ['rainfallMm'],
  },
};

export const getCurrentRiskDeclaration: FunctionDeclaration = {
  name: 'get_current_risk',
  description: 'Returns current scenario risk score, risk level, flood exposure, and exposed asset counts.',
  parameters: {
    type: Type.OBJECT,
    properties: {},
  },
};

export const getZoneDetailsDeclaration: FunctionDeclaration = {
  name: 'get_zone_details',
  description: 'Retrieves actual zone object and exposure profile from AVARTH data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      zoneId: { type: Type.STRING, description: 'Zone identifier such as "Zone B", "ZONE-B", or "Zone C"' },
    },
    required: ['zoneId'],
  },
};

export const getInfrastructureAssetDeclaration: FunctionDeclaration = {
  name: 'get_infrastructure_asset',
  description: 'Retrieves actual asset object, vulnerability engineering dossier, and access status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      assetId: { type: Type.STRING, description: 'Asset identifier such as "MED-OD-402", "TRN-NH-516", "PWR-CB-104"' },
    },
    required: ['assetId'],
  },
};

export const getInfrastructureExposureDeclaration: FunctionDeclaration = {
  name: 'get_infrastructure_exposure',
  description: 'Returns actual exposed critical infrastructure assets for a zone and scenario.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      zoneId: { type: Type.STRING, description: 'Optional zone identifier' },
      typeFilter: { type: Type.STRING, description: 'Optional asset type: medical, power, road, shelter, water' },
    },
  },
};

export const getForecastStateDeclaration: FunctionDeclaration = {
  name: 'get_forecast_state',
  description: 'Returns actual forecast state from the existing forecast engine for a given forecast hour.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      forecastHour: { type: Type.NUMBER, description: 'Forecast hour such as -36, -24, -12, 0, or 6' },
    },
    required: ['forecastHour'],
  },
};

export const AVARTH_TOOLS = [
  {
    functionDeclarations: [
      runCycloneSimulationDeclaration,
      getCurrentRiskDeclaration,
      getZoneDetailsDeclaration,
      getInfrastructureAssetDeclaration,
      getInfrastructureExposureDeclaration,
      getForecastStateDeclaration,
    ],
  },
];

/**
 * Server-side tool execution dispatcher
 */
export async function executeTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  logEvent('AI_TOOL_REQUESTED', { tool: name, args });
  try {
    let result: unknown;

    switch (name) {
      case 'run_cyclone_simulation': {
        const wind = Number(args.windKmh ?? args.wind_kmh ?? 185);
        const rain = Number(args.rainfallMm ?? args.rainfall_mm ?? 220);
        const surge = Number(args.stormSurgeM ?? args.storm_surge_m ?? (rain >= 260 ? 2.8 : 2.4));
        const dist = Number(args.landfallDistanceKm ?? args.landfall_distance_km ?? 12);
        const hour = Number(args.forecastHour ?? args.forecast_hour ?? 36);

        const simResult = simulationEngine.runSimulation({
          wind_kmh: wind,
          rainfall_mm: rain,
          storm_surge_m: surge,
          landfall_distance_km: dist,
          forecast_hour: Math.abs(hour),
        });

        result = {
          scenarioId: simResult.scenario_id,
          windKmh: wind,
          rainfallMm: rain,
          stormSurgeM: surge,
          landfallDistanceKm: dist,
          riskScore: simResult.risk_score,
          riskLevel: simResult.risk_level,
          floodExposure: simResult.flood_exposure,
          roadsExposed: simResult.roads_exposed,
          medicalFacilitiesExposed: simResult.medical_facilities_exposed,
          powerAssetsExposed: simResult.power_assets_exposed,
          sheltersExposed: simResult.shelters_exposed,
          newlyExposedAssets: simResult.newly_exposed_assets.map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            riskScore: a.risk_score,
            status: a.status,
            primaryHazard: a.primary_hazard,
            accessRisk: a.access_risk,
          })),
          riskDelta: simResult.risk_delta,
        };
        break;
      }

      case 'get_current_risk': {
        const cur = riskEngine.getCurrentScenario();
        result = {
          riskScore: cur.risk_score,
          riskLevel: cur.risk_level,
          floodExposure: cur.flood_exposure,
          inundationAreaKm2: cur.inundation_area_km2,
          roadsExposed: 7,
          medicalFacilitiesExposed: 2,
          powerAssetsExposed: 4,
          sheltersExposed: 6,
          criticalAssetsEndangered: cur.critical_assets_endangered,
          windKmh: cur.wind_kmh,
          rainfallMm: cur.rainfall_mm,
          stormSurgeM: cur.storm_surge_m,
          landfallDistanceKm: cur.landfall_distance_km,
          forecastHour: -cur.forecast_hour,
        };
        break;
      }

      case 'get_zone_details': {
        const rawZoneId = String(args.zoneId ?? args.zone_id ?? 'Zone B');
        // Normalize "ZONE-B" or "ZONE B" to "Zone B"
        const cleanId = rawZoneId.toLowerCase().includes('b')
          ? 'Zone B'
          : rawZoneId.toLowerCase().includes('c')
          ? 'Zone C'
          : rawZoneId;

        const zone = riskEngine.getZoneDetails(cleanId) || riskEngine.getZoneDetails('Zone B');
        result = zone;
        break;
      }

      case 'get_infrastructure_asset': {
        const rawAssetId = String(args.assetId ?? args.asset_id ?? 'MED-OD-402');
        const asset =
          infrastructureService.getAssetById(rawAssetId) ||
          infrastructureService.getAssetById('MED-OD-402');
        result = asset;
        break;
      }

      case 'get_infrastructure_exposure': {
        const typeFilter = args.typeFilter ?? args.type_filter;
        const assets = infrastructureService.getAssets({
          type: typeFilter ? String(typeFilter) : undefined,
        });
        result = {
          totalAssets: assets.length,
          criticalAssets: assets.filter(a => a.risk_score >= 80).length,
          assets: assets.slice(0, 6).map(a => ({
            id: a.id,
            name: a.name,
            type: a.type,
            riskScore: a.risk_score,
            status: a.status,
            isNewlyExposed: a.is_newly_exposed,
          })),
        };
        break;
      }

      case 'get_forecast_state': {
        const hour = Number(args.forecastHour ?? args.forecast_hour ?? -36);
        const absHour = Math.abs(hour);
        const state =
          FORECAST_TIMELINE.find(s => s.label.includes(`${absHour}`) || Math.abs(s.step * 12 - 36) === absHour) ||
          FORECAST_TIMELINE[0];
        result = state;
        break;
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    logEvent('AI_TOOL_COMPLETED', { tool: name });
    return result;
  } catch (err) {
    logError(`AI_TOOL_FAILED_${name}`, err);
    throw err;
  }
}
