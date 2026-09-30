/**
 * AVARTH Advisory & Directives Service
 */

import { Advisory, TacticalDirective } from '../models/types.ts';
import { DEMO_ADVISORY } from '../data/demoData.ts';
import { riskEngine } from './riskEngine.ts';
import { logEvent } from '../utils/logger.ts';

class AdvisoryService {
  private currentAdvisory: Advisory;
  private advisoriesList: Advisory[] = [];

  constructor() {
    this.currentAdvisory = JSON.parse(JSON.stringify(DEMO_ADVISORY));
    this.advisoriesList = [this.currentAdvisory];
  }

  public getCurrentAdvisory(): Advisory {
    return this.currentAdvisory;
  }

  public generateAdvisory(params?: {
    zone?: string;
    scenario_id?: string;
    custom_directives?: TacticalDirective[];
  }): Advisory {
    logEvent('advisory generated');

    const scenario = riskEngine.getCurrentScenario();
    const isEscalated = scenario.rainfall_mm > 240 || scenario.risk_score > 90;

    const advisory_id = `SEOC/OD/VARUN-04/DIR-${Math.floor(10 + Math.random() * 89)}`;
    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} IST // ${now.getDate()} OCT`;

    const newAdvisory: Advisory = {
      advisory_id,
      severity: isEscalated ? 'CRITICAL' : 'CRITICAL',
      area: 'BAY OF BENGAL / SECTOR-04B (DHAMRA-PARADIP TRANSECT)',
      scenario: `${scenario.name} (${scenario.classification})`,
      threat_profile: {
        wind: `${scenario.wind_kmh} KM/H (GUSTS TO ${scenario.wind_gusts_kmh} KM/H)`,
        rain: `${scenario.rainfall_mm} MM PEAK BASIN RAINFALL`,
        surge: `+${scenario.storm_surge_m} METERS SPRING TIDE CONCURRENT`,
        central_pressure: `${scenario.central_pressure_hpa} HPA`,
        eta: `18 OCT, 04:00–07:00 IST (ETA: ${scenario.forecast_hour}H)`,
      },
      expected_impacts: isEscalated
        ? [
            'Severe basin overload: 280mm precipitation exceeds drainage channels by >280%',
            'NH-516 submerged up to 1.2m depth between MP 12 and 19; ground access completely severed',
            'Regional Medical Center & Trauma Complex completely isolated from ground ambulance corridors',
            'Surge overtopping at Chandbali 132kV Substation requiring emergency power cutoff to prevent explosive shorts',
          ]
        : [
            'Estuary hydraulic damming causing severe drainage choking along Dhamra river basin',
            'Arterial coastal breach on NH-516 between Milepost 12 and 19 (depth 0.8m to 1.2m)',
            'Imminent road isolation of Regional Medical Center & Trauma Complex (Node #OD-402)',
            'Surge overtopping at Chandbali 132kV transmission substation requiring pre-emptive trip',
          ],
      priority_actions: params?.custom_directives || this.currentAdvisory.priority_actions,
      advisory_text: `SIMULATED SCENARIO — FOR OPERATIONAL READINESS EXERCISE ONLY. Tropical Cyclone ${scenario.name} continues severe intensification over Sector-04B with sustained core winds of ${scenario.wind_kmh} km/h and localized gusts to ${scenario.wind_gusts_kmh} km/h. Confluent high-tide surge (+${scenario.storm_surge_m}m) and 24h precipitation (${scenario.rainfall_mm}mm) require execution of pre-landfall evacuation protocols.`,
      issued_at: timeStr,
      status: 'DRAFT',
      is_simulated: true,
    };

    this.currentAdvisory = newAdvisory;
    this.advisoriesList.unshift(newAdvisory);
    return newAdvisory;
  }

  public simulateDispatch(
    advisoryId: string,
    recipients: string[] = [
      'District Collectorates (Dhamra/Bhadrak/Kendrapara)',
      'SDMA & SEOC Command',
      'NDRF / SDRF Field Battalions',
      'Infrastructure & Grid Utilities (OPTCL, GRIDCO, NHAI)',
    ]
  ): {
    status: 'DISPATCH_SIMULATED';
    advisory_id: string;
    recipients: string[];
    timestamp: string;
    notice: string;
  } {
    logEvent('dispatch simulated', { advisoryId, recipientCount: recipients.length });

    this.currentAdvisory.status = 'DISPATCH_SIMULATED';
    this.currentAdvisory.dispatched_at = new Date().toISOString();

    return {
      status: 'DISPATCH_SIMULATED',
      advisory_id: advisoryId,
      recipients,
      timestamp: new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST',
      notice: 'DISPATCH SIMULATED — Operational directive transmitted to simulated multi-agency response queue. No live sirens or public cellular broadcasts were triggered.',
    };
  }
}

export const advisoryService = new AdvisoryService();
