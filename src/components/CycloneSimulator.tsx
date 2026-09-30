import React, { useState, useEffect } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

export const CycloneSimulator: React.FC = () => {
  const { scenario, sharedScenario, simulationResult, runSimulation, isSimulating, resetToBaseline, setActiveTab } = useScenario();

  // Slider parameter values synced with shared scenario
  const [windKmh, setWindKmh] = useState<number>(sharedScenario.windKmh || 205);
  const [rainfallMm, setRainfallMm] = useState<number>(sharedScenario.rainfallMm || 280);
  const [stormSurgeM, setStormSurgeM] = useState<number>(sharedScenario.stormSurgeM || 2.8);
  const [landfallDistKm, setLandfallDistKm] = useState<number>(sharedScenario.landfallDistanceKm || 12);

  const [activePreset, setActivePreset] = useState<'baseline' | 'elevated' | 'extreme'>('elevated');
  const [showDelta, setShowDelta] = useState<boolean>(true);

  // Sync internal slider state if scenario changes externally (e.g. from forecast timeline)
  useEffect(() => {
    setWindKmh(sharedScenario.windKmh);
    setRainfallMm(sharedScenario.rainfallMm);
    setStormSurgeM(sharedScenario.stormSurgeM);
    setLandfallDistKm(sharedScenario.landfallDistanceKm);
  }, [sharedScenario]);

  const applyPreset = (preset: 'baseline' | 'elevated' | 'extreme') => {
    setActivePreset(preset);
    let w = 185;
    let r = 220;
    let s = 2.4;
    let d = 12;

    if (preset === 'baseline') {
      w = 185;
      r = 220;
      s = 2.4;
      d = 12;
    } else if (preset === 'elevated') {
      w = 205;
      r = 280;
      s = 2.8;
      d = 12;
    } else {
      w = 230;
      r = 350;
      s = 3.4;
      d = 8;
    }

    setWindKmh(w);
    setRainfallMm(r);
    setStormSurgeM(s);
    setLandfallDistKm(d);
    runSimulation({ windKmh: w, rainfallMm: r, stormSurgeM: s, landfallDistanceKm: d });
  };

  const handleWindChange = (val: number) => {
    setWindKmh(val);
    runSimulation({ windKmh: val, rainfallMm, stormSurgeM, landfallDistanceKm: landfallDistKm });
  };

  const handleRainChange = (val: number) => {
    setRainfallMm(val);
    runSimulation({ windKmh, rainfallMm: val, stormSurgeM, landfallDistanceKm: landfallDistKm });
  };

  const handleSurgeChange = (val: number) => {
    setStormSurgeM(val);
    runSimulation({ windKmh, rainfallMm, stormSurgeM: val, landfallDistanceKm: landfallDistKm });
  };

  const handleDistChange = (val: number) => {
    setLandfallDistKm(val);
    runSimulation({ windKmh, rainfallMm, stormSurgeM, landfallDistanceKm: val });
  };

  const handleRun = () => {
    runSimulation({
      windKmh,
      rainfallMm,
      stormSurgeM,
      landfallDistanceKm: landfallDistKm,
    });
  };

  const handleReset = () => {
    setActivePreset('baseline');
    setWindKmh(185);
    setRainfallMm(220);
    setStormSurgeM(2.4);
    setLandfallDistKm(12);
    resetToBaseline();
  };

  // Determine dynamic deltas from deterministic simulation
  const currentRisk = simulationResult.riskScore;
  const riskDelta = simulationResult.delta.riskScoreDelta;
  const isElevated = rainfallMm >= 240 || stormSurgeM >= 2.6 || windKmh >= 195;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header Bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            CYCLONE SIMULATOR
          </span>
          <span className="px-1.5 py-0.5 bg-[#BA1A1A]/20 border border-[#BA1A1A]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            SCENARIO SIMULATION LEVEL-4
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            Explore how changing cyclone conditions alter hazard exposure and infrastructure vulnerability across coastal sectors.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-serif-caps text-[8.5px] text-[#C8923C] bg-[#2A2318] px-2 py-0.5 border border-[#685328] uppercase font-semibold">
            SIMULATED SCENARIO
          </span>
          <span className="font-label-serif-caps text-[8.5px] text-[#8A847B]">
            ID: {scenario.scenarioId} • {Math.abs(scenario.forecastHour)}H HORIZON
          </span>
        </div>
      </div>

      {/* Tri-Pane Composition: Parameters (Left) | Comparison Map (Center) | Impact Audit (Right) */}
      <div className="flex flex-1 min-h-[620px] overflow-hidden">
        {/* LEFT COLUMN: SCENARIO PARAMETERS (280px) */}
        <div className="w-[300px] bg-[#161413] border-r border-[#262320] p-3.5 flex flex-col justify-between shrink-0 overflow-y-auto">
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-serif-caps text-[9px] uppercase tracking-wider text-[#DDD8CE] font-bold">
                  SCENARIO PARAMETERS
                </span>
                <span className="font-label-serif-caps text-[7.5px] text-[#68745A]">DETERMINISTIC SIM</span>
              </div>
              <p className="font-body-sm text-[10px] text-[#8A847B] leading-tight">
                Adjust variables to explore hazard escalation vectors.
              </p>
            </div>

            {/* Presets Grid */}
            <div>
              <span className="font-label-serif-caps text-[8px] text-[#7A7168] uppercase block mb-1">
                CALIBRATED PRESETS
              </span>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => applyPreset('baseline')}
                  className={`p-1.5 border text-left cursor-pointer transition-colors ${
                    activePreset === 'baseline'
                      ? 'bg-[#251917] border-[#B74A32] text-white'
                      : 'bg-[#1D1B1A] border-[#332E2A] text-[#9E978F] hover:border-[#8A847B]'
                  }`}
                >
                  <span className="font-label-serif-caps text-[8px] font-bold block">BASELINE</span>
                  <span className="font-label-serif-caps text-[7px] text-[#8A847B] block">185k • 220m • 2.4m</span>
                </button>

                <button
                  onClick={() => applyPreset('elevated')}
                  className={`p-1.5 border text-left cursor-pointer transition-colors ${
                    activePreset === 'elevated'
                      ? 'bg-[#B74A32] border-[#FFB4A4] text-white'
                      : 'bg-[#1D1B1A] border-[#332E2A] text-[#9E978F] hover:border-[#8A847B]'
                  }`}
                >
                  <span className="font-label-serif-caps text-[8px] font-bold block">ELEVATED</span>
                  <span className="font-label-serif-caps text-[7px] text-[#FFDAD2] block">205k • 280m • 2.8m</span>
                </button>

                <button
                  onClick={() => applyPreset('extreme')}
                  className={`p-1.5 border text-left cursor-pointer transition-colors ${
                    activePreset === 'extreme'
                      ? 'bg-[#BA1A1A] border-[#FFDAD6] text-white'
                      : 'bg-[#1D1B1A] border-[#332E2A] text-[#9E978F] hover:border-[#8A847B]'
                  }`}
                >
                  <span className="font-label-serif-caps text-[8px] font-bold block">EXTREME</span>
                  <span className="font-label-serif-caps text-[7px] text-[#8A847B] block">230k • 350m • 3.4m</span>
                </button>
              </div>
            </div>

            {/* Parameter Sliders */}
            <div className="space-y-3.5">
              {/* 1. Wind Speed */}
              <div className="p-2 bg-[#1A1816] border border-[#2D2825] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">1. WIND SPEED SUSTAINED</span>
                  <span className="font-headline-sm text-[13px] font-bold text-[#FFB4A4]">{windKmh} KM/H</span>
                </div>
                <input
                  type="range"
                  min="140"
                  max="260"
                  step="5"
                  value={windKmh}
                  onChange={e => handleWindChange(Number(e.target.value))}
                  className="w-full accent-[#B74A32] h-1 bg-[#282421] cursor-pointer"
                />
                <div className="flex justify-between text-[7px] font-label-serif-caps text-[#7A7168]">
                  <span>MIN 140 KM/H</span>
                  <span>CAT 4+ INTENSIFICATION</span>
                  <span>MAX 260 KM/H</span>
                </div>
              </div>

              {/* 2. Total Precipitation */}
              <div className="p-2 bg-[#1A1816] border border-[#2D2825] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">2. 24H TOTAL PRECIPITATION</span>
                  <span className="font-headline-sm text-[13px] font-bold text-[#C8923C]">{rainfallMm} MM</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="450"
                  step="10"
                  value={rainfallMm}
                  onChange={e => handleRainChange(Number(e.target.value))}
                  className="w-full accent-[#C8923C] h-1 bg-[#282421] cursor-pointer"
                />
                <div className="flex justify-between text-[7px] font-label-serif-caps text-[#7A7168]">
                  <span>MIN 100 MM</span>
                  <span className="text-[#C8923C]">DELTA: {rainfallMm - 220 >= 0 ? `+${rainfallMm - 220}` : rainfallMm - 220} MM</span>
                  <span>MAX 450 MM</span>
                </div>
              </div>

              {/* 3. Storm Surge */}
              <div className="p-2 bg-[#1A1816] border border-[#2D2825] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">3. PEAK STORM SURGE</span>
                  <span className="font-headline-sm text-[13px] font-bold text-[#BA1A1A]">{stormSurgeM} M</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="4.5"
                  step="0.1"
                  value={stormSurgeM}
                  onChange={e => handleSurgeChange(Number(e.target.value))}
                  className="w-full accent-[#BA1A1A] h-1 bg-[#282421] cursor-pointer"
                />
                <div className="flex justify-between text-[7px] font-label-serif-caps text-[#7A7168]">
                  <span>MIN 1.0 M</span>
                  <span>HIGH-TIDE CONCURRENT</span>
                  <span>MAX 4.5 M</span>
                </div>
              </div>

              {/* 4. Landfall Proximity */}
              <div className="p-2 bg-[#1A1816] border border-[#2D2825] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">4. LANDFALL PROXIMITY</span>
                  <span className="font-headline-sm text-[13px] font-bold text-[#DDD8CE]">{landfallDistKm} KM</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="60"
                  step="2"
                  value={landfallDistKm}
                  onChange={e => handleDistChange(Number(e.target.value))}
                  className="w-full accent-[#B74A32] h-1 bg-[#282421] cursor-pointer"
                />
                <div className="flex justify-between text-[7px] font-label-serif-caps text-[#7A7168]">
                  <span>0 KM (DIRECT EYE)</span>
                  <span>DHAMRA-PARADIP TRANSECT</span>
                  <span>60 KM</span>
                </div>
              </div>
            </div>

            {/* Run Button */}
            <button
              onClick={handleRun}
              disabled={isSimulating}
              className="w-full py-2.5 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className={`material-symbols-outlined text-[15px] ${isSimulating ? 'animate-spin' : ''}`}>
                {isSimulating ? 'refresh' : 'play_arrow'}
              </span>
              <span>{isSimulating ? 'CALCULATING RISK...' : 'RUN IMPACT SIMULATION'}</span>
            </button>

            <div className="p-2 bg-[#121110] border border-[#262320] text-[8px] font-label-serif-caps text-[#8A847B] flex items-center justify-between">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#68745A]"></span>
                SIMULATION STATUS:
              </span>
              <span className="text-[#BECBAD]">CALCULATED DYNAMICALLY</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#262320] flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex-1 py-1.5 bg-[#1E1C1A] hover:bg-[#282421] border border-[#332E2A] font-label-serif-caps text-[8.5px] uppercase tracking-wider text-[#9E978F] cursor-pointer"
            >
              RESET PARAMS
            </button>
            <button
              onClick={() => setActiveTab('ai-impact-analyst')}
              className="flex-1 py-1.5 bg-[#1E1C1A] hover:bg-[#282421] border border-[#332E2A] font-label-serif-caps text-[8.5px] uppercase tracking-wider text-[#FFB4A4] cursor-pointer"
            >
              AI INVESTIGATE
            </button>
          </div>
        </div>

        {/* CENTER COLUMN: GEOSPATIAL COMPARISON (FLUID) */}
        <div className="flex-1 bg-[#0F0E0D] flex flex-col overflow-hidden border-r border-[#262320] relative">
          {/* Top Bar */}
          <div className="h-9 bg-[#171514] border-b border-[#262320] px-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-[#B74A32]"></span>
              <span className="font-label-serif-caps text-[9px] uppercase font-bold text-[#DDD8CE]">
                GEOSPATIAL IMPACT COMPARISON // DHAMRA-PARADIP CORRIDOR
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 text-[8.5px] font-label-serif-caps text-[#EDE8E0] cursor-pointer">
                <input
                  type="checkbox"
                  checked={showDelta}
                  onChange={e => setShowDelta(e.target.checked)}
                  className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                />
                <span>SHOW IMPACT DELTA</span>
              </label>
              <div className="h-3 w-px bg-[#332E2A]"></div>
              <span className="font-label-serif-caps text-[8px] text-[#8A847B]">
                SPLIT COMPARISON | OVERLAY DUAL
              </span>
            </div>
          </div>

          {/* Scenario Comparison Legend */}
          <div className="bg-[#141211]/90 border-b border-[#262320] px-3 py-1.5 flex items-center justify-between text-[8px] font-label-serif-caps z-20">
            <div className="flex items-center gap-1.5 text-[#9E978F]">
              <span className="w-2 h-2 bg-[#5A524A]"></span>
              <span>BASELINE SCENARIO (CAT 4 // 185 KM/H • 220 MM • 2.4M SURGE)</span>
            </div>
            <div className="flex items-center gap-1.5 text-[#FFB4A4]">
              <span className="w-2 h-2 bg-[#BA1A1A]"></span>
              <span>SIMULATED ESCALATION ({windKmh} KM/H • {rainfallMm} MM • {stormSurgeM}M SURGE)</span>
            </div>
            {isElevated && (
              <span className="text-[#BA1A1A] font-bold">
                DELTA ANALYSIS: +{Math.round(Math.abs(simulationResult.delta.floodExposureDelta) * 3.4)} KM² INUNDATION EXPANSION
              </span>
            )}
          </div>

          {/* SVG Canvas for Simulation Split Comparison */}
          <div className="relative flex-1 w-full h-full overflow-hidden">
            <svg
              className="w-full h-full block"
              preserveAspectRatio="xMidYMid slice"
              viewBox="0 0 800 560"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="sim-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#221F1C" strokeWidth="0.75" />
                  <circle cx="40" cy="0" r="0.8" fill="#3A342E" />
                </pattern>
                <linearGradient id="split-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#171514" />
                  <stop offset="100%" stopColor="#1D1917" />
                </linearGradient>
              </defs>

              <rect width="800" height="560" fill="url(#split-grad)" />
              <rect width="800" height="560" fill="url(#sim-grid)" />

              {/* Baseline Inundation Boundary */}
              <path
                d="M260,140 L380,180 L420,320 L310,330 L260,250 Z"
                fill="#842510"
                fillOpacity="0.25"
                stroke="#B74A32"
                strokeWidth="1.2"
              />

              {/* Simulated Escalated Inundation Boundary */}
              {isElevated && (
                <path
                  className="anim-surge-polygon"
                  d="M220,110 L440,160 L480,360 L280,380 L230,220 Z"
                  fill="#BA1A1A"
                  fillOpacity="0.38"
                  stroke="#BA1A1A"
                  strokeDasharray="4,2"
                  strokeWidth="2"
                />
              )}

              {/* Coastline */}
              <path
                d="M280,0 C300,70 275,130 295,180 C310,220 360,240 345,300 C330,355 295,380 305,445 C318,495 362,525 335,585"
                fill="none"
                stroke="#68745A"
                strokeWidth="2"
              />

              {/* NH-516 Highway with Breached Segment */}
              <path d="M190,80 L250,210 L280,340 L250,480" fill="none" stroke="#8A716C" strokeDasharray="6,3" strokeWidth="2.5" />
              <path d="M250,210 L340,240 L350,270" fill="none" stroke="#BA1A1A" strokeDasharray="3,2" strokeWidth="3" />

              {/* Marker: Chandbali Substation */}
              <g transform="translate(290, 190)">
                <rect x="-8" y="-12" width="135" height="18" fill="#BA1A1A" stroke="#FFB4A4" strokeWidth="1" />
                <text x="59" y="1" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" textAnchor="middle">
                  CHANDBALI 132kV [{simulationResult.powerAssetsExposed > 4 ? 'SUBMERGED' : 'STANDBY'}]
                </text>
              </g>

              {/* Marker: NH-516 */}
              <g transform="translate(330, 245)">
                <rect x="-8" y="-12" width="135" height="18" fill="#BA1A1A" stroke="#FFB4A4" strokeWidth="1" />
                <text x="59" y="1" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" textAnchor="middle">
                  NH-516 MP 12-19 [{simulationResult.roadsExposed > 7 ? 'BREACHED' : 'CAUTION'}]
                </text>
              </g>

              {/* Marker: Regional Med Ctr */}
              <g transform="translate(220, 260)">
                <rect x="-6" y="-12" width="116" height="18" fill="#1E1917" stroke="#BA1A1A" strokeWidth="1.2" />
                <circle cx="2" cy="-3" r="3.5" fill="#BA1A1A" />
                <text x="10" y="0" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                  REGIONAL MED CTR
                </text>
              </g>

              {/* Marker: Paradip Port */}
              <g transform="translate(360, 390)">
                <rect x="-6" y="-12" width="100" height="18" fill="#1E1917" stroke="#C8923C" strokeWidth="1.2" />
                <circle cx="2" cy="-3" r="3.5" fill="#C8923C" />
                <text x="10" y="0" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                  PARADIP PORT
                </text>
              </g>

              {/* Severe Isolation Callout Badge */}
              <g transform="translate(380, 480)">
                <rect x="-80" y="-14" width="160" height="22" fill="#BA1A1A" stroke="#FFFFFF" strokeWidth="1.2" />
                <text x="0" y="2" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="9" fontWeight="bold" textAnchor="middle">
                  TRAUMA CTR [ISOLATED {currentRisk}]
                </text>
              </g>

              {/* Vertical Split Line Slider Simulation */}
              <line x1="400" y1="0" x2="400" y2="560" stroke="#FFB4A4" strokeWidth="1.5" strokeDasharray="4,3" />
              <g transform="translate(400, 280)">
                <circle cx="0" cy="0" r="12" fill="#B74A32" stroke="#FFFFFF" strokeWidth="1.5" />
                <text x="0" y="3" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8" textAnchor="middle">
                  SPLIT
                </text>
              </g>
            </svg>
          </div>

          {/* Footer Bar */}
          <div className="h-8 bg-[#141211] border-t border-[#262320] px-3 flex items-center justify-between shrink-0 text-[#9E978F] text-[8px] font-label-serif-caps">
            <span>CENTER: 20°48'N, 86°59'E | ELEVATION: 2.1M ASL | RAPID SCREENING ENGINE</span>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1"><span className="w-2 h-1.5 bg-[#842510]"></span>BASELINE CONTOUR</span>
              <span className="flex items-center gap-1"><span className="w-2 h-1.5 bg-[#BA1A1A]"></span>SIMULATED INUNDATION</span>
              <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-[#BA1A1A]"></span>CRITICAL ASSET</span>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: RISK IMPACT AUDIT (380px) */}
        <aside className="w-[380px] bg-[#F7F4EE] text-[#241917] flex flex-col justify-between overflow-y-auto border-l border-[#D8D2C5]">
          <div className="p-4 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2DCCE] pb-2">
              <div>
                <span className="font-label-serif-caps text-[8px] text-[#7A7168] block">MODULE 02 // RISK IMPACT AUDIT</span>
                <span className="font-headline-sm text-[13px] font-bold text-[#241917] uppercase">
                  SIMULATION RESULTS
                </span>
              </div>
              <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[9px] font-bold">
                {riskDelta >= 0 ? `+${riskDelta}` : riskDelta} {simulationResult.riskLevel}
              </span>
            </div>

            {/* Parameter Delta Audit Table */}
            <div className="border border-[#E4DEC9] bg-white text-[10.5px]">
              <div className="grid grid-cols-2 p-1.5 bg-[#F2EDE2] font-label-serif-caps text-[7.5px] text-[#7A7168] font-bold">
                <span>PARAMETER</span>
                <span className="text-right">BEFORE &rarr; AFTER</span>
              </div>

              <div className="divide-y divide-[#F0ECE1]">
                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="font-bold text-[#241917]">OVERALL SECTOR RISK</span>
                  <span className="text-right font-bold text-[#BA1A1A]">
                    87 &rarr; {simulationResult.riskScore} <span className="text-[9px]">({riskDelta >= 0 ? `+${riskDelta}` : riskDelta} ESC)</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="text-[#4A3E3B]">SURGE EXPOSURE</span>
                  <span className="text-right font-medium text-[#241917]">
                    78% &rarr; {simulationResult.floodExposure}% {simulationResult.delta.floodExposureDelta !== 0 && (
                      <span className="text-[9px] text-[#BA1A1A]">
                        ({simulationResult.delta.floodExposureDelta > 0 ? `+${simulationResult.delta.floodExposureDelta}%` : `${simulationResult.delta.floodExposureDelta}%`} // +{Math.round(Math.abs(simulationResult.delta.floodExposureDelta) * 3.4)}km²)
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="text-[#4A3E3B]">ROADS SUBMERGED</span>
                  <span className="text-right font-medium text-[#241917]">
                    7 &rarr; {simulationResult.roadsExposed} {simulationResult.delta.roadsDelta !== 0 && (
                      <span className="text-[9px] text-[#BA1A1A]">
                        ({simulationResult.delta.roadsDelta > 0 ? `+${simulationResult.delta.roadsDelta} BREACH` : `${simulationResult.delta.roadsDelta}`})
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="text-[#4A3E3B]">MEDICAL FACILITIES EXPOSED</span>
                  <span className="text-right font-medium text-[#241917]">
                    2 &rarr; {simulationResult.medicalFacilitiesExposed} {simulationResult.delta.medicalDelta !== 0 && (
                      <span className="text-[9px] text-[#BA1A1A]">
                        ({simulationResult.delta.medicalDelta > 0 ? `+${simulationResult.delta.medicalDelta} ISOLATED` : `${simulationResult.delta.medicalDelta}`})
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="text-[#4A3E3B]">POWER ASSETS JEOPARDIZED</span>
                  <span className="text-right font-medium text-[#241917]">
                    4 &rarr; {simulationResult.powerAssetsExposed} {simulationResult.delta.powerDelta !== 0 && (
                      <span className="text-[9px] text-[#BA1A1A]">
                        ({simulationResult.delta.powerDelta > 0 ? `+${simulationResult.delta.powerDelta} FLOODED` : `${simulationResult.delta.powerDelta}`})
                      </span>
                    )}
                  </span>
                </div>

                <div className="grid grid-cols-2 p-2 items-center">
                  <span className="text-[#4A3E3B]">SHELTERS CUT OFF</span>
                  <span className="text-right font-medium text-[#241917]">
                    6 &rarr; {simulationResult.sheltersExposed} {simulationResult.delta.sheltersDelta !== 0 && (
                      <span className="text-[9px] text-[#BA1A1A]">
                        ({simulationResult.delta.sheltersDelta > 0 ? `+${simulationResult.delta.sheltersDelta} TRAPPED` : `${simulationResult.delta.sheltersDelta}`})
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Newly Exposed Assets */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="font-label-serif-caps text-[8.5px] uppercase font-bold text-[#7A7168]">
                  NEWLY EXPOSED ASSETS
                </span>
                <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] font-bold">
                  DELTA THREAT ({simulationResult.newlyExposedAssets.length})
                </span>
              </div>

              <div className="space-y-1">
                {simulationResult.newlyExposedAssets.length > 0 ? (
                  simulationResult.newlyExposedAssets.map((asset) => (
                    <div
                      key={asset.id}
                      className="p-2 bg-white border-l-2 border-[#BA1A1A] border-y border-r border-[#E4DEC9]"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-label-serif-md text-[10.5px] font-bold text-[#241917]">
                          {asset.name}
                        </span>
                        <span className="font-label-serif-caps text-[8.5px] text-[#BA1A1A] font-bold">
                          RISK {asset.riskScore} (+{asset.riskDelta})
                        </span>
                      </div>
                      <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] block mt-0.5">
                        {asset.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="p-2.5 bg-white border border-[#E4DEC9] text-[9.5px] text-[#7A7168] text-center font-label-serif-caps">
                    NO NEW COMPOUND ASSET BREACHES DETECTED AT BASELINE.
                  </div>
                )}
              </div>
            </div>

            {/* AI Impact Analysis (Interpretation of Simulation) */}
            <div className="p-2.5 bg-[#241917] text-[#EDE8E0] border border-[#3E2E2A] space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-[#FFB4A4]">auto_awesome</span>
                <span className="font-label-serif-caps text-[8.5px] font-bold text-[#FFB4A4] uppercase tracking-wider">
                  AI IMPACT ANALYSIS [GEMINI 3.7 FLASH]
                </span>
              </div>
              <p className="font-body-sm text-[10.5px] text-[#dec0b9] leading-relaxed">
                {riskDelta > 0
                  ? `Simulation with rainfall at ${rainfallMm}mm (+${rainfallMm - 220}mm delta) and ${stormSurgeM}m surge escalates sector risk to ${currentRisk}/100. Tidal backflow impoundment chokes Dhamra estuary, severing ${simulationResult.roadsExposed} road corridors and threatening primary patient transit.`
                  : 'At baseline calibration (220mm / +2.4m surge), primary risk concentrates along coastal marshland. Raising rainfall above 250mm will trigger hydraulic failure of sector culverts.'}
              </p>

              <div>
                <span className="font-label-serif-caps text-[7.5px] text-[#FFB4A4] uppercase font-bold block mb-1">
                  COMPOUND HAZARD CASCADE PATHWAY
                </span>
                <div className="space-y-0.5 text-[9.5px] text-[#EDE8E0]">
                  <p>01. Rain Surge (+{Math.max(0, rainfallMm - 220)}mm) &amp; High Tide (+{stormSurgeM}m)</p>
                  <p className="text-[#dec0b9]">&darr; 02. Estuary drainage backflow &amp; siltation choke</p>
                  <p className="text-[#FFB4A4]">&darr; 03. Arterial breach: {simulationResult.roadsExposed} roads inundated</p>
                  <p className="text-[#FFB4A4] font-bold">&darr; 04. Medical isolation: {simulationResult.medicalFacilitiesExposed} facilities cut off</p>
                </div>
              </div>

              <div className="p-1.5 bg-[#1B110F] border border-[#57423D] text-[9.5px] text-[#FFB4A4]">
                <strong>PRIORITY DIRECTIVE:</strong> Activate alternate inland evacuation bypass route R-7; deploy heavy dewatering pumps to Sector 7 culverts; issue power grid pre-emptive trip for vulnerable substations.
              </div>
            </div>
          </div>

          {/* Bottom Action Footer */}
          <div className="p-3 border-t border-[#D8D2C5] bg-[#EFECE3]">
            <button
              onClick={() => setActiveTab('advisories-and-alerts')}
              className="w-full py-2.5 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>APPLY TO OFFICIAL ADVISORY</span>
              <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
