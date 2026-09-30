/**
 * AVARTH Gemini Decision Intelligence Service
 * Interprets structured outputs from the AVARTH risk engine and scenario engine using gemini-3.7-flash.
 * Gemini serves as the decision-intelligence layer; the numerical risk engine remains the source of truth.
 */

import { GoogleGenAI, Type, FunctionDeclaration } from '@google/genai';
import { geminiClient, GEMINI_MODEL } from '../ai/geminiClient.ts';
import { AVARTH_TOOLS, executeTool } from '../ai/tools.ts';
import { riskEngine } from './riskEngine.ts';
import { simulationEngine } from './simulationEngine.ts';
import { infrastructureService } from './infrastructureService.ts';
import { dataOrchestrator } from './dataOrchestrator.ts';
import { FORECAST_TIMELINE } from '../data/demoData.ts';
import { logEvent, logError } from '../utils/logger.ts';

export interface StructuredDecisionIntelligence {
  summary: string;
  risk_level: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  risk_score: number;
  primary_concern: string;
  risk_drivers: Array<{
    factor: string;
    severity: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    evidence: string;
  }>;
  vulnerable_assets: Array<{
    asset_id: string;
    asset_name: string;
    risk_score: number;
    primary_concern: string;
  }>;
  impact_pathway: string[];
  scenario_change: {
    baseline_risk: number;
    simulated_risk: number;
    risk_delta: number;
    newly_exposed_assets: number;
  };
  recommended_actions: string[];
  uncertainty: string;
  advisory_text: string;
  status?: string;
  message?: string;
}

export interface GeneratedAdvisoryResponse {
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'WATCH';
  area: string;
  summary: string;
  threats: string[];
  expectedImpacts: string[];
  priorityActions: string[];
  advisoryText: string;
  scenarioStatus: 'SIMULATED' | 'OFFICIAL_DEMO';
}

const SYSTEM_INSTRUCTION = `You are AVARTH Decision Intelligence, a professional analytical assistant for cyclone impact and infrastructure vulnerability assessment.

You receive structured outputs from the AVARTH risk and simulation engines.

Your responsibility is to interpret those outputs and communicate concise, operationally useful conclusions for disaster-management authorities.

The numerical risk engine is the source of truth for risk scores, exposure counts and simulation values.

Never invent numerical values.

Never invent infrastructure assets.

Never claim that simulated scenarios are official warnings.

Never claim certainty about future physical damage.

Clearly distinguish:
- forecast information
- model output
- simulated scenario
- AI interpretation
- recommended action

When explaining risk:
1. State what is happening.
2. Explain the main drivers.
3. Identify the most affected infrastructure.
4. Explain the likely impact pathway.
5. Give concise pre-landfall preparation actions.

Use evidence from the supplied structured data.

If information is missing, say that it is unavailable rather than guessing.

Use concise professional language.

Do not produce unnecessary long reports.

Do not use conversational filler.`;

const DECISION_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    risk_level: {
      type: Type.STRING,
      enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
    },
    risk_score: { type: Type.INTEGER },
    primary_concern: { type: Type.STRING },
    risk_drivers: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          factor: { type: Type.STRING },
          severity: {
            type: Type.STRING,
            enum: ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'],
          },
          evidence: { type: Type.STRING },
        },
        required: ['factor', 'severity', 'evidence'],
      },
    },
    vulnerable_assets: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          asset_id: { type: Type.STRING },
          asset_name: { type: Type.STRING },
          risk_score: { type: Type.INTEGER },
          primary_concern: { type: Type.STRING },
        },
        required: ['asset_id', 'asset_name', 'risk_score', 'primary_concern'],
      },
    },
    impact_pathway: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    scenario_change: {
      type: Type.OBJECT,
      properties: {
        baseline_risk: { type: Type.INTEGER },
        simulated_risk: { type: Type.INTEGER },
        risk_delta: { type: Type.INTEGER },
        newly_exposed_assets: { type: Type.INTEGER },
      },
      required: ['baseline_risk', 'simulated_risk', 'risk_delta', 'newly_exposed_assets'],
    },
    recommended_actions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    uncertainty: { type: Type.STRING },
    advisory_text: { type: Type.STRING },
  },
  required: [
    'summary',
    'risk_level',
    'risk_score',
    'primary_concern',
    'risk_drivers',
    'vulnerable_assets',
    'impact_pathway',
    'scenario_change',
    'recommended_actions',
    'uncertainty',
    'advisory_text',
  ],
};

