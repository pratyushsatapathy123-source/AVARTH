import React, { useState, useMemo } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

export interface AlertData {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'WATCH';
  riskScore: number;
  area: string;
  areaHeader: string;
  title: string;
  timestamp: string;
  status: string;
  primaryRisk: string;
  executiveSummary: string;
  threat: {
    wind: number;
    rainfall: number;
    surge: number;
    description: string;
  };
  expectedImpact: {
    roads: number;
    medical: number;
    power: number;
    shelters: number;
    detail: {
      roads: string;
      medical: string;
      power: string;
      shelters: string;
    };
  };
  recommendedActions: string[];
  operationalContext: {
    criticalAssets: number;
    timeToLandfall: string;
    recommendedResponse: {
      medical: string;
      power: string;
      roads: string;
      shelters: string;
    };
    primaryConcern: string;
  };
  detailsOnDemand: {
    impactBasis: string;
    assetDetails: string;
    modelOutput: string;
    aiReasoning: string;
  };
}

const INITIAL_ALERTS: AlertData[] = [
  {
    id: 'alert-zone-b',
    severity: 'CRITICAL',
    riskScore: 91,
    area: 'ZONE B',
    areaHeader: 'COASTAL ZONE B',
    title: 'Medical access risk',
    timestamp: '16:04',
    status: 'ACTIVE',
    primaryRisk: 'Medical access disruption caused by flooded arterial connectivity.',
    executiveSummary:
      'Primary concern is loss of access to two medical facilities as rainfall and surge conditions threaten the coastal arterial corridor.',
    threat: {
      wind: 205,
      rainfall: 280,
      surge: 2.8,
      description: '205 km/h wind • 280 mm rainfall • +2.8 m surge',
    },
    expectedImpact: {
      roads: 7,
      medical: 2,
      power: 4,
      shelters: 6,
      detail: {
        roads: 'NH-516 MP 12-19 submersed >1.2m',
        medical: 'Regional Trauma complex cutoff',
        power: 'Chandbali 132kV yard bund risk',
        shelters: '4,820 evacuees capacity threatened',
      },
    },
    recommendedActions: [
      'Prepare alternate medical access route',
      'Pre-position response teams',
      'Secure vulnerable power infrastructure',
      'Verify shelter readiness',
    ],
    operationalContext: {
      criticalAssets: 19,
      timeToLandfall: '36H',
      recommendedResponse: {
        medical: 'Prepare alternate route.',
        power: 'Secure exposed assets.',
        roads: 'Pre-position response teams.',
        shelters: 'Verify shelter readiness.',
      },
      primaryConcern: 'Medical access may be disrupted before physical landfall.',
    },
    detailsOnDemand: {
      impactBasis:
        'Precipitation 280 mm, peak storm surge +2.8 m (synchronous with astronomical spring tide), inland elevation 2.1 m ASL inducing backwater stagnation at 1.4 m/s.',
      assetDetails:
        'Regional Trauma complex (MED-OD-402) helipad active; NH-516 MP 12-19 submerged >1.2m depth; Chandbali 132kV switchyard retention bund under overflow pressure; 6 cyclone shelters active.',
      modelOutput:
        'Simulation Run #09 demonstrates 98.4% ensemble convergence across 50 ECMWF members with SLOSH-IND-V2 hydrodynamics. Flooding timeline projects NH-516 culvert breach at T-14H before peak coastal landfall.',
      aiReasoning:
        'Synchronous timing of peak oceanic storm surge (+2.8m) with the astronomical high tide physically blocks Dhamra River freshwater discharge, resulting in rapid overland flooding that severs arterial road networks before storm center landfall.',
    },
  },
  {
    id: 'alert-sector-03',
    severity: 'HIGH',
    riskScore: 78,
    area: 'SECTOR 03',
    areaHeader: 'SECTOR 03 (INLAND ARTERIAL)',
    title: 'Road disruption',
    timestamp: '15:58',
    status: 'REVIEWED',
    primaryRisk: 'Road access disruption along major transit links due to heavy surface runoff.',
    executiveSummary:
      'Heavy surface runoff threatens NH-516 arterial road links with localized waterlogging and emergency transport delay.',
    threat: {
      wind: 175,
      rainfall: 210,
      surge: 1.8,
      description: 'Heavy surface runoff • 175 km/h wind • 210 mm rainfall',
    },
    expectedImpact: {
      roads: 5,
      medical: 1,
      power: 2,
      shelters: 4,
      detail: {
        roads: 'NH-516 access disruption & standing water',
        medical: 'Transit delay to Sub-district Hospital',
        power: 'Line tripping on feeder segment F-2',
        shelters: 'Feeder road access monitoring',
      },
    },
    recommendedActions: [
      'Prepare alternate road access',
      'Pre-position traffic control teams',
      'Identify alternate emergency route',
      'Deploy road clearance crews',
    ],
    operationalContext: {
      criticalAssets: 12,
      timeToLandfall: '36H',
      recommendedResponse: {
        medical: 'Identify alternate emergency route.',
        power: 'Monitor corridor substations.',
        roads: 'Pre-position traffic control teams.',
        shelters: 'Clear access pathways to shelters.',
      },
      primaryConcern: 'Arterial highway choke may delay emergency transit across Sector 03.',
    },
    detailsOnDemand: {
      impactBasis:
        'Runoff volume 210 mm with moderate soil saturation; local culverts operating at 140% nominal capacity with 0.6m localized cresting over secondary road links.',
      assetDetails:
        '5 arterial road segments affected along NH-516; Sub-district Hospital ambulance link facing 25-minute transit detour; 2 high-voltage feeder spurs on active standby.',
      modelOutput:
        'High-resolution hydro-routing indicates standing water pool stabilization at 0.65m depth between Junction 14 and Sector 3 hub by T-18H.',
      aiReasoning:
        'Sustained catchment rainfall over inland alluvial clay slows absorption, resulting in sheet-flow flooding across depressed road cross-sections.',
    },
  },
  {
    id: 'alert-sector-05',
    severity: 'HIGH',
    riskScore: 74,
    area: 'SECTOR 05',
    areaHeader: 'SECTOR 05 (GRID CORRIDOR)',
    title: 'Power exposure',
    timestamp: '15:52',
    status: 'ACTIVE',
    primaryRisk: 'Power infrastructure exposure and potential service disruption to grid substations.',
    executiveSummary:
      'Vulnerability to power transmission grid and substation perimeters due to localized storm surge and wind stress.',
    threat: {
      wind: 165,
      rainfall: 180,
      surge: 1.4,
      description: '165 km/h wind • 180 mm rainfall • +1.4 m surge',
    },
    expectedImpact: {
      roads: 3,
      medical: 1,
      power: 5,
      shelters: 3,
      detail: {
        roads: 'Utility access lanes partially obstructed',
        medical: 'Backup generator dependency alert',
        power: 'Substation yard bund overtop threat',
        shelters: 'Emergency backup battery arrays active',
      },
    },
    recommendedActions: [
      'Inspect vulnerable power assets',
      'Prepare backup power',
      'Secure exposed equipment',
      'Coordinate grid isolation contingency',
    ],
    operationalContext: {
      criticalAssets: 9,
      timeToLandfall: '38H',
      recommendedResponse: {
        medical: 'Ensure hospital generator backup is fueled.',
        power: 'Inspect vulnerable power assets & substations.',
        roads: 'Maintain clearance around high-voltage lines.',
        shelters: 'Verify auxiliary battery arrays.',
      },
      primaryConcern: 'Substation switchyard flooding may trigger unplanned regional power trips.',
    },
    detailsOnDemand: {
      impactBasis:
        'Estuary surge +1.4m coupled with 180 mm rainfall causing groundwater upwelling within 300 meters of 132kV transmission transformer plinths.',
      assetDetails:
        '5 grid substations and switching stations flagged for immediate physical containment; 3 shelter auxiliary generator banks synchronized.',
      modelOutput:
        'Grid vulnerability simulation confirms risk threshold breach at 1.1m inundation near feeder substation 05-B by T-20H.',
      aiReasoning:
        'Wind shear gusts approaching 190 km/h combined with soggy soil destabilize peripheral pylon anchors, while drainage outflow constraints pool water around switchgear.',
    },
  },
  {
    id: 'alert-sector-02',
    severity: 'MODERATE',
    riskScore: 64,
    area: 'SECTOR 02',
    areaHeader: 'SECTOR 02 (INLAND RELIEF ZONE)',
    title: 'Shelter capacity check',
    timestamp: '15:40',
    status: 'ACTIVE',
    primaryRisk: 'Shelter capacity pressure and potential accommodation shortfall for vulnerable coastal evacuees.',
    executiveSummary:
      'Inflow of displaced population approaching capacity thresholds across inland cyclone shelters.',
    threat: {
      wind: 140,
      rainfall: 150,
      surge: 0.9,
      description: '140 km/h wind • 150 mm rainfall • +0.9 m surge',
    },
    expectedImpact: {
      roads: 2,
      medical: 1,
      power: 1,
      shelters: 8,
      detail: {
        roads: 'Convoys active on feeder routes',
        medical: 'Mobile first-aid post dispatched',
        power: 'Grid stable, auxiliary generators ready',
        shelters: '8 shelters approaching 85% occupancy',
      },
    },
    recommendedActions: [
      'Verify shelter capacity',
      'Prepare additional shelter resources',
      'Coordinate emergency accommodation',
      'Stage water and sanitation buffer supplies',
    ],
    operationalContext: {
      criticalAssets: 10,
      timeToLandfall: '42H',
      recommendedResponse: {
        medical: 'Deploy mobile medical kits to high-density shelters.',
        power: 'Maintain shelter lighting and water pump power.',
        roads: 'Keep secondary shelter feeder roads unobstructed.',
        shelters: 'Prepare additional shelter resources & overflow spaces.',
      },
      primaryConcern: 'Shelter capacity margin narrowing as pre-emptive coastal evacuation accelerates.',
    },
    detailsOnDemand: {
      impactBasis:
        'Inland catchment experiencing steady 150 mm rainfall with wind speeds of 140 km/h. Evacuation transit flow currently at 1,400 persons/hour.',
      assetDetails:
        '8 multi-purpose cyclone shelters currently housing 6,240 individuals (84.5% total rated capacity); 2 secondary schools designated as overflow reserves.',
      modelOutput:
        'Demographic displacement projection indicates 100% shelter saturation within T-16H if coastal evacuation orders expand into peripheral gram panchayats.',
      aiReasoning:
        'Preemptive evacuation compliance is outperforming baseline expectations, requiring immediate reallocation of food rations and portable sanitization units.',
    },
  },
];

