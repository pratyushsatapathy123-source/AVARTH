import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';
import type { AIAnalysisResponse } from '../../server/models/types.ts';

export const AIImpactAnalyst: React.FC = () => {
  const { scenario, simulationResult, askAIAnalyst, setActiveTab, dispatchAdvisory } = useScenario();

  const [queryInput, setQueryInput] = useState<string>('What changes at 300 mm rainfall?');
  const [isQuerying, setIsQuerying] = useState<boolean>(false);
  const [analysisResult, setAnalysisResult] = useState<AIAnalysisResponse | null>(null);
  const [activeQuestion, setActiveQuestion] = useState<string>('What changes at 300 mm rainfall?');
  const [issuedDirectiveSuccess, setIssuedDirectiveSuccess] = useState<boolean>(false);

  // Progressive Disclosure / Details On Demand Modals/Drawers
  const [expandedSection, setExpandedSection] = useState<
    'model-details' | 'impact-pathway' | 'data-basis' | 'asset-analysis' | 'telemetry' | 'query-deep-dive' | null
  >(null);

  const sampleQueries = [
    'What changes at 300 mm rainfall?',
    'Which asset is most vulnerable?',
    'Why is Zone B critical?',
    'Which route is at risk?',
  ];

  const handleRunQuery = async (customQuery?: string) => {
    const q = customQuery || queryInput;
    if (!q.trim()) return;

    setActiveQuestion(q);
    setIsQuerying(true);
    setIssuedDirectiveSuccess(false);
    try {
      const res = await askAIAnalyst(q);
      setAnalysisResult(res);
    } catch (err) {
      console.error('Failed to run inquiry:', err);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleIssueExecutionDirective = () => {
    dispatchAdvisory();
    setIssuedDirectiveSuccess(true);
    setTimeout(() => {
      setIssuedDirectiveSuccess(false);
    }, 3000);
  };

  // Structured query result formatting based on query
  const getQueryStructuredResult = () => {
    const q = activeQuestion.toLowerCase();
    if (q.includes('300') || q.includes('rainfall')) {
      return {
        question: 'What changes at 300 mm rainfall?',
        riskFrom: '94',
        riskTo: '97',
        newExposure: '+2 roads, +1 power asset',
        primaryEffect: 'Expanded flood footprint across Dhamra alluvial basin',
        recommendedAction: 'Prepare alternate access routes and order preemptive curfew on NH-516.',
        deepDive:
          'At 300 mm basin rainfall (+20 mm escalation above 280 mm threshold), localized runoff overtops NH-516 culvert banks 3.5 hours earlier. Hydrodynamic backflow reaches Chandbali 132kV perimeter bund with 0.85m standing water. Two secondary feeder routes (R-4 and R-6) incur cresting risks, isolating an estimated additional 14,000 residents in Sector 4B.',
      };
    }
    if (q.includes('vulnerable') || q.includes('asset')) {
      return {
        question: 'Which asset is most vulnerable?',
        riskFrom: '88',
        riskTo: '91',
        newExposure: 'Regional Medical Center & NH-516 corridor',
        primaryEffect: 'Complete severance of vehicular ambulance transit',
        recommendedAction: 'Stage air-evacuation rotorcraft and designate emergency helipad buffer.',
        deepDive:
          'Regional Medical Center (MED-OD-402) has 91/100 composite access vulnerability. Although the hospital structure itself rests on elevated plinths (4.2m ASL), both access arterial links along NH-516 pass through a 2.1m elevation depression vulnerable to concurrent surge damming.',
      };
    }
    if (q.includes('zone b') || q.includes('critical')) {
      return {
        question: 'Why is Zone B critical?',
        riskFrom: '87',
        riskTo: '94',
        newExposure: '19 critical assets & 280k population in corridor',
        primaryEffect: 'Convergence of 280 mm runoff with +2.8 m storm surge',
        recommendedAction: 'Accelerate phase-2 evacuation to storm shelters before T-18H.',
        deepDive:
          'Zone B represents the hydraulic nexus where estuarine outflow meets ocean tide. The +2.8m storm surge acts as a physical dam, holding 280mm freshwater runoff inland and raising water table levels beyond historical retention capacity.',
      };
    }
    if (q.includes('route') || q.includes('road')) {
      return {
        question: 'Which route is at risk?',
        riskFrom: '86',
        riskTo: '88',
        newExposure: 'NH-516 Milepost 12 to 19 (7 segments)',
        primaryEffect: 'Submersion depth 1.2m arresting all non-amphibious transport',
        recommendedAction: 'Reroute traffic to Chandbali high-embankment bypass R-4.',
        deepDive:
          'NH-516 between MP 12 and 19 traverses low-lying mangrove silt ground. At T-14H, water depth reaches 1.2m with flow velocities of 1.4 m/s, presenting severe rollover hazards for civilian vehicles and ambulances.',
      };
    }

    const baseRisk = 87;
    const currentRiskScore = scenario.riskScore;
    const diff = currentRiskScore - baseRisk;

    return {
      question: activeQuestion,
      riskFrom: `${baseRisk}`,
      riskTo: `${currentRiskScore}`,
      newExposure: `${simulationResult.roadsExposed} roads, ${simulationResult.medicalFacilitiesExposed} medical, ${simulationResult.powerAssetsExposed} power`,
      primaryEffect: diff !== 0 ? `Risk increased from ${baseRisk} to ${currentRiskScore} because rainfall is ${scenario.rainfallMm}mm and surge is +${scenario.stormSurgeM}m` : 'Baseline sector screening risk',
      recommendedAction: 'Prepare alternate access routes and deploy high-capacity dewatering pumps.',
      deepDive:
        analysisResult?.summary ||
        `Risk increased from ${baseRisk} to ${currentRiskScore} because rainfall reached ${scenario.rainfallMm}mm and storm surge reached +${scenario.stormSurgeM}m. This escalates flood exposure to ${simulationResult.floodExposure}%, isolating ${simulationResult.roadsExposed} road segments and jeopardizing primary access to critical healthcare assets.`,
    };
  };

  const structuredAnswer = getQueryStructuredResult();

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header Bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            AI IMPACT ANALYST
          </span>
          <span className="px-1.5 py-0.5 bg-[#B74A32]/20 border border-[#B74A32]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            EXECUTIVE DISASTER INTELLIGENCE
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            Rapid Diagnostic Synthesis &amp; Decision Prioritization // Sector-04B
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-2 py-0.5 bg-[#1B1816] border border-[#2D2825] font-label-serif-caps text-[8px] text-[#BECBAD]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#68745A] animate-pulse"></span>
            GEMINI DECISION INTELLIGENCE
          </span>
          <span className="px-2 py-0.5 bg-[#251917] border border-[#B74A32] text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase font-bold">
            LEVEL-4 CLEARANCE
          </span>
        </div>
      </div>

      {/* Tri-Column Upper Dossier Layout */}
      <div className="flex flex-1 min-h-[520px] border-b border-[#262320]">
        {/* COLUMN 1: PRIMARY SCENARIO CONTEXT (Left Panel) */}
        <div className="w-[260px] bg-[#161413] border-r border-[#262320] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            {/* Header info */}
            <div>
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] tracking-wider block">
                TARGET SCENARIO
              </span>
              <div className="flex items-center justify-between mt-1">
                <span className="font-headline-sm text-[15px] font-bold text-[#F2EFE8] uppercase tracking-wide">
                  CYCLONE VARUN
                </span>
                <span className="px-1.5 py-0.5 bg-[#B74A32] text-white font-label-serif-caps text-[7.5px] font-bold">
                  CAT 4
                </span>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <span className="px-1.5 py-0.5 bg-[#241917] border border-[#57423D] text-[#FFB4A4] font-label-serif-caps text-[8px] font-bold">
                  {Math.abs(scenario.forecastHour)}H TO LANDFALL
                </span>
                <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">NNW @ 14 KM/H</span>
              </div>
            </div>

            {/* Environmental Snapshot */}
            <div className="p-2.5 bg-[#1B1917] border border-[#2B2723] space-y-1.5">
              <span className="font-label-serif-caps text-[7.5px] text-[#7A7168] uppercase block tracking-wider">
                CORE FORCING
              </span>
              <div className="grid grid-cols-3 gap-1 text-center font-label-serif-caps">
                <div className="p-1 bg-[#141312] border border-[#2D2825]">
                  <span className="text-[12px] font-bold text-[#EDE8E0] block leading-tight">{scenario.windKmh}</span>
                  <span className="text-[6.5px] text-[#8A847B] block">KM/H WIND</span>
                </div>
                <div className="p-1 bg-[#141312] border border-[#2D2825]">
                  <span className="text-[12px] font-bold text-[#C8923C] block leading-tight">{scenario.rainfallMm}</span>
                  <span className="text-[6.5px] text-[#8A847B] block">MM RAIN</span>
                </div>
                <div className="p-1 bg-[#141312] border border-[#2D2825]">
                  <span className="text-[12px] font-bold text-[#BA1A1A] block leading-tight">+{scenario.stormSurgeM}</span>
                  <span className="text-[6.5px] text-[#8A847B] block">M SURGE</span>
                </div>
              </div>
            </div>

            {/* Composite Risk Card */}
            <div className="p-3 bg-[#241917] border border-[#BA1A1A] text-center space-y-1">
              <span className="font-label-serif-caps text-[7.5px] text-[#FFB4A4] uppercase font-bold tracking-wider block">
                COMPOSITE RISK
              </span>
              <div className="flex items-baseline justify-center gap-1">
                <span className="font-headline-md text-[32px] font-bold text-[#BA1A1A] leading-none">
                  {simulationResult.riskScore}
                </span>
                <span className="font-label-serif-caps text-[12px] text-[#dec0b9]">/ 100</span>
              </div>
              <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[8.5px] font-bold uppercase inline-block tracking-wider">
                {simulationResult.riskLevel}
              </span>
            </div>

            {/* Exposed Assets Inventory (Concise count) */}
            <div className="space-y-1.5">
              <span className="font-label-serif-caps text-[7.5px] text-[#7A7168] uppercase font-bold tracking-wider block">
                EXPOSED INFRASTRUCTURE:
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-1.5 bg-[#1B1917] border border-[#2D2825] flex items-center justify-between">
                  <span className="text-[#9E978F] font-label-serif-caps text-[8px]">ROADS</span>
                  <span className="font-bold text-[#FFB4A4] text-[11px]">{simulationResult.roadsExposed}</span>
                </div>
                <div className="p-1.5 bg-[#1B1917] border border-[#2D2825] flex items-center justify-between">
                  <span className="text-[#9E978F] font-label-serif-caps text-[8px]">MEDICAL</span>
                  <span className="font-bold text-[#BA1A1A] text-[11px]">{simulationResult.medicalFacilitiesExposed}</span>
                </div>
                <div className="p-1.5 bg-[#1B1917] border border-[#2D2825] flex items-center justify-between">
                  <span className="text-[#9E978F] font-label-serif-caps text-[8px]">POWER</span>
                  <span className="font-bold text-[#C8923C] text-[11px]">{simulationResult.powerAssetsExposed}</span>
                </div>
                <div className="p-1.5 bg-[#1B1917] border border-[#2D2825] flex items-center justify-between">
                  <span className="text-[#9E978F] font-label-serif-caps text-[8px]">SHELTERS</span>
                  <span className="font-bold text-[#68745A] text-[11px]">{simulationResult.sheltersExposed}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Telemetry Drawer Button */}
          <div className="pt-3 border-t border-[#262320]">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'telemetry' ? null : 'telemetry')}
              className="w-full py-1.5 px-2 bg-[#1C1A18] hover:bg-[#25221F] border border-[#2D2825] text-left text-[8.5px] font-label-serif-caps text-[#FFB4A4] flex items-center justify-between cursor-pointer transition-colors"
            >
              <span>{expandedSection === 'telemetry' ? 'HIDE TELEMETRY' : 'VIEW FULL TELEMETRY →'}</span>
              <span className="material-symbols-outlined text-[12px]">
                {expandedSection === 'telemetry' ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          </div>
        </div>

        {/* COLUMN 2: CENTER AI ANALYSIS (Fluid Main Canvas - SHOW DECISION FIRST) */}
        <div className="flex-1 bg-[#F7F4EE] text-[#241917] p-5 overflow-y-auto space-y-4">
          {/* Header strip */}
          <div className="flex items-center justify-between border-b border-[#E2DCCE] pb-2">
            <div className="flex items-center gap-2">
              <span className="font-label-serif-caps text-[9px] text-[#7A7168] uppercase font-bold tracking-wider">
                EXECUTIVE DISASTER INTELLIGENCE
              </span>
              <span className="px-1.5 py-0.5 bg-[#EAE4D7] text-[#241917] font-label-serif-caps text-[7.5px] uppercase font-bold">
                DECISION VIEW
              </span>
            </div>
            <div className="flex items-center gap-3 text-[8.5px] font-label-serif-caps text-[#8A716C]">
              <button
                type="button"
                onClick={() => setExpandedSection('model-details')}
                className="hover:text-[#B74A32] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>VIEW MODEL DETAILS</span>
                <span className="text-[10px]">→</span>
              </button>
              <span className="text-[#D5CEBF]">|</span>
              <button
                type="button"
                onClick={() => setExpandedSection('data-basis')}
                className="hover:text-[#B74A32] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>VIEW DATA BASIS</span>
                <span className="text-[10px]">→</span>
              </button>
            </div>
          </div>

          {/* 01 // IMPACT SUMMARY (Max 2-3 short sentences) */}
          <div className="p-3.5 bg-white border border-[#E4DEC9] shadow-sm space-y-1">
            <div className="flex items-center justify-between text-[#8A716C] mb-1">
              <span className="font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider">
                01 // IMPACT SUMMARY
              </span>
              <span className="font-label-serif-caps text-[7.5px] text-[#68745A]">OPERATIONAL BRIEF</span>
            </div>
            <p className="font-body-sm text-[12px] text-[#241917] leading-relaxed font-medium">
              Heavy rainfall, low elevation and storm-surge exposure are converging along the coastal corridor. Medical access is the primary operational concern.
            </p>
          </div>

          {/* 02 // WHY IT MATTERS (Concise Visual Reasoning Chain) */}
          <div className="p-3.5 bg-white border border-[#E4DEC9] shadow-sm space-y-2.5">
            <div className="flex items-center justify-between text-[#8A716C]">
              <span className="font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider">
                02 // WHY IT MATTERS
              </span>
              <button
                type="button"
                onClick={() => setExpandedSection('impact-pathway')}
                className="font-label-serif-caps text-[7.5px] text-[#B74A32] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>VIEW FULL IMPACT PATHWAY</span>
                <span>→</span>
              </button>
            </div>

            {/* Visual Reasoning Chain Flow */}
            <div className="flex flex-col items-center gap-1.5 py-1">
              {/* Top Converging Factors */}
              <div className="flex items-center justify-center gap-2 flex-wrap text-center">
                <div className="px-2.5 py-1 bg-[#F2EDE2] border border-[#D5CEBF] font-label-serif-caps text-[9px] font-bold text-[#241917]">
                  {scenario.rainfallMm} MM RAINFALL
                </div>
                <span className="text-[#8A847B] font-bold text-[11px]">+</span>
                <div className="px-2.5 py-1 bg-[#F2EDE2] border border-[#D5CEBF] font-label-serif-caps text-[9px] font-bold text-[#241917]">
                  LOW ELEVATION
                </div>
                <span className="text-[#8A847B] font-bold text-[11px]">+</span>
                <div className="px-2.5 py-1 bg-[#F2EDE2] border border-[#D5CEBF] font-label-serif-caps text-[9px] font-bold text-[#BA1A1A]">
                  +{scenario.stormSurgeM} M SURGE
                </div>
              </div>

              {/* Arrow Down */}
              <span className="text-[#8A847B] text-[12px] leading-none font-bold">&darr;</span>

              {/* Intermediate 1 */}
              <div className="px-3 py-1 bg-[#EAE4D7] border border-[#D5CEBF] font-label-serif-caps text-[9.5px] font-bold text-[#241917]">
                DRAINAGE BACKFLOW
              </div>

              {/* Arrow Down */}
              <span className="text-[#8A847B] text-[12px] leading-none font-bold">&darr;</span>

              {/* Intermediate 2 */}
              <div className="px-3 py-1 bg-[#EAE4D7] border border-[#D5CEBF] font-label-serif-caps text-[9.5px] font-bold text-[#B74A32]">
                ROAD DISRUPTION
              </div>

              {/* Arrow Down */}
              <span className="text-[#BA1A1A] text-[12px] leading-none font-bold">&darr;</span>

              {/* Critical Outcome */}
              <div className="px-4 py-1.5 bg-[#241917] text-white border border-[#BA1A1A] font-label-serif-caps text-[10px] font-bold text-[#FFB4A4] shadow-sm tracking-wider">
                MEDICAL ACCESS RISK
              </div>
            </div>
          </div>

          {/* 03 // MOST VULNERABLE (Top 3 Assets Only) */}
          <div className="p-3.5 bg-white border border-[#E4DEC9] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8A716C]">
              <span className="font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider">
                03 // MOST VULNERABLE
              </span>
              <button
                type="button"
                onClick={() => setExpandedSection('asset-analysis')}
                className="font-label-serif-caps text-[7.5px] text-[#B74A32] hover:underline cursor-pointer flex items-center gap-0.5"
              >
                <span>VIEW FULL ASSET ANALYSIS</span>
                <span>→</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {/* Asset 1 */}
              <div className="p-2.5 bg-[#F9F7F2] border border-[#E2DCCE] flex items-center justify-between">
                <div>
                  <span className="font-headline-sm text-[11px] font-bold text-[#241917] block">
                    REGIONAL MEDICAL CENTER
                  </span>
                  <span className="font-label-serif-caps text-[8.5px] text-[#BA1A1A] block mt-0.5">
                    Access risk
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[10px] font-bold">
                  91
                </span>
              </div>

              {/* Asset 2 */}
              <div className="p-2.5 bg-[#F9F7F2] border border-[#E2DCCE] flex items-center justify-between">
                <div>
                  <span className="font-headline-sm text-[11px] font-bold text-[#241917] block">
                    NH-516
                  </span>
                  <span className="font-label-serif-caps text-[8.5px] text-[#B74A32] block mt-0.5">
                    Flood disruption
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[10px] font-bold">
                  88
                </span>
              </div>

              {/* Asset 3 */}
              <div className="p-2.5 bg-[#F9F7F2] border border-[#E2DCCE] flex items-center justify-between">
                <div>
                  <span className="font-headline-sm text-[11px] font-bold text-[#241917] block">
                    SUBSTATION 04
                  </span>
                  <span className="font-label-serif-caps text-[8.5px] text-[#C8923C] block mt-0.5">
                    Surge exposure
                  </span>
                </div>
                <span className="px-2 py-0.5 bg-[#C8923C] text-white font-label-serif-caps text-[10px] font-bold">
                  86
                </span>
              </div>
            </div>
          </div>

          {/* 04 // RECOMMENDED ACTIONS (Show only 4 priority actions) */}
          <div className="p-3.5 bg-white border border-[#E4DEC9] shadow-sm space-y-2">
            <div className="flex items-center justify-between text-[#8A716C]">
              <span className="font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider">
                04 // RECOMMENDED ACTIONS
              </span>
              <span className="font-label-serif-caps text-[7.5px] text-[#68745A]">PRE-LANDFALL DIRECTIVES</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
              <div className="p-2.5 bg-[#FBF9F5] border-l-3 border-[#B74A32] border-y border-r border-[#E2DCCE] flex items-center gap-2">
                <span className="font-label-serif-caps text-[10px] font-bold text-[#B74A32] shrink-0">01</span>
                <span className="font-bold text-[#241917]">Prepare alternate medical route</span>
              </div>

              <div className="p-2.5 bg-[#FBF9F5] border-l-3 border-[#B74A32] border-y border-r border-[#E2DCCE] flex items-center gap-2">
                <span className="font-label-serif-caps text-[10px] font-bold text-[#B74A32] shrink-0">02</span>
                <span className="font-bold text-[#241917]">Pre-position response teams</span>
              </div>

              <div className="p-2.5 bg-[#FBF9F5] border-l-3 border-[#B74A32] border-y border-r border-[#E2DCCE] flex items-center gap-2">
                <span className="font-label-serif-caps text-[10px] font-bold text-[#B74A32] shrink-0">03</span>
                <span className="font-bold text-[#241917]">Secure exposed power assets</span>
              </div>

              <div className="p-2.5 bg-[#FBF9F5] border-l-3 border-[#B74A32] border-y border-r border-[#E2DCCE] flex items-center gap-2">
                <span className="font-label-serif-caps text-[10px] font-bold text-[#B74A32] shrink-0">04</span>
                <span className="font-bold text-[#241917]">Verify shelter readiness</span>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMN 3: DECISION FACTORS (Right Panel - Clean & Concise) */}
        <div className="w-[280px] bg-[#161413] border-l border-[#262320] p-4 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div className="border-b border-[#262320] pb-2">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] tracking-wider block">
                DECISION FACTORS
              </span>
              <span className="font-label-serif-caps text-[10px] text-[#EDE8E0] font-bold uppercase block mt-0.5">
                PRIMARY COEFFICIENTS
              </span>
            </div>

            {/* HAZARD */}
            <div className="space-y-1.5 p-2.5 bg-[#1C1A18] border border-[#2D2825]">
              <span className="font-label-serif-caps text-[8px] text-[#B74A32] font-bold tracking-wider block">
                HAZARD
              </span>
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between">
                  <span className="text-[#8A847B]">Rainfall</span>
                  <span className="font-bold text-[#C8923C]">280 mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A847B]">Storm Surge</span>
                  <span className="font-bold text-[#BA1A1A]">+2.8 m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A847B]">Wind</span>
                  <span className="font-bold text-[#EDE8E0]">205 km/h</span>
                </div>
              </div>
            </div>

            {/* TERRAIN */}
            <div className="p-2.5 bg-[#1C1A18] border border-[#2D2825] flex justify-between items-center text-[10px]">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] font-bold">TERRAIN</span>
              <div className="text-right">
                <span className="text-[#8A847B] text-[8.5px] mr-1.5">Elevation</span>
                <span className="font-bold text-[#BECBAD]">2.1 m</span>
              </div>
            </div>

            {/* EXPOSURE */}
            <div className="p-2.5 bg-[#1C1A18] border border-[#2D2825] flex justify-between items-center text-[10px]">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] font-bold">EXPOSURE</span>
              <span className="font-bold text-[#FFB4A4]">19 Critical Assets</span>
            </div>

            {/* MODEL */}
            <div className="p-2.5 bg-[#1C1A18] border border-[#2D2825] flex justify-between items-center text-[10px]">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] font-bold">MODEL</span>
              <span className="font-bold text-[#BA1A1A]">94 / 100</span>
            </div>

            {/* ANALYSIS CONFIDENCE */}
            <div className="p-2.5 bg-[#1C1A18] border border-[#2D2825] flex justify-between items-center text-[10px]">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] font-bold">ANALYSIS CONFIDENCE</span>
              <span className="px-1.5 py-0.5 bg-[#68745A]/20 border border-[#68745A] text-[#BECBAD] font-label-serif-caps text-[8px] font-bold">
                HIGH
              </span>
            </div>
          </div>

          {/* Quick Cross-Module Exploration links */}
          <div className="pt-3 border-t border-[#262320] space-y-1">
            <span className="font-label-serif-caps text-[7.5px] text-[#7A7168] uppercase font-bold block mb-1">
              CROSS-MODULE AUDIT
            </span>
            <button
              type="button"
              onClick={() => setActiveTab('impact-map')}
              className="w-full text-left px-2 py-1 bg-[#1C1A18] hover:bg-[#25221F] border border-[#2D2825] text-[9px] text-[#DDD8CE] flex items-center justify-between cursor-pointer"
            >
              <span>Inspect on Impact Map</span>
              <span className="text-[11px] text-[#B74A32]">&rarr;</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advisories-and-alerts')}
              className="w-full text-left px-2 py-1 bg-[#1C1A18] hover:bg-[#25221F] border border-[#2D2825] text-[9px] text-[#DDD8CE] flex items-center justify-between cursor-pointer"
            >
              <span>Issue Advisory Brief</span>
              <span className="text-[11px] text-[#B74A32]">&rarr;</span>
            </button>
          </div>
        </div>
      </div>

      {/* EXPANDABLE DETAILS DRAWER / MODAL (On Demand) */}
      {expandedSection && (
        <div className="border-t border-[#332E2A] bg-[#1A1816] p-4 text-[#EDE8E0] space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b border-[#2C2723] pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[15px] text-[#B74A32]">info</span>
              <span className="font-headline-sm text-[12px] font-bold uppercase tracking-wider text-[#F7F4EE]">
                {expandedSection === 'model-details' && 'TECHNICAL MODEL DETAILS & ENSEMBLE SPECIFICATIONS'}
                {expandedSection === 'impact-pathway' && 'FULL COMPOUND IMPACT PATHWAY // TEMPORAL PROGRESSION'}
                {expandedSection === 'data-basis' && 'HYDROLOGIC & SATELLITE DATA BASIS'}
                {expandedSection === 'asset-analysis' && 'FULL CRITICAL ASSET VULNERABILITY AUDIT'}
                {expandedSection === 'telemetry' && 'COMPREHENSIVE TELEMETRY & ATTRIBUTION BREAKDOWN'}
                {expandedSection === 'query-deep-dive' && 'QUERY REASONING & DETAILED CAUSAL SYNTHESIS'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedSection(null)}
              className="px-2 py-0.5 bg-[#25221F] hover:bg-[#332E2A] border border-[#3E3832] font-label-serif-caps text-[8px] text-[#DDD8CE] cursor-pointer"
            >
              CLOSE DETAILS &times;
            </button>
          </div>

          {/* Model Details Body */}
          {expandedSection === 'model-details' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
              <div className="p-2.5 bg-[#141312] border border-[#2D2825] space-y-1">
                <span className="font-label-serif-caps text-[8px] text-[#B74A32] font-bold block">
                  HYDRODYNAMIC COMPUTATION
                </span>
                <p className="text-[#9E978F] leading-relaxed">
                  SLOSH-IND-V2 calibrated on 30m ALOS-PALSAR Digital Elevation Model. Coupled with 2D Saint-Venant shallow water overland solver.
                </p>
              </div>
              <div className="p-2.5 bg-[#141312] border border-[#2D2825] space-y-1">
                <span className="font-label-serif-caps text-[8px] text-[#FFB4A4] font-bold block">
                  ENSEMBLE CONVERGENCE
                </span>
                <p className="text-[#9E978F] leading-relaxed">
                  50-member ECMWF forecast spread &lt;0.14° across Sector-04B. Run #09 model rigidity evaluated at 98.4%.
                </p>
              </div>
              <div className="p-2.5 bg-[#141312] border border-[#2D2825] space-y-1">
                <span className="font-label-serif-caps text-[8px] text-[#BECBAD] font-bold block">
                  GEMINI DECISION INTELLIGENCE
                </span>
                <p className="text-[#9E978F] leading-relaxed">
                  Causal graph deduction, multi-modal spatial synthesis, and executive directive formulation executed via server-side pipeline.
                </p>
              </div>
            </div>
          )}

          {/* Impact Pathway Body */}
          {expandedSection === 'impact-pathway' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">PHASE 01 // T-28H</span>
                <strong className="text-[#EDE8E0] block mt-0.5">Precipitation Overload</strong>
                <span className="text-[9px] text-[#9E978F]">280mm convective rain saturates catchment soil.</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">PHASE 02 // T-20H</span>
                <strong className="text-[#EDE8E0] block mt-0.5">Estuary Damming</strong>
                <span className="text-[9px] text-[#9E978F]">+2.8m storm surge locks river mouth discharge.</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#BA1A1A]">
                <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] block font-bold">PHASE 03 // T-14H</span>
                <strong className="text-[#FFB4A4] block mt-0.5">NH-516 Inundation</strong>
                <span className="text-[9px] text-[#FFB4A4]">Water level breaches 1.2m depth over culverts.</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#BA1A1A]">
                <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] block font-bold">PHASE 04 // T-10H</span>
                <strong className="text-[#FFB4A4] block mt-0.5">Medical Corridor Severance</strong>
                <span className="text-[9px] text-[#FFB4A4]">Trauma Center road access completely isolated.</span>
              </div>
            </div>
          )}

          {/* Data Basis Body */}
          {expandedSection === 'data-basis' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[10px]">
              <div className="p-2.5 bg-[#141312] border border-[#2D2825]">
                <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">EARTH OBSERVATION</span>
                <span className="text-[#EDE8E0] font-bold block mt-0.5">Sentinel-1 SAR + GEE DEM</span>
                <span className="text-[9px] text-[#8A847B]">Resolution: 30m grid // Coastal bathymetry calibrated</span>
              </div>
              <div className="p-2.5 bg-[#141312] border border-[#2D2825]">
                <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">METEOROLOGICAL MODEL</span>
                <span className="text-[#EDE8E0] font-bold block mt-0.5">IMD / ECMWF Ensemble Blend</span>
                <span className="text-[9px] text-[#8A847B]">Core: 944 hPa // Sustained wind: 205 km/h</span>
              </div>
              <div className="p-2.5 bg-[#141312] border border-[#2D2825]">
                <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">TIDAL HYDRODYNAMICS</span>
                <span className="text-[#EDE8E0] font-bold block mt-0.5">Spring Tide Coincidence</span>
                <span className="text-[9px] text-[#8A847B]">Tidal amplitude: +0.7m // Surge addition: +2.1m (Total: +2.8m)</span>
              </div>
            </div>
          )}

          {/* Asset Analysis Body */}
          {expandedSection === 'asset-analysis' && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-[10px]">
              <div className="p-2 bg-[#141312] border border-[#BA1A1A]">
                <span className="font-bold text-[#FFB4A4] block">Regional Medical Center</span>
                <span className="text-[8.5px] text-[#8A847B]">Score: 91/100 • Critical Ambulance Cutoff</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#BA1A1A]">
                <span className="font-bold text-[#FFB4A4] block">NH-516 Arterial Corridor</span>
                <span className="text-[8.5px] text-[#8A847B]">Score: 88/100 • 7 Segments Submerged</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#C8923C]">
                <span className="font-bold text-[#FFB4A4] block">Chandbali 132kV Substation</span>
                <span className="text-[8.5px] text-[#8A847B]">Score: 86/100 • Yard Bund Overtopping</span>
              </div>
              <div className="p-2 bg-[#141312] border border-[#68745A]">
                <span className="font-bold text-[#BECBAD] block">Cyclone Shelters (6 Units)</span>
                <span className="text-[8.5px] text-[#8A847B]">Score: 68/100 • 4,820 Persons Capacity</span>
              </div>
            </div>
          )}

          {/* Full Telemetry Body */}
          {expandedSection === 'telemetry' && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-[10px]">
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="text-[#8A847B] text-[8px] block">Central Pressure</span>
                <strong className="text-[#EDE8E0]">944 hPa</strong>
              </div>
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="text-[#8A847B] text-[8px] block">Gust Velocity</span>
                <strong className="text-[#EDE8E0]">235 km/h</strong>
              </div>
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="text-[#8A847B] text-[8px] block">Estuary Baseline</span>
                <strong className="text-[#EDE8E0]">2.1m ASL</strong>
              </div>
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="text-[#8A847B] text-[8px] block">Inundation Footprint</span>
                <strong className="text-[#BA1A1A]">168 km²</strong>
              </div>
              <div className="p-2 bg-[#141312] border border-[#2D2825]">
                <span className="text-[#8A847B] text-[8px] block">Population in Cone</span>
                <strong className="text-[#FFB4A4]">1.42M</strong>
              </div>
            </div>
          )}

          {/* Query Deep Dive */}
          {expandedSection === 'query-deep-dive' && (
            <div className="p-3 bg-[#141312] border border-[#3A332E] space-y-2 text-[10.5px]">
              <span className="font-label-serif-caps text-[8.5px] text-[#FFB4A4] uppercase font-bold block">
                GEMINI REASONING &amp; MULTI-MODAL SYNTHESIS
              </span>
              <p className="font-body-sm text-[#DDD8CE] leading-relaxed">
                {structuredAnswer.deepDive}
              </p>
            </div>
          )}
        </div>
      )}

      {/* BOTTOM CONSOLE: ASK AVARTH (Compact, Decision-First AI Output) */}
      <div className="p-3.5 bg-[#171514] border-t border-[#262320] space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-[#B74A32]"></span>
            <span className="font-headline-sm text-[12px] font-bold text-[#EDE8E0] uppercase tracking-wider">
              ASK AVARTH
            </span>
            <span className="h-3 w-px bg-[#332E2A]"></span>
            <span className="font-label-serif-caps text-[8px] text-[#9E978F]">
              GEMINI DECISION INTELLIGENCE
            </span>
          </div>
          <span className="font-label-serif-caps text-[8px] text-[#8A847B]">
            EXECUTIVE QUERY // RESPONSE &lt;240MS
          </span>
        </div>

        {/* Compact Suggested Questions */}
        <div className="flex flex-wrap items-center gap-1.5">
          {sampleQueries.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQueryInput(q);
                handleRunQuery(q);
              }}
              className={`px-2 py-0.5 font-body-sm text-[9.5px] border cursor-pointer transition-colors ${
                activeQuestion === q
                  ? 'bg-[#251917] border-[#B74A32] text-[#FFB4A4]'
                  : 'bg-[#1D1B1A] border-[#332E2A] text-[#9E978F] hover:text-[#EDE8E0] hover:border-[#8A847B]'
              }`}
            >
              "{q}"
            </button>
          ))}
        </div>

        {/* Compact Input Bar */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-2.5 top-2 text-[14px] text-[#B74A32]">
              search
            </span>
            <input
              type="text"
              value={queryInput}
              onChange={e => setQueryInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleRunQuery()}
              placeholder="Ask AVARTH: scenario delta, asset vulnerability, route disruption..."
              className="w-full bg-[#1A1816] border border-[#332E2A] pl-8 pr-3 py-1.5 text-[11px] font-body-sm text-[#EDE8E0] placeholder-[#6E675F] focus:border-[#B74A32] focus:outline-none"
            />
          </div>
          <button
            type="button"
            onClick={() => handleRunQuery()}
            disabled={isQuerying}
            className="px-3.5 py-1.5 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[9.5px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <span className={`material-symbols-outlined text-[13px] ${isQuerying ? 'animate-spin' : ''}`}>
              {isQuerying ? 'refresh' : 'send'}
            </span>
            <span>{isQuerying ? 'ANALYZING...' : 'RUN INQUIRY →'}</span>
          </button>
        </div>

        {/* DECISION-FIRST STRUCTURED AI RESPONSE FORMAT */}
        <div className="p-3 bg-[#1C1A18] border border-[#332E2A] space-y-2">
          {/* Question Line */}
          <div className="flex items-center justify-between border-b border-[#282421] pb-1.5">
            <div className="flex items-center gap-2 text-[10.5px]">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] uppercase font-bold">
                QUESTION:
              </span>
              <span className="font-bold text-[#EDE8E0]">"{structuredAnswer.question}"</span>
            </div>
            <button
              type="button"
              onClick={() => setExpandedSection('query-deep-dive')}
              className="font-label-serif-caps text-[8px] text-[#FFB4A4] hover:underline cursor-pointer flex items-center gap-0.5"
            >
              <span>VIEW FULL ANALYSIS</span>
              <span>→</span>
            </button>
          </div>

          {/* Structured Key Values */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[10px]">
            {/* Risk */}
            <div className="p-2 bg-[#141312] border border-[#2B2723]">
              <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">RISK</span>
              <span className="font-bold text-[#BA1A1A] text-[13px] block mt-0.5">
                {structuredAnswer.riskFrom} &rarr; {structuredAnswer.riskTo}
              </span>
            </div>

            {/* New Exposure */}
            <div className="p-2 bg-[#141312] border border-[#2B2723]">
              <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">NEW EXPOSURE</span>
              <span className="font-bold text-[#FFB4A4] text-[11px] block mt-0.5">
                {structuredAnswer.newExposure}
              </span>
            </div>

            {/* Primary Effect */}
            <div className="p-2 bg-[#141312] border border-[#2B2723]">
              <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">PRIMARY EFFECT</span>
              <span className="font-bold text-[#EDE8E0] text-[10.5px] block mt-0.5 leading-snug">
                {structuredAnswer.primaryEffect}
              </span>
            </div>

            {/* Recommended Action */}
            <div className="p-2 bg-[#141312] border border-[#2B2723]">
              <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">RECOMMENDED ACTION</span>
              <span className="font-bold text-[#BECBAD] text-[10px] block mt-0.5 leading-snug">
                {structuredAnswer.recommendedAction}
              </span>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-between pt-1 border-t border-[#262320]">
            <span className="font-label-serif-caps text-[7.5px] text-[#7A7168]">
              ENGINE: GEMINI DECISION INTELLIGENCE // 0.24S
            </span>
            <button
              type="button"
              onClick={handleIssueExecutionDirective}
              className="px-2.5 py-1 bg-[#BA1A1A] hover:bg-[#8F2920] text-white font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider transition-colors cursor-pointer"
            >
              {issuedDirectiveSuccess ? 'DIRECTIVE DISPATCHED ✓' : 'ISSUE SECTOR DIRECTIVE'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