const ADVISORY_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    severity: {
      type: Type.STRING,
      enum: ['CRITICAL', 'HIGH', 'MODERATE', 'WATCH'],
    },
    area: { type: Type.STRING },
    summary: { type: Type.STRING },
    threats: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    expectedImpacts: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    priorityActions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    advisoryText: { type: Type.STRING },
    scenarioStatus: {
      type: Type.STRING,
      enum: ['SIMULATED', 'OFFICIAL_DEMO'],
    },
  },
  required: [
    'severity',
    'area',
    'summary',
    'threats',
    'expectedImpacts',
    'priorityActions',
    'advisoryText',
    'scenarioStatus',
  ],
};

export class GeminiService {
  /**
   * Question routing & comprehensive impact analysis
   * POST /api/ai/analyze
   */
  public async analyzeImpact(params: {
    question: string;
    scenario?: any;
    zoneId?: string;
    assetId?: string;
  }): Promise<StructuredDecisionIntelligence> {
    logEvent('AI_ANALYSIS_REQUESTED', { question: params.question, zoneId: params.zoneId, assetId: params.assetId });

    // Step 1: Gather authentic structured backend model data
    const structuredContext = await this.resolveContextForInquiry(params);

    // Step 2: Call Gemini server-side if client available
    if (geminiClient) {
      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Gemini API timeout (9000ms)')), 9000)
        );

        const geminiCall = (async () => {
          const prompt = `QUESTION: "${params.question}"\n\nSTRUCTURED MODEL CONTEXT:\n${JSON.stringify(
            structuredContext,
            null,
            2
          )}\n\nInterpret these structured outputs concisely into the required schema. Ensure the numerical risk engine values are preserved exactly.`;

          const response = await geminiClient.models.generateContent({
            model: GEMINI_MODEL,
            contents: prompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: DECISION_RESPONSE_SCHEMA,
            },
          });

          return response.text;
        })();

        const rawText = await Promise.race([geminiCall, timeoutPromise]);