export const AdvisoryAndAlerts: React.FC = () => {
  const {
    scenario,
    simulationResult,
    currentAdvisory,
    dispatchAdvisory,
    setActiveTab,
    setSelectedZoneId,
    setSelectedAssetId,
  } = useScenario();

  // Central Alert Model List
  const [alertList, setAlertList] = useState<AlertData[]>(INITIAL_ALERTS);

  // Selected Alert for inspection & live synchronization
  const [selectedAlertId, setSelectedAlertId] = useState<string>('alert-zone-b');

  // Currently active alert object
  const rawActiveAlert = alertList.find(a => a.id === selectedAlertId) || alertList[0];

  // Dynamically sync Zone B alert with scenario and simulationResult
  const activeAlert = useMemo(() => {
    if (rawActiveAlert.id === 'alert-zone-b') {
      return {
        ...rawActiveAlert,
        riskScore: scenario.riskScore,
        severity: scenario.riskLevel as 'CRITICAL' | 'HIGH' | 'MODERATE' | 'WATCH',
        threat: {
          wind: scenario.windKmh,
          rainfall: scenario.rainfallMm,
          surge: scenario.stormSurgeM,
          description: `${scenario.windKmh} km/h wind • ${scenario.rainfallMm} mm rainfall • +${scenario.stormSurgeM} m surge`,
        },
        expectedImpact: {
          ...rawActiveAlert.expectedImpact,
          roads: simulationResult.roadsExposed,
          medical: simulationResult.medicalFacilitiesExposed,
          power: simulationResult.powerAssetsExposed,
          shelters: simulationResult.sheltersExposed,
        },
        operationalContext: {
          ...rawActiveAlert.operationalContext,
          timeToLandfall: `${Math.abs(scenario.forecastHour)}H`,
          criticalAssets: scenario.criticalAssetsEndangered,
        },
      };
    }
    return rawActiveAlert;
  }, [rawActiveAlert, scenario, simulationResult]);

  // User-edited overrides per alert id
  const [editedOverrides, setEditedOverrides] = useState<
    Record<string, { executiveSummary?: string; primaryRisk?: string; actions?: string[] }>
  >({});

  // Dispatch simulation tracking per alert
  const [dispatchedAlerts, setDispatchedAlerts] = useState<Record<string, boolean>>({
    'alert-zone-b': currentAdvisory?.status === 'DISPATCH_SIMULATED',
  });

  // UI state
  const [isBannerDismissed, setIsBannerDismissed] = useState<Record<string, boolean>>({});
  const [isDispatching, setIsDispatching] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedNotification, setCopiedNotification] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Progressive Disclosure / Details On Demand Modals/Drawers
  const [expandedDetail, setExpandedDetail] = useState<
    'impact-basis' | 'asset-details' | 'model-output' | 'ai-reasoning' | null
  >(null);

  // Recipient groups
  const [recipients, setRecipients] = useState({
    districtAdmin: true,
    disasterMgmt: true,
    fieldTeams: true,
    infraOperators: true,
  });

  const toggleRecipient = (key: keyof typeof recipients) => {
    setRecipients(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Current values factoring in edits for the active alert
  const currentExecutiveSummary =
    editedOverrides[activeAlert.id]?.executiveSummary ?? activeAlert.executiveSummary;
  const currentPrimaryRisk =
    editedOverrides[activeAlert.id]?.primaryRisk ?? activeAlert.primaryRisk;
  const currentActions =
    editedOverrides[activeAlert.id]?.actions ?? activeAlert.recommendedActions;

  // Is active alert dispatched and banner not dismissed?
  const isCurrentDispatched = !!dispatchedAlerts[activeAlert.id];
  const showDispatchBanner = isCurrentDispatched && !isBannerDismissed[activeAlert.id];

  // Select alert handler (instant client-side synchronization without page reload)
  const handleSelectAlert = (id: string) => {
    setSelectedAlertId(id);
    setIsEditing(false);
    setExpandedDetail(null);
  };

  // Simulate dispatch for the CURRENTLY SELECTED alert
  const handleSimulateDispatch = async () => {
    setIsDispatching(true);
    try {
      await dispatchAdvisory(activeAlert.id);
      setDispatchedAlerts(prev => ({ ...prev, [activeAlert.id]: true }));
      setIsBannerDismissed(prev => ({ ...prev, [activeAlert.id]: false }));
    } catch (err) {
      console.error('Dispatch simulation error:', err);
    } finally {
      setIsDispatching(false);
    }
  };

  // Dismiss dispatch banner without deleting or resetting state
  const handleDismissBanner = () => {
    setIsBannerDismissed(prev => ({ ...prev, [activeAlert.id]: true }));
  };

  // Regenerate advisory for the currently selected alert
  const handleGenerateAdvisory = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Clear user override for this alert to refresh clean AI synthesis
      setEditedOverrides(prev => {
        const next = { ...prev };
        delete next[activeAlert.id];
        return next;
      });
      setIsGenerating(false);
    }, 400);
  };

  // Export / copy current active brief
  const handleCopyText = () => {
    const briefText = `AVARTH
PRE-LANDFALL IMPACT ADVISORY
${activeAlert.severity} // SIMULATED SCENARIO

EXECUTIVE SUMMARY
${currentExecutiveSummary}

AREA
${activeAlert.areaHeader}

THREAT
${activeAlert.threat.wind} km/h wind | ${activeAlert.threat.rainfall} mm rainfall | +${activeAlert.threat.surge} m surge

EXPECTED IMPACT
${activeAlert.expectedImpact.roads} road segments | ${activeAlert.expectedImpact.medical} medical facilities | ${activeAlert.expectedImpact.power} power assets | ${activeAlert.expectedImpact.shelters} shelters

PRIMARY RISK
${currentPrimaryRisk}

PRIORITY ACTIONS
${currentActions.map((a: string, i: number) => `0${i + 1} ${a}`).join('\n')}

AI BASIS
GEMINI DECISION INTELLIGENCE`;

    navigator.clipboard?.writeText(briefText);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  const handleExportBrief = () => {
    setIsExporting(true);
    setTimeout(() => {
      handleCopyText();
      setIsExporting(false);
    }, 400);
  };

  // Count summaries
  const criticalCount = alertList.filter(a => a.severity === 'CRITICAL').length;
  const highCount = alertList.filter(a => a.severity === 'HIGH').length;
  const moderateCount = alertList.filter(a => a.severity === 'MODERATE').length;
  const watchCount = alertList.filter(a => a.severity === 'WATCH').length;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header Bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            ADVISORY &amp; ALERTS
          </span>
          <span className="px-1.5 py-0.5 bg-[#B74A32]/20 border border-[#B74A32]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            EXECUTIVE OPERATIONAL BRIEF // {activeAlert.area}
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            Active Directive: {activeAlert.title} (Risk: {activeAlert.riskScore}/100)
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedZoneId(activeAlert.area.includes('ZONE B') ? 'Zone B' : 'Zone A');
              setActiveTab('impact-map');
            }}
            className="font-label-serif-caps text-[8.5px] text-[#FFB4A4] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>VIEW ON IMPACT MAP</span>
            <span className="text-[10px]">&rarr;</span>
          </button>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <button
            type="button"
            onClick={() => {
              setSelectedAssetId('MED-OD-402');
              setActiveTab('infrastructure');
            }}
            className="font-label-serif-caps text-[8.5px] text-[#FFB4A4] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>INSPECT ASSETS</span>
            <span className="text-[10px]">&rarr;</span>
          </button>
        </div>
      </div>

      {/* Main Tri-Column Workspace */}
      <div className="flex flex-1 min-h-[580px] overflow-hidden">
        {/* COLUMN 1: ALERT QUEUE (Left Column) */}
        <div className="w-[260px] bg-[#161413] border-r border-[#262320] p-3.5 space-y-3 shrink-0 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-3">
            {/* Threat Level Rollup (Consistent with alert data) */}
            <div className="border-b border-[#262320] pb-2.5 space-y-1">
              <span className="font-label-serif-caps text-[8px] text-[#7A7168] uppercase font-bold block">
                THREAT LEVEL ROLLUP
              </span>
              <div className="grid grid-cols-4 gap-1 text-center font-label-serif-caps">
                <div className="p-1 bg-[#251917] border border-[#BA1A1A]">
                  <span className="font-bold text-[13px] text-[#BA1A1A] block">{criticalCount}</span>
                  <span className="text-[6.5px] text-[#dec0b9]">CRIT</span>
                </div>
                <div className="p-1 bg-[#231E18] border border-[#C8923C]">
                  <span className="font-bold text-[13px] text-[#C8923C] block">{highCount}</span>
                  <span className="text-[6.5px] text-[#DDD8CE]">HIGH</span>
                </div>
                <div className="p-1 bg-[#1C1D18] border border-[#68745A]">
                  <span className="font-bold text-[13px] text-[#BECBAD] block">{moderateCount}</span>
                  <span className="text-[6.5px] text-[#BECBAD]">MOD</span>
                </div>
                <div className="p-1 bg-[#1A1816] border border-[#332E2A]">
                  <span className="font-bold text-[13px] text-[#8A847B] block">{watchCount}</span>
                  <span className="text-[6.5px] text-[#8A847B]">WATCH</span>
                </div>
              </div>
            </div>

            {/* Interactive Alert Queue Items */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-label-serif-caps text-[8px] text-[#7A7168] uppercase font-bold">
                  ALERT QUEUE ({alertList.length})
                </span>
                <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">CLICK TO AUDIT</span>
              </div>

              <div className="space-y-1.5" role="listbox" aria-label="Alert Queue">
                {alertList.map(item => {
                  const isCrit = item.severity === 'CRITICAL';
                  const isHigh = item.severity === 'HIGH';
                  const isSelected = selectedAlertId === item.id;
                  const isDispatched = dispatchedAlerts[item.id];

                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelectAlert(item.id)}
                      className={`w-full text-left p-2 border transition-all duration-150 cursor-pointer text-[10px] block ${
                        isSelected
                          ? 'bg-[#251917] border-[#B74A32] shadow-sm ring-1 ring-[#B74A32]/60'
                          : isCrit
                          ? 'bg-[#1C1716] border-[#57423D] hover:border-[#BA1A1A] hover:bg-[#201918]'
                          : isHigh
                          ? 'bg-[#1B1917] border-[#3D352B] hover:border-[#C8923C] hover:bg-[#211E1A]'
                          : 'bg-[#171615] border-[#2B2723] hover:border-[#68745A] hover:bg-[#1C1A18]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#B74A32]"></span>}
                          <span
                            className={`font-label-serif-caps text-[8px] font-bold ${
                              isCrit ? 'text-[#BA1A1A]' : isHigh ? 'text-[#C8923C]' : 'text-[#BECBAD]'
                            }`}
                          >
                            {item.severity} {item.riskScore}
                          </span>
                        </div>
                        <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">
                          {item.timestamp}
                        </span>
                      </div>

                      <div className="flex items-baseline justify-between mt-1">
                        <span
                          className={`font-headline-sm text-[11px] font-bold ${
                            isSelected ? 'text-[#F7F4EE]' : 'text-[#EDE8E0]'
                          }`}
                        >
                          {item.area}
                        </span>
                        <span
                          className={`text-[9px] font-medium truncate max-w-[120px] ${
                            isSelected ? 'text-[#FFB4A4]' : 'text-[#9E978F]'
                          }`}
                        >
                          {item.title}
                        </span>
                      </div>

                      {/* Small Status Tag */}
                      <div className="flex items-center justify-between mt-1 pt-1 border-t border-[#262320] text-[7.5px] font-label-serif-caps">
                        <span className="text-[#6E675F]">DISPATCH:</span>
                        <span className={isDispatched ? 'text-[#BECBAD] font-bold' : 'text-[#8A847B]'}>
                          {isDispatched ? 'DISPATCHED ✓' : item.status}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Alert History (Synchronized with selected alert) */}
          <div className="pt-2 border-t border-[#262320] space-y-1.5">
            <span className="font-label-serif-caps text-[7.5px] text-[#7A7168] uppercase font-bold block">
              ALERT HISTORY
            </span>
            <div className="space-y-1 text-[8.5px] font-label-serif-caps text-[#8A847B]">
              {alertList.map(item => {
                const isSelected = item.id === activeAlert.id;
                const isDispatched = dispatchedAlerts[item.id];
                return (
                  <button
                    key={`hist-${item.id}`}
                    type="button"
                    onClick={() => handleSelectAlert(item.id)}
                    className={`w-full flex justify-between py-0.5 border-b border-[#221F1C] cursor-pointer text-left transition-colors ${
                      isSelected ? 'text-[#FFB4A4] font-bold bg-[#1C1816] px-1' : 'hover:text-[#DDD8CE]'
                    }`}
                  >
                    <span>
                      {item.timestamp} • {item.area}
                    </span>
                    <span>
                      {item.severity} // {isDispatched ? 'Dispatched' : item.status}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* COLUMN 2: CENTER ADVISORY (EXECUTIVE OPERATIONAL BRIEF - DYNAMIC) */}
        <div className="flex-1 bg-[#EFECE3] text-[#241917] p-5 overflow-y-auto space-y-3 font-body-md">
          {/* Action Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#D8D2C5] pb-2.5">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleGenerateAdvisory}
                disabled={isGenerating}
                className="px-2.5 py-1 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[8.5px] uppercase tracking-wider font-bold transition-colors shadow-sm cursor-pointer flex items-center gap-1"
              >
                <span className={`material-symbols-outlined text-[12px] ${isGenerating ? 'animate-spin' : ''}`}>
                  refresh
                </span>
                <span>{isGenerating ? 'SYNTHESIZING...' : 'GENERATE ADVISORY'}</span>
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className={`px-2.5 py-1 border font-label-serif-caps text-[8.5px] uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  isEditing
                    ? 'bg-[#241917] text-white border-[#241917]'
                    : 'bg-white text-[#241917] border-[#D5CEBF] hover:bg-[#F7F4EE]'
                }`}
              >
                <span className="material-symbols-outlined text-[12px]">
                  {isEditing ? 'check' : 'edit'}
                </span>
                <span>{isEditing ? 'SAVE BRIEF' : 'EDIT'}</span>
              </button>
              <button
                type="button"
                onClick={handleExportBrief}
                disabled={isExporting}
                className="px-2.5 py-1 bg-white border border-[#D5CEBF] hover:bg-[#F7F4EE] text-[#241917] font-label-serif-caps text-[8.5px] uppercase tracking-wider font-medium transition-colors cursor-pointer flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[12px]">
                  {copiedNotification ? 'done' : 'download'}
                </span>
                <span>
                  {copiedNotification
                    ? 'COPIED TO CLIPBOARD'
                    : isExporting
                    ? 'EXPORTING...'
                    : 'EXPORT'}
                </span>
              </button>
            </div>

            <div className="flex items-center gap-2 text-[8px] font-label-serif-caps text-[#7A7168]">
              <span>ACTIVE TARGET: {activeAlert.area}</span>
              <span className="text-[#3E3832]">|</span>
              <span className="text-[#B74A32] font-bold">{activeAlert.severity} // SIMULATED</span>
            </div>
          </div>

          {/* SIMULATED DISPATCH BANNER (Shown upon simulation confirmation with DISMISS control) */}
          {showDispatchBanner && (
            <div className="p-2.5 bg-[#241917] border border-[#BA1A1A] text-white flex items-center justify-between shadow-lg animate-in fade-in duration-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-[#BA1A1A] animate-pulse"></span>
                <div>
                  <span className="font-label-serif-caps text-[10px] text-[#FFB4A4] uppercase font-bold tracking-wider block">
                    DISPATCH SIMULATED — {activeAlert.area} ({activeAlert.severity})
                  </span>
                  <span className="font-body-sm text-[9.5px] text-[#dec0b9]">
                    Tactical brief [{activeAlert.id} @ {activeAlert.timestamp}] transmitted to 4 authorized recipient networks.
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[7.5px] font-bold">
                  SIMULATION VALIDATED
                </span>
                <button
                  type="button"
                  onClick={handleDismissBanner}
                  className="px-1.5 py-0.5 bg-[#332E2A] hover:bg-[#443E38] text-[#EDE8E0] font-label-serif-caps text-[7.5px] cursor-pointer"
                  title="Dismiss banner"
                >
                  DISMISS
                </button>
              </div>
            </div>
          )}

          {/* Concise Document Card */}
          <div className="bg-white border border-[#D8D2C5] p-5 shadow-sm space-y-4">
            {/* Top Plate */}
            <div className="border-b border-[#241917] pb-2 flex items-start justify-between">
              <div>
                <span className="font-headline-sm text-[15px] font-bold text-[#241917] tracking-wider block">
                  AVARTH
                </span>
                <span className="font-label-serif-caps text-[9px] text-[#7A7168] tracking-wider block">
                  PRE-LANDFALL IMPACT ADVISORY
                </span>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-0.5 text-white font-label-serif-caps text-[8.5px] font-bold block ${
                    activeAlert.severity === 'CRITICAL'
                      ? 'bg-[#BA1A1A]'
                      : activeAlert.severity === 'HIGH'
                      ? 'bg-[#C8923C]'
                      : 'bg-[#68745A]'
                  }`}
                >
                  {activeAlert.severity}
                </span>
                <span className="font-label-serif-caps text-[7px] text-[#8A716C] mt-0.5 block">
                  SIMULATED SCENARIO
                </span>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY (Max 2 lines at top) */}
            <div className="p-2.5 bg-[#FFF0ED] border-l-2 border-[#BA1A1A] border-y border-r border-[#FFDAD6]">
              <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] font-bold block mb-0.5">
                EXECUTIVE SUMMARY
              </span>
              {isEditing ? (
                <textarea
                  value={currentExecutiveSummary}
                  onChange={e =>
                    setEditedOverrides(prev => ({
                      ...prev,
                      [activeAlert.id]: {
                        ...prev[activeAlert.id],
                        executiveSummary: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-[11.5px] font-body-sm text-[#241917] bg-white p-1 border border-[#BA1A1A] focus:outline-none"
                  rows={2}
                />
              ) : (
                <p className="font-body-sm text-[11.5px] text-[#241917] leading-tight font-medium">
                  "{currentExecutiveSummary}"
                </p>
              )}
            </div>

            {/* AREA */}
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-2 text-[11px]">
              <span className="font-label-serif-caps text-[8.5px] text-[#7A7168] font-bold uppercase">
                AREA
              </span>
              <strong className="text-[#241917] font-headline-sm text-[12px] tracking-wide">
                {activeAlert.areaHeader}
              </strong>
            </div>

            {/* THREAT */}
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-2 text-[10.5px]">
              <span className="font-label-serif-caps text-[8.5px] text-[#7A7168] font-bold uppercase">
                THREAT
              </span>
              <div className="flex items-center gap-3 font-medium text-[#241917]">
                <span>{activeAlert.threat.wind} km/h wind</span>
                <span className="text-[#D5CEBF]">•</span>
                <span className="text-[#C8923C] font-bold">{activeAlert.threat.rainfall} mm rainfall</span>
                <span className="text-[#D5CEBF]">•</span>
                <span className="text-[#BA1A1A] font-bold">+{activeAlert.threat.surge} m surge</span>
              </div>
            </div>

            {/* EXPECTED IMPACT */}
            <div className="border-b border-[#EAE4D7] pb-2.5 space-y-1.5">
              <span className="font-label-serif-caps text-[8.5px] text-[#7A7168] font-bold uppercase block">
                EXPECTED IMPACT
              </span>
              <div className="grid grid-cols-4 gap-2 text-center">
                <div className="p-1.5 bg-[#F9F7F2] border border-[#E2DCCE]">
                  <strong className="text-[#241917] text-[13px] block">
                    {activeAlert.expectedImpact.roads}
                  </strong>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168]">ROAD SEGMENTS</span>
                </div>
                <div className="p-1.5 bg-[#F9F7F2] border border-[#E2DCCE]">
                  <strong className="text-[#BA1A1A] text-[13px] block">
                    {activeAlert.expectedImpact.medical}
                  </strong>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168]">MEDICAL FACILITIES</span>
                </div>
                <div className="p-1.5 bg-[#F9F7F2] border border-[#E2DCCE]">
                  <strong className="text-[#C8923C] text-[13px] block">
                    {activeAlert.expectedImpact.power}
                  </strong>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168]">POWER ASSETS</span>
                </div>
                <div className="p-1.5 bg-[#F9F7F2] border border-[#E2DCCE]">
                  <strong className="text-[#68745A] text-[13px] block">
                    {activeAlert.expectedImpact.shelters}
                  </strong>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168]">SHELTERS</span>
                </div>
              </div>
            </div>

            {/* PRIMARY RISK */}
            <div className="border-b border-[#EAE4D7] pb-2 space-y-0.5">
              <span className="font-label-serif-caps text-[8.5px] text-[#7A7168] font-bold uppercase block">
                PRIMARY RISK
              </span>
              {isEditing ? (
                <input
                  type="text"
                  value={currentPrimaryRisk}
                  onChange={e =>
                    setEditedOverrides(prev => ({
                      ...prev,
                      [activeAlert.id]: {
                        ...prev[activeAlert.id],
                        primaryRisk: e.target.value,
                      },
                    }))
                  }
                  className="w-full text-[11px] font-body-sm text-[#BA1A1A] font-bold bg-white p-1 border border-[#BA1A1A] focus:outline-none"
                />
              ) : (
                <p className="font-body-sm text-[11px] text-[#BA1A1A] font-bold leading-snug">
                  {currentPrimaryRisk}
                </p>
              )}
            </div>

            {/* PRIORITY ACTIONS */}
            <div className="space-y-1.5">
              <span className="font-label-serif-caps text-[8.5px] text-[#7A7168] font-bold uppercase block">
                PRIORITY ACTIONS
              </span>
              <div className="space-y-1 text-[10px]">
                {currentActions.map((actionText: string, index: number) => (
                  <div
                    key={`act-${index}`}
                    className="p-1.5 bg-[#FBF9F5] border-l-2 border-[#B74A32] border-y border-r border-[#E2DCCE] flex items-center gap-2"
                  >
                    <span className="font-label-serif-caps text-[9px] font-bold text-[#B74A32] shrink-0">
                      0{index + 1}
                    </span>
                    <span className="font-bold text-[#241917]">{actionText}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI BASIS & ON-DEMAND EXPANDABLE CONTROLS */}
            <div className="pt-2 border-t border-[#D5CEBF] flex flex-wrap items-center justify-between gap-2 text-[8px] font-label-serif-caps">
              <div className="flex items-center gap-1.5 text-[#7A7168]">
                <span>AI BASIS:</span>
                <span className="font-bold text-[#241917]">GEMINI DECISION INTELLIGENCE</span>
              </div>

              {/* DETAILS ON DEMAND LINKS */}
              <div className="flex items-center gap-2 text-[#8A716C]">
                <button
                  type="button"
                  onClick={() => setExpandedDetail(expandedDetail === 'impact-basis' ? null : 'impact-basis')}
                  className="hover:text-[#B74A32] hover:underline cursor-pointer"
                >
                  VIEW IMPACT BASIS &rarr;
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExpandedDetail(expandedDetail === 'asset-details' ? null : 'asset-details')}
                  className="hover:text-[#B74A32] hover:underline cursor-pointer"
                >
                  VIEW ASSET DETAILS &rarr;
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExpandedDetail(expandedDetail === 'model-output' ? null : 'model-output')}
                  className="hover:text-[#B74A32] hover:underline cursor-pointer"
                >
                  VIEW MODEL OUTPUT &rarr;
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={() => setExpandedDetail(expandedDetail === 'ai-reasoning' ? null : 'ai-reasoning')}
                  className="hover:text-[#B74A32] hover:underline cursor-pointer"
                >
                  VIEW AI REASONING &rarr;
                </button>
              </div>
            </div>
          </div>

          {/* DETAILS ON DEMAND EXPANDABLE DRAWER */}
          {expandedDetail && (
            <div className="p-3 bg-white border border-[#D5CEBF] shadow-sm space-y-2 animate-in fade-in duration-150 text-[10px]">
              <div className="flex items-center justify-between border-b border-[#E2DCCE] pb-1.5">
                <span className="font-label-serif-caps text-[8.5px] text-[#B74A32] font-bold uppercase">
                  {expandedDetail === 'impact-basis' && `IMPACT BASIS // ${activeAlert.area}`}
                  {expandedDetail === 'asset-details' && `ASSET DETAILS // ${activeAlert.area}`}
                  {expandedDetail === 'model-output' && `MODEL OUTPUT // ${activeAlert.area}`}
                  {expandedDetail === 'ai-reasoning' && `GEMINI AI REASONING // ${activeAlert.area}`}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedDetail(null)}
                  className="font-label-serif-caps text-[7.5px] text-[#7A7168] hover:text-[#241917] cursor-pointer"
                >
                  HIDE DETAILS &times;
                </button>
              </div>

              {expandedDetail === 'impact-basis' && (
                <div className="space-y-1.5">
                  <p className="text-[#3A2E2B] leading-relaxed text-[9.5px]">
                    {activeAlert.detailsOnDemand.impactBasis}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] pt-1">
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#7A7168] block font-label-serif-caps text-[6.5px]">Precipitation:</span>
                      <strong>{activeAlert.threat.rainfall} mm Runoff</strong>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#7A7168] block font-label-serif-caps text-[6.5px]">Storm Surge:</span>
                      <strong className="text-[#BA1A1A]">+{activeAlert.threat.surge} m Surge</strong>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#7A7168] block font-label-serif-caps text-[6.5px]">Wind Field:</span>
                      <strong>{activeAlert.threat.wind} km/h Core</strong>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#7A7168] block font-label-serif-caps text-[6.5px]">Risk Index:</span>
                      <strong className="text-[#BA1A1A]">{activeAlert.riskScore}/100</strong>
                    </div>
                  </div>
                </div>
              )}

              {expandedDetail === 'asset-details' && (
                <div className="space-y-1.5">
                  <p className="text-[#3A2E2B] leading-relaxed text-[9.5px]">
                    {activeAlert.detailsOnDemand.assetDetails}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[9px] pt-1">
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#BA1A1A] font-bold block">Roads ({activeAlert.expectedImpact.roads})</span>
                      <span className="text-[8px] text-[#7A7168]">{activeAlert.expectedImpact.detail.roads}</span>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#BA1A1A] font-bold block">Medical ({activeAlert.expectedImpact.medical})</span>
                      <span className="text-[8px] text-[#7A7168]">{activeAlert.expectedImpact.detail.medical}</span>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#C8923C] font-bold block">Power ({activeAlert.expectedImpact.power})</span>
                      <span className="text-[8px] text-[#7A7168]">{activeAlert.expectedImpact.detail.power}</span>
                    </div>
                    <div className="p-1 bg-[#F9F7F2] border border-[#E2DCCE]">
                      <span className="text-[#68745A] font-bold block">Shelters ({activeAlert.expectedImpact.shelters})</span>
                      <span className="text-[8px] text-[#7A7168]">{activeAlert.expectedImpact.detail.shelters}</span>
                    </div>
                  </div>
                </div>
              )}

              {expandedDetail === 'model-output' && (
                <p className="text-[#3A2E2B] leading-relaxed text-[9.5px]">
                  {activeAlert.detailsOnDemand.modelOutput}
                </p>
              )}

              {expandedDetail === 'ai-reasoning' && (
                <p className="text-[#3A2E2B] leading-relaxed text-[9.5px]">
                  {activeAlert.detailsOnDemand.aiReasoning}
                </p>
              )}
            </div>
          )}
        </div>

        {/* COLUMN 3: OPERATIONAL CONTEXT & DISPATCH CONTROL (Right Panel - DYNAMIC) */}
        <aside className="w-[280px] bg-[#161413] border-l border-[#262320] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div className="border-b border-[#262320] pb-2">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] tracking-wider block">
                OPERATIONAL CONTEXT
              </span>
              <span className="font-label-serif-caps text-[10px] text-[#EDE8E0] font-bold uppercase block mt-0.5">
                EXECUTIVE TELEMETRY
              </span>
            </div>

            {/* Metrics Snapshot (Dynamically bound to selected alert) */}
            <div className="p-2.5 bg-[#1C1A18] border border-[#2D2825] space-y-1.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-[#8A847B]">RISK</span>
                <span
                  className={`font-bold ${
                    activeAlert.riskScore >= 85
                      ? 'text-[#BA1A1A]'
                      : activeAlert.riskScore >= 70
                      ? 'text-[#C8923C]'
                      : 'text-[#BECBAD]'
                  }`}
                >
                  {activeAlert.riskScore} / 100
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A847B]">TIME TO LANDFALL</span>
                <span className="font-bold text-[#EDE8E0]">{activeAlert.operationalContext.timeToLandfall}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A847B]">AFFECTED ZONE</span>
                <span className="font-bold text-[#FFB4A4]">{activeAlert.area}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8A847B]">CRITICAL ASSETS</span>
                <span className="font-bold text-[#EDE8E0]">{activeAlert.operationalContext.criticalAssets}</span>
              </div>
            </div>

            {/* RECOMMENDED RESPONSE (Dynamically bound to selected alert) */}
            <div className="space-y-1.5 p-2.5 bg-[#1C1A18] border border-[#2D2825]">
              <span className="font-label-serif-caps text-[8px] text-[#B74A32] font-bold uppercase block">
                RECOMMENDED RESPONSE
              </span>
              <div className="space-y-1 text-[9.5px]">
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#DDD8CE] shrink-0">Medical access:</span>
                  <span className="text-[#8A847B]">{activeAlert.operationalContext.recommendedResponse.medical}</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#DDD8CE] shrink-0">Power:</span>
                  <span className="text-[#8A847B]">{activeAlert.operationalContext.recommendedResponse.power}</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#DDD8CE] shrink-0">Roads:</span>
                  <span className="text-[#8A847B]">{activeAlert.operationalContext.recommendedResponse.roads}</span>
                </div>
                <div className="flex items-start gap-1">
                  <span className="font-bold text-[#DDD8CE] shrink-0">Shelters:</span>
                  <span className="text-[#8A847B]">{activeAlert.operationalContext.recommendedResponse.shelters}</span>
                </div>
              </div>
            </div>

            {/* GEMINI INSIGHT (Single concise statement for active alert) */}
            <div className="p-2.5 bg-[#1F1C1A] border-l-2 border-[#B74A32] border-y border-r border-[#2D2825] space-y-1">
              <span className="font-label-serif-caps text-[7.5px] text-[#FFB4A4] uppercase font-bold block">
                PRIMARY OPERATIONAL CONCERN
              </span>
              <p className="font-body-sm text-[10px] text-[#DDD8CE] leading-tight font-medium">
                "{activeAlert.operationalContext.primaryConcern}"
              </p>
              <span className="font-label-serif-caps text-[7px] text-[#8A847B] block pt-0.5">
                GEMINI DECISION INTELLIGENCE
              </span>
            </div>

            {/* RECIPIENTS (Compact recipient groups with checkboxes) */}
            <div className="space-y-1.5 pt-1">
              <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] uppercase font-bold block">
                RECIPIENTS
              </span>
              <div className="space-y-1 text-[9.5px]">
                <label className="flex items-center gap-2 p-1 bg-[#1B1917] border border-[#2D2825] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipients.districtAdmin}
                    onChange={() => toggleRecipient('districtAdmin')}
                    className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#EDE8E0]">District Administration</span>
                </label>
                <label className="flex items-center gap-2 p-1 bg-[#1B1917] border border-[#2D2825] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipients.disasterMgmt}
                    onChange={() => toggleRecipient('disasterMgmt')}
                    className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#EDE8E0]">Disaster Management Cell</span>
                </label>
                <label className="flex items-center gap-2 p-1 bg-[#1B1917] border border-[#2D2825] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipients.fieldTeams}
                    onChange={() => toggleRecipient('fieldTeams')}
                    className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#EDE8E0]">Field Response Teams</span>
                </label>
                <label className="flex items-center gap-2 p-1 bg-[#1B1917] border border-[#2D2825] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={recipients.infraOperators}
                    onChange={() => toggleRecipient('infraOperators')}
                    className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                  />
                  <span className="text-[#EDE8E0]">Infrastructure Operators</span>
                </label>
              </div>
            </div>
          </div>

          {/* DISPATCH CONTROLS */}
          <div className="pt-3 border-t border-[#262320] space-y-2">
            <button
              type="button"
              onClick={handleSimulateDispatch}
              disabled={isDispatching}
              className="w-full py-2.5 bg-[#BA1A1A] hover:bg-[#97331D] text-white font-label-serif-caps text-[10px] font-bold tracking-widest uppercase transition-colors shadow-md cursor-pointer"
            >
              {isDispatching ? 'TRANSMITTING...' : `CONFIRM & SIMULATE DISPATCH`}
            </button>

            {isCurrentDispatched && (
              <div className="p-1.5 bg-[#251917] border border-[#BA1A1A] text-center flex items-center justify-between px-2">
                <span className="font-label-serif-caps text-[8px] text-[#FFB4A4] font-bold">
                  {activeAlert.area} DISPATCHED ✓
                </span>
                {!showDispatchBanner && (
                  <button
                    type="button"
                    onClick={() => setIsBannerDismissed(prev => ({ ...prev, [activeAlert.id]: false }))}
                    className="text-[7.5px] text-[#BECBAD] underline hover:text-white cursor-pointer"
                  >
                    SHOW LOG
                  </button>
                )}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