        if (rawText) {
          const parsed = JSON.parse(rawText) as StructuredDecisionIntelligence;
          const validated = this.validateAndNormalizeDecisionOutput(parsed, structuredContext);
          logEvent('GEMINI_ANALYSIS_COMPLETED', {
            risk_score: validated.risk_score,
            risk_level: validated.risk_level,
          });
          return validated;
        }
      } catch (err) {
        logError('AI_ANALYSIS_FAILED', err);
      }
    }

    // Step 3: High-fidelity deterministic fallback if Gemini is unavailable or failed
    logEvent('GEMINI_FALLBACK_ENGAGED', { reason: 'client unavailable or transient failure' });
    return this.buildDeterministicFallback(params.question, structuredContext);
  }

  /**
   * Analyze scenario changes directly
   */
  public async analyzeScenario(scenarioParams: any): Promise<StructuredDecisionIntelligence> {
    const question = `What happens if rainfall is ${scenarioParams.rainfallMm || scenarioParams.rainfall_mm} mm and wind is ${scenarioParams.windKmh || scenarioParams.wind_kmh} km/h?`;
    return this.analyzeImpact({
      question,
      scenario: scenarioParams,
    });
  }

  /**
   * Analyze specific infrastructure asset
   */
  public async analyzeAsset(assetId: string, scenario?: any): Promise<StructuredDecisionIntelligence> {
    const asset = infrastructureService.getAssetById(assetId);
    const assetName = asset ? asset.name : assetId;
    const question = `Why is ${assetName} vulnerable?`;
    return this.analyzeImpact({
      question,
      assetId,
      scenario,
    });
  }

  /**
   * Generate official authority-ready advisory text
   */
  public async generateAdvisory(params: {
    scenario?: any;
    riskOutput?: any;
    selectedZone?: string;
    exposedInfrastructure?: any;
    recommendations?: string[];
  }): Promise<GeneratedAdvisoryResponse> {
    const zoneId = params.selectedZone || 'Zone B';
    const zone = riskEngine.getZoneDetails(zoneId) || riskEngine.getZoneDetails('Zone B');
    const currentScen = params.scenario || riskEngine.getCurrentScenario();
    const riskScore = params.riskOutput?.riskScore ?? currentScen.risk_score ?? 87;
    const riskLevel = params.riskOutput?.riskLevel ?? currentScen.risk_level ?? 'CRITICAL';

    const context = {
      zone,
      scenario: currentScen,
      riskScore,
      riskLevel,
      customRecommendations: params.recommendations,
    };

    if (geminiClient) {
      try {
        const prompt = `Generate a concise operational disaster-management advisory based on this structured scenario data:\n${JSON.stringify(
          context,
          null,
          2
        )}`;

        const response = await geminiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            systemInstruction: SYSTEM_INSTRUCTION,
            temperature: 0.2,
            responseMimeType: 'application/json',
            responseSchema: ADVISORY_RESPONSE_SCHEMA,
          },
        });

        if (response.text) {
          const parsed = JSON.parse(response.text) as GeneratedAdvisoryResponse;
          return parsed;
        }
      } catch (err) {
        logError('GEMINI_ADVISORY_GENERATION_FAILED', err);
      }
    }

    // Deterministic fallback advisory
    return {
      severity: riskLevel as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'WATCH',
      area: zone?.name || 'COASTAL ZONE B',
      summary: `High-impact conditions developing along ${zone?.name || 'Zone B'}. Rainfall (${currentScen.rainfall_mm}mm) and surge (+${currentScen.storm_surge_m}m) threaten critical medical connectivity.`,
      threats: [
        `${currentScen.wind_kmh} km/h sustained wind`,
        `${currentScen.rainfall_mm} mm 24h precipitation`,
        `+${currentScen.storm_surge_m} m peak storm surge`,
      ],
      expectedImpacts: [
        'Arterial connectivity disruption on NH-516 (MP 12-19)',
        'Regional Medical Center patient transit isolation risk',
        'Chandbali 132kV substation perimeter surge overtopping',
      ],
      priorityActions: [
        'Activate alternate inland evacuation bypass route R-4.',
        'Pre-position high-capacity dewatering pump units at Sector 7 culverts.',
        'Issue pre-emptive trip advisory for vulnerable substations.',
        'Coordinate emergency medical air-evacuation buffer.',
      ],
      advisoryText: `OPERATIONAL DIRECTIVE // ${zone?.name || 'ZONE B'}: All non-essential vehicular transit on NH-516 prohibited from T-18H. Emergency teams deployed to designated sectors.`,
      scenarioStatus: 'SIMULATED',
    };
  }

  /**
   * Question routing & context resolution
   */
  private async resolveContextForInquiry(params: {
    question: string;
    scenario?: any;
    zoneId?: string;
    assetId?: string;
  }) {
    const q = params.question.toLowerCase();
    const curScen = riskEngine.getCurrentScenario();
    const orchestrated = await dataOrchestrator.getScenarioData(params.scenario);

    const environmentalContext = {
      rainfallMm: orchestrated.scenario.rainfallMm,
      windKmh: orchestrated.scenario.windKmh,
      surgeM: orchestrated.scenario.stormSurgeM,
      meanElevationM: orchestrated.terrain.meanElevationM,
      floodSusceptibility: orchestrated.terrain.rapidFloodSusceptibility,
      coastalExposureIndex: orchestrated.terrain.coastalExposureIndex,
      roadsExposed: orchestrated.infrastructure.roadsExposed,
      medicalFacilitiesExposed: orchestrated.infrastructure.medicalFacilitiesExposed,
      powerAssetsExposed: orchestrated.infrastructure.powerAssetsExposed,
      sheltersExposed: orchestrated.infrastructure.sheltersExposed,
      riskScore: orchestrated.riskOutputs.riskScore,
      sources: orchestrated.sources,
    };

    // 1. SCENARIO / WHAT-IF: rainfall/surge parameter change inquiry
    const rainMatch = params.question.match(/(\d+)\s*(?:mm|millimeter)/i);
    const windMatch = params.question.match(/(\d+)\s*(?:kmh|km\/h|km)/i);
    const surgeMatch = params.question.match(/(\d+(?:\.\d+)?)\s*(?:m|meter)\s*surge/i);

    if (rainMatch || windMatch || surgeMatch || q.includes('rainfall') || q.includes('changes at') || q.includes('what happens')) {
      const targetRain = rainMatch ? Number(rainMatch[1]) : (params.scenario?.rainfallMm ?? params.scenario?.rainfall_mm ?? 280);
      const targetWind = windMatch ? Number(windMatch[1]) : (params.scenario?.windKmh ?? params.scenario?.wind_kmh ?? 205);
      const targetSurge = surgeMatch ? Number(surgeMatch[1]) : (targetRain >= 260 ? 2.8 : 2.4);

      const simResult = (await executeTool('run_cyclone_simulation', {
        windKmh: targetWind,
        rainfallMm: targetRain,
        stormSurgeM: targetSurge,
        landfallDistanceKm: curScen.landfall_distance_km,
        forecastHour: curScen.forecast_hour,
      })) as any;

      return {
        queryType: 'SCENARIO_SIMULATION',
        baseline: {
          windKmh: 185,
          rainfallMm: 220,
          stormSurgeM: 2.4,
          landfallDistanceKm: 12,
          riskScore: 87,
          riskLevel: 'CRITICAL',
          floodExposure: 78,
          roadsExposed: 7,
          medicalFacilitiesExposed: 2,
          powerAssetsExposed: 4,
          sheltersExposed: 6,
        },
        simulated: simResult,
        environmentalSignals: environmentalContext,
      };
    }

    // 2. ASSET: inquiry about a specific facility
    if (params.assetId || q.includes('hospital') || q.includes('medical') || q.includes('substation') || q.includes('asset') || q.includes('vulnerable')) {
      let targetAssetId = params.assetId || 'MED-OD-402';
      if (q.includes('substation') || q.includes('chandbali') || q.includes('power')) {
        targetAssetId = 'PWR-CB-104';
      } else if (q.includes('road') || q.includes('nh-516') || q.includes('highway') || q.includes('route')) {
        targetAssetId = 'TRN-NH-516';
      }

      const asset = (await executeTool('get_infrastructure_asset', { assetId: targetAssetId })) as any;
      const zone = (await executeTool('get_zone_details', { zoneId: asset?.zone || 'Zone B' })) as any;

      return {
        queryType: 'ASSET_VULNERABILITY',
        asset,
        zoneContext: zone,
        scenario: curScen,
        environmentalSignals: environmentalContext,
      };
    }

    // 3. ZONE: inquiry about Zone B / Zone C
    if (params.zoneId || q.includes('zone b') || q.includes('zone') || q.includes('sector')) {
      const zoneId = params.zoneId || (q.includes('zone c') ? 'Zone C' : 'Zone B');
      const zone = (await executeTool('get_zone_details', { zoneId })) as any;
      const exposure = (await executeTool('get_infrastructure_exposure', { zoneId })) as any;

      return {
        queryType: 'ZONE_ANALYSIS',
        zone,
        exposure,
        scenario: curScen,
        environmentalSignals: environmentalContext,
      };
    }

    // 4. FORECAST: inquiry about timeline / T-12H / T-24H
    if (q.includes('t-12') || q.includes('t-24') || q.includes('t-36') || q.includes('forecast') || q.includes('landfall')) {
      let hour = -36;
      if (q.includes('12')) hour = -12;
      else if (q.includes('24')) hour = -24;
      else if (q.includes('landfall')) hour = 0;

      const state = (await executeTool('get_forecast_state', { forecastHour: hour })) as any;
      return {
        queryType: 'FORECAST_MILESTONE',
        forecastState: state,
        scenario: curScen,
        environmentalSignals: environmentalContext,
      };
    }

    // 5. EXPOSURE: inquiry about newly exposed assets
    if (q.includes('exposed') || q.includes('newly') || q.includes('cutoff')) {
      const exposure = (await executeTool('get_infrastructure_exposure', {})) as any;
      const currentRisk = (await executeTool('get_current_risk', {})) as any;
      return {
        queryType: 'EXPOSURE_AUDIT',
        exposure,
        currentRisk,
        scenario: curScen,
        environmentalSignals: environmentalContext,
      };
    }

    // 6. GENERAL SITUATION SUMMARY
    const currentRisk = (await executeTool('get_current_risk', {})) as any;
    const zoneB = (await executeTool('get_zone_details', { zoneId: 'Zone B' })) as any;
    return {
      queryType: 'GENERAL_SUMMARY',
      currentRisk,
      zoneSummary: zoneB,
      scenario: curScen,
      environmentalSignals: environmentalContext,
    };
  }

  /**
   * Validate and enforce schema constraints on Gemini output
   */
  private validateAndNormalizeDecisionOutput(
    parsed: Partial<StructuredDecisionIntelligence>,
    context: any
  ): StructuredDecisionIntelligence {
    const baselineRisk = context.baseline?.riskScore ?? 87;
    const simRisk = context.simulated?.riskScore ?? context.currentRisk?.riskScore ?? 94;

    const validated: StructuredDecisionIntelligence = {
      summary: parsed.summary || 'Hydraulic convergence chokes drainage across the coastal sector.',
      risk_level:
        parsed.risk_level && ['LOW', 'MODERATE', 'HIGH', 'CRITICAL'].includes(parsed.risk_level)
          ? parsed.risk_level
          : (simRisk >= 76 ? 'CRITICAL' : 'HIGH'),
      risk_score: typeof parsed.risk_score === 'number' && !isNaN(parsed.risk_score) ? parsed.risk_score : simRisk,
      primary_concern: parsed.primary_concern || 'Severe arterial disruption severing medical access.',
      risk_drivers: Array.isArray(parsed.risk_drivers) && parsed.risk_drivers.length > 0
        ? parsed.risk_drivers
        : [
            { factor: '24h Precipitation', severity: 'HIGH', evidence: `${context.simulated?.rainfallMm || 280}mm accumulation` },
            { factor: 'Storm Surge', severity: 'CRITICAL', evidence: `+${context.simulated?.stormSurgeM || 2.8}m peak high-tide surge` },
          ],
      vulnerable_assets: Array.isArray(parsed.vulnerable_assets) && parsed.vulnerable_assets.length > 0
        ? parsed.vulnerable_assets
        : [
            {
              asset_id: 'MED-OD-402',
              asset_name: 'Regional Medical Center & Trauma Complex',
              risk_score: simRisk,
              primary_concern: 'Access roads submerged; critical patient isolation.',
            },
          ],
      impact_pathway: Array.isArray(parsed.impact_pathway) && parsed.impact_pathway.length > 0
        ? parsed.impact_pathway
        : [
            'Heavy coastal rainfall and surge meet at estuary basin',
            'Drainage backflow chokes arterial culverts on NH-516',
            'Highway submerged between MP 12-19 (0.8m depth)',
            'Complete medical transit isolation of Regional Medical Center',
          ],
      scenario_change: {
        baseline_risk: baselineRisk,
        simulated_risk: simRisk,
        risk_delta: simRisk - baselineRisk,
        newly_exposed_assets: context.simulated?.newlyExposedAssets?.length || 3,
      },
      recommended_actions: Array.isArray(parsed.recommended_actions) && parsed.recommended_actions.length > 0
        ? parsed.recommended_actions
        : [
            'Prepare alternate medical access bypass Route R-4.',
            'Pre-position high-capacity dewatering pumps at Sector 7 culverts.',
            'Issue pre-emptive trip advisory for vulnerable substations.',
          ],
      uncertainty: parsed.uncertainty || '±4% based on SLOSH hydrodynamic calibration',
      advisory_text: parsed.advisory_text || 'Active simulation indicates high priority for emergency transport bypass staging.',
    };

    return validated;
  }

  /**
   * Deterministic decision-intelligence generator when external API is unavailable
   */
  private buildDeterministicFallback(
    question: string,
    context: any
  ): StructuredDecisionIntelligence {
    const qLower = question.toLowerCase();

    // 1. Scenario / Rainfall question
    if (context.queryType === 'SCENARIO_SIMULATION' || qLower.includes('rainfall') || qLower.includes('300') || qLower.includes('280')) {
      const rain = context.simulated?.rainfallMm || 280;
      const surge = context.simulated?.stormSurgeM || 2.8;
      const simRisk = context.simulated?.riskScore || 94;
      const baseRisk = context.baseline?.riskScore || 87;

      return {
        summary: `Increasing rainfall to ${rain} mm with +${surge} m storm surge expands the flood-susceptibility footprint toward the inland drainage corridor.`,
        risk_level: 'CRITICAL',
        risk_score: simRisk,
        primary_concern: 'Reduced access to critical healthcare infrastructure and grid tripping.',
        risk_drivers: [
          { factor: 'Basin Rainfall', severity: 'CRITICAL', evidence: `${rain} mm 24h accumulation` },
          { factor: 'Peak Storm Surge', severity: 'CRITICAL', evidence: `+${surge} m high-tide concurrent` },
          { factor: 'Estuary Backflow', severity: 'HIGH', evidence: 'Hydraulic impoundment along Dhamra basin' },
        ],
        vulnerable_assets: [
          { asset_id: 'MED-OD-402', asset_name: 'Regional Medical Center', risk_score: simRisk, primary_concern: 'Access roads submerged' },
          { asset_id: 'TRN-NH-516', asset_name: 'NH-516 Arterial Route', risk_score: simRisk - 3, primary_concern: '1.2m depth between MP 12-19' },
          { asset_id: 'PWR-CB-104', asset_name: 'Chandbali 132kV Substation', risk_score: 86, primary_concern: 'Saline surge overtopping yard' },
        ],
        impact_pathway: [
          'Rainfall and high-tide surge trigger estuary backflow',
          'Dhamra drainage capacity reaches hydraulic saturation',
          'Arterial road disruption submerges NH-516 MP 12-19',
          'Severe medical isolation halts patient transfers',
        ],
        scenario_change: {
          baseline_risk: baseRisk,
          simulated_risk: simRisk,
          risk_delta: simRisk - baseRisk,
          newly_exposed_assets: 3,
        },
        recommended_actions: [
          'Prepare alternate inland medical access bypass Route R-4.',
          'Pre-position high-capacity dewatering pump units at Sector 7 culverts.',
          'Issue pre-emptive trip advisory for Chandbali 132kV substation.',
          'Activate pre-landfall curfew on low-lying highway corridors.',
        ],
        uncertainty: 'SIMULATED SCENARIO — Screening prototype based on SLOSH-IND-V2 calibration.',
        advisory_text: `CRITICAL ADVISORY: Rainfall escalation to ${rain}mm induces compound estuarine backwater impoundment. Implement emergency transit bypasses immediately.`,
      };
    }

    // 2. Vulnerable Asset Question
    if (context.queryType === 'ASSET_VULNERABILITY' || qLower.includes('vulnerable') || qLower.includes('medical') || qLower.includes('hospital')) {
      const asset = context.asset || infrastructureService.getAssetById('MED-OD-402');
      return {
        summary: `${asset.name} has severe access vulnerability because its access corridors traverse an alluvial depression vulnerable to concurrent surge impoundment.`,
        risk_level: 'CRITICAL',
        risk_score: asset.risk_score || 91,
        primary_concern: 'Vehicular ambulance transit completely severed before landfall.',
        risk_drivers: [
          { factor: 'Low Elevation Corridor', severity: 'CRITICAL', evidence: '2.1m ASL along access highway' },
          { factor: 'Surge Damming', severity: 'HIGH', evidence: '340m distance to storm surge inundation line' },
        ],
        vulnerable_assets: [
          {
            asset_id: asset.id,
            asset_name: asset.name,
            risk_score: asset.risk_score,
            primary_concern: asset.access_risk,
          },
        ],
        impact_pathway: [
          'High precipitation overloads local drainage culverts',
          'Tidal surge blocks estuarine outflow from draining into sea',
          'NH-516 access road submerged under 0.8m of floodwater',
          'Oxygen and critical medicine resupply routes cut off',
        ],
        scenario_change: {
          baseline_risk: 87,
          simulated_risk: asset.risk_score,
          risk_delta: Math.max(0, asset.risk_score - 87),
          newly_exposed_assets: 1,
        },
        recommended_actions: [
          'Activate inland access bypass Route R-4 for emergency transport.',
          'Stage search-and-rescue amphibious vehicles at Dhamra junction.',
          'Verify hospital auxiliary diesel generator fuel reserve for 72 hours.',
        ],
        uncertainty: 'Engineering assessment based on 30m ALOS elevation model and GEE database.',
        advisory_text: `ASSET ALERT: ${asset.name} is threatened by road submergence. Reroute all critical patient referrals to Bhadrak Sub-Divisional Hospital.`,
      };
    }

    // 3. Zone B Question
    if (context.queryType === 'ZONE_ANALYSIS' || qLower.includes('zone b') || qLower.includes('zone')) {
      return {
        summary: 'Zone B is critical due to the convergence of 220–280 mm rainfall runoff with +2.4–2.8 m storm surge at the Dhamra estuarine nexus.',
        risk_level: 'CRITICAL',
        risk_score: 91,
        primary_concern: 'Estuary backflow drainage choking cutting arterial logistics corridors.',
        risk_drivers: [
          { factor: 'Estuary Backflow', severity: 'CRITICAL', evidence: 'Drainage status: HIGH CHOKE' },
          { factor: 'Coastal Lowlands', severity: 'HIGH', evidence: 'Mean elevation 3.1m with extensive alluvial marsh' },
        ],
        vulnerable_assets: [
          { asset_id: 'MED-OD-402', asset_name: 'Regional Medical Center', risk_score: 91, primary_concern: 'Arterial access cutoff' },
          { asset_id: 'TRN-NH-516', asset_name: 'NH-516 Arterial Route', risk_score: 86, primary_concern: 'Submerged MP 12-19' },
          { asset_id: 'PWR-CB-104', asset_name: 'Chandbali Substation', risk_score: 88, primary_concern: 'Yard flood risk' },
        ],
        impact_pathway: [
          'Rainfall accumulation exceeds basin capacity',
          'Storm surge holds back runoff water from exiting to sea',
          'Secondary feeder roads and NH-516 breach simultaneously',
          '19 critical assets across Sector 04B enter isolation risk',
        ],
        scenario_change: {
          baseline_risk: 87,
          simulated_risk: 91,
          risk_delta: 4,
          newly_exposed_assets: 3,
        },
        recommended_actions: [
          'Accelerate phase-2 evacuation to storm shelters before T-18H.',
          'Deploy heavy dewatering units to sector culverts.',
          'Enforce heavy vehicle movement embargo on coastal highways.',
        ],
        uncertainty: 'SIMULATED SCENARIO — Rapid screening heuristic for emergency operations.',
        advisory_text: 'SECTOR DIRECTIVE: Zone B declared high operational priority. NDRF battalions pre-positioned at Dhamra and Chandbali.',
      };
    }

    // 4. Default General Summary
    return {
      summary: 'Cyclone Varun presents critical compound hazard exposure across Sector-04B with high risk of road submergence and facility isolation.',
      risk_level: 'CRITICAL',
      risk_score: 87,
      primary_concern: 'Compound flooding severing arterial transit and medical connectivity.',
      risk_drivers: [
        { factor: 'Sustained Winds', severity: 'CRITICAL', evidence: '185 km/h sustained with gusts to 215 km/h' },
        { factor: 'Rainfall', severity: 'HIGH', evidence: '220 mm 24h accumulation' },
        { factor: 'Storm Surge', severity: 'CRITICAL', evidence: '+2.4 m spring tide coupled' },
      ],
      vulnerable_assets: [
        { asset_id: 'MED-OD-402', asset_name: 'Regional Medical Center', risk_score: 91, primary_concern: 'Access road submerged' },
        { asset_id: 'PWR-CB-104', asset_name: 'Chandbali Substation', risk_score: 88, primary_concern: 'Yard flood overtopping' },
      ],
      impact_pathway: [
        'Rainfall and surge converge at coastal estuaries',
        'Drainage choking induces backwater flood expansion',
        'Key roads submerged between MP 12-19',
        'Critical facilities cut off from land transport',
      ],
      scenario_change: {
        baseline_risk: 87,
        simulated_risk: 87,
        risk_delta: 0,
        newly_exposed_assets: 0,
      },
      recommended_actions: [
        'Prepare alternate medical access bypass Route R-4.',
        'Pre-position high-capacity dewatering pump units at Sector 7 culverts.',
        'Issue pre-emptive trip advisory for vulnerable substations.',
      ],
      uncertainty: 'Model based on AVARTH rapid screening prototype v4.1.',
      advisory_text: 'OPERATIONAL SUMMARY: Category 4 equivalent cyclone approaching. Maintain pre-landfall readiness posture.',
    };
  }
}

export const geminiService = new GeminiService();
