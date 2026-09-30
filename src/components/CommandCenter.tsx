import React, { useState } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

export const CommandCenter: React.FC = () => {
  const {
    scenario,
    simulationResult,
    activeForecastStep,
    setForecastStep,
    runForecastSimulation,
    isForecasting,
    dispatchAdvisory,
    setActiveTab,
    setSelectedAssetId,
    environmentalContext,
    setShowAttributionModal,
  } = useScenario();

  const [activeLayers, setActiveLayers] = useState({
    topoRadar: true,
    surgeModel: true,
    floodInundation: true,
    infraGrid: true,
    simPulse: true,
  });

  const [forecastTriggered, setForecastTriggered] = useState(false);

  const toggleLayer = (key: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleRunForecast = async () => {
    setForecastTriggered(true);
    await runForecastSimulation();
  };

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            CYCLONE COMMAND CENTER
          </span>
          <span className="px-1.5 py-0.5 bg-[#B74A32]/20 border border-[#B74A32]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            CRISIS OPERATIONAL LEVEL-4
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            Anticipatory Impact Intelligence &amp; Infrastructure Vulnerability Matrix
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRunForecast}
            disabled={isForecasting}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#B74A32] text-white hover:bg-[#97331D] transition-colors border border-[#FFB4A4]/40 font-label-serif-caps text-[9px] uppercase tracking-wider cursor-pointer shadow-sm"
          >
            <span className={`material-symbols-outlined text-[13px] ${isForecasting ? 'animate-spin' : ''}`}>
              {isForecasting ? 'refresh' : 'sync'}
            </span>
            <span>{isForecasting ? 'COMPUTING FORECAST...' : 'RUN IMPACT FORECAST'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 border-b border-[#262320] bg-[#171514] text-left">
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">TARGET CLASSIFICATION</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#F2EFE8] block mt-0.5">
            {scenario.name}
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#C8923C] block">{scenario.classification}</span>
        </div>
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">LANDFALL COUNTDOWN</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#FFB4A4] block mt-0.5">
            {scenario.forecast_hour}H <span className="text-[10px] font-normal text-[#9E978F]">EST.</span>
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">ETA 18 OCT ~05:30 IST</span>
        </div>
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">MAX SUSTAINED WINDS</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#F2EFE8] block mt-0.5">
            {scenario.wind_kmh} KM/H
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">GUSTS TO {scenario.wind_gusts_kmh} KM/H</span>
        </div>
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">24H PRECIP PEAK</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#C8923C] block mt-0.5">
            {scenario.rainfall_mm} MM
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">BASIN OVERLOAD IMMINENT</span>
        </div>
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">STORM SURGE HEIGHT</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#BA1A1A] block mt-0.5">
            +{scenario.storm_surge_m} METERS
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">HIGH-TIDE CONCURRENT</span>
        </div>
        <div className="p-2.5">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">CENTRAL PRESSURE &amp; DRIFT</span>
          <span className="font-headline-sm text-[13px] font-bold text-[#F2EFE8] block mt-0.5">
            {scenario.central_pressure_hpa} hPa
          </span>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">{scenario.drift}</span>
        </div>
      </div>

      {/* Main Workspace (Map + Impact Analysis Panel) */}
      <div className="flex flex-1 min-h-[520px] overflow-hidden border-b border-[#262320]">
        {/* Left Map Viewport */}
        <div className="relative flex-1 bg-[#0F0E0D] flex flex-col overflow-hidden">
          {/* Layer toggles overlay */}
          <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 bg-[#171514]/95 border border-[#2F2B27] px-2.5 py-1.5 backdrop-blur">
            <span className="font-label-serif-caps text-[8.5px] text-[#8A847B] uppercase mr-1">LAYERS:</span>
            <button
              onClick={() => toggleLayer('topoRadar')}
              className={`px-2 py-0.5 font-label-serif-caps text-[8px] uppercase tracking-wider border cursor-pointer ${
                activeLayers.topoRadar ? 'bg-[#251917] text-[#FFB4A4] border-[#B74A32]' : 'bg-[#1E1C1A] text-[#8A847B] border-[#2F2B27]'
              }`}
            >
              TOPO-RADAR
            </button>
            <button
              onClick={() => toggleLayer('surgeModel')}
              className={`px-2 py-0.5 font-label-serif-caps text-[8px] uppercase tracking-wider border cursor-pointer ${
                activeLayers.surgeModel ? 'bg-[#251917] text-[#FFB4A4] border-[#B74A32]' : 'bg-[#1E1C1A] text-[#8A847B] border-[#2F2B27]'
              }`}
            >
              SURGE MODEL
            </button>
            <button
              onClick={() => toggleLayer('floodInundation')}
              className={`px-2 py-0.5 font-label-serif-caps text-[8px] uppercase tracking-wider border cursor-pointer ${
                activeLayers.floodInundation ? 'bg-[#251917] text-[#FFB4A4] border-[#B74A32]' : 'bg-[#1E1C1A] text-[#8A847B] border-[#2F2B27]'
              }`}
            >
              FLOOD INUNDATION
            </button>
            <button
              onClick={() => toggleLayer('infraGrid')}
              className={`px-2 py-0.5 font-label-serif-caps text-[8px] uppercase tracking-wider border cursor-pointer ${
                activeLayers.infraGrid ? 'bg-[#251917] text-[#FFB4A4] border-[#B74A32]' : 'bg-[#1E1C1A] text-[#8A847B] border-[#2F2B27]'
              }`}
            >
              INFRA GRID
            </button>
            <button
              onClick={() => toggleLayer('simPulse')}
              className={`px-2 py-0.5 font-label-serif-caps text-[8px] uppercase tracking-wider border cursor-pointer flex items-center gap-1 ${
                activeLayers.simPulse ? 'bg-[#251917] text-[#FFB4A4] border-[#B74A32]' : 'bg-[#1E1C1A] text-[#8A847B] border-[#2F2B27]'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#B74A32] animate-pulse"></span>
              SIM PULSE
            </button>
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-full flex-1">
            <svg
              className="w-full h-full block"
              preserveAspectRatio="xMidYMid slice"
              viewBox="0 0 1000 600"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="cmd-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#221F1C" strokeWidth="0.75" />
                  <circle cx="40" cy="0" r="0.8" fill="#3A342E" />
                </pattern>
                <linearGradient id="cmd-ocean" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#100E0D" />
                  <stop offset="50%" stopColor="#141211" />
                  <stop offset="100%" stopColor="#1A1715" />
                </linearGradient>
                <linearGradient id="cmd-cone" x1="0%" y1="100%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#BA1A1A" stopOpacity="0.38" />
                  <stop offset="60%" stopColor="#B74A32" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#B74A32" stopOpacity="0.04" />
                </linearGradient>
              </defs>

              <rect width="1000" height="600" fill="url(#cmd-ocean)" />
              <rect width="1000" height="600" fill="url(#cmd-grid)" />

              {/* Landmass and Estuaries */}
              <path
                d="M-10,0 L320,0 C340,60 310,120 330,170 C345,210 390,230 380,290 C370,340 330,370 340,430 C350,480 395,510 370,570 C340,600 310,610 300,690 L-10,690 Z"
                fill="#1C1917"
                stroke="#36312B"
                strokeWidth="1.5"
              />
              <path
                d="M330,0 C350,70 325,130 345,180 C360,220 410,240 395,300 C380,355 345,380 355,445 C368,495 412,525 385,585 C355,645 325,660 315,690"
                fill="none"
                stroke="#68745A"
                strokeWidth="2.5"
              />

              {/* Surge Polygon */}
              {activeLayers.surgeModel && (
                <path
                  className="anim-surge-polygon"
                  d="M320,200 L440,225 L455,330 L360,345 L320,290 Z"
                  fill="#BA1A1A"
                  fillOpacity="0.35"
                  stroke="#BA1A1A"
                  strokeDasharray="4,2"
                  strokeWidth="1.8"
                />
              )}

              {/* Forecast Cone */}
              {activeLayers.topoRadar && (
                <g>
                  <path d="M850,560 L380,285 L800,200 Z" fill="url(#cmd-cone)" className="anim-cone-breath" />
                  <path d="M800,200 C670,220 520,240 380,285" fill="none" stroke="#B74A32" strokeDasharray="4,4" strokeWidth="1.5" />
                  <path d="M850,560 C740,515 620,445 380,285" fill="none" stroke="#B74A32" strokeDasharray="4,4" strokeWidth="1.5" />
                </g>
              )}

              {/* Cyclone Trajectory and Eye */}
              <path
                d="M850,560 C720,490 560,390 380,285"
                fill="none"
                stroke="#BA1A1A"
                strokeDasharray="8,5"
                strokeWidth="2.5"
              />

              {/* Waypoint T-24H */}
              <circle cx="680" cy="450" r="4.5" fill="#B74A32" />
              <text x="695" y="454" fill="#DDD8CE" fontFamily="Metrophobic" fontSize="8.5">
                T-24H (195 KM/H PEAK)
              </text>

              {/* Waypoint T-12H */}
              <circle cx="520" cy="365" r="4.5" fill="#B74A32" />
              <text x="535" y="369" fill="#DDD8CE" fontFamily="Metrophobic" fontSize="8.5">
                T-12H OUTER BANDS HIT COAST
              </text>

              {/* Landfall Target Marker */}
              <g transform="translate(380, 285)">
                <circle cx="0" cy="0" r="8" fill="#BA1A1A" />
                <circle cx="0" cy="0" r="18" fill="none" stroke="#BA1A1A" strokeWidth="1.5" className="animate-ping" />
                <rect x="-80" y="-30" width="160" height="18" fill="#BA1A1A" stroke="#FFB4A4" strokeWidth="0.8" />
                <text x="0" y="-18" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8.5" fontWeight="bold" textAnchor="middle" letterSpacing="1">
                  LANDFALL TARGET // DHAMRA
                </text>
              </g>

              {/* Active Eye Pulse in Bay */}
              <g transform="translate(820, 530)">
                <circle cx="0" cy="0" r="22" fill="none" stroke="#B74A32" strokeWidth="1.2">
                  <animate attributeName="r" values="8;30;40" dur="2.8s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.9;0.3;0" dur="2.8s" repeatCount="indefinite" />
                </circle>
                <circle cx="0" cy="0" r="5" fill="#FFB4A4" />
                <text x="12" y="4" fill="#FFB4A4" fontFamily="Metrophobic" fontSize="9" fontWeight="bold">
                  EYE // CAT 4 (START)
                </text>
              </g>

              {/* Critical Infrastructure Nodes */}
              {activeLayers.infraGrid && (
                <g>
                  {/* Regional Medical Center */}
                  <g
                    transform="translate(330, 230)"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedAssetId('MED-OD-402');
                      setActiveTab('infrastructure');
                    }}
                  >
                    <rect x="-4" y="-12" width="130" height="20" fill="#1E1917" stroke="#BA1A1A" strokeWidth="1.4" />
                    <circle cx="4" cy="-2" r="3.5" fill="#BA1A1A" />
                    <text x="12" y="2" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                      REGIONAL MED CTR
                    </text>
                    <rect x="100" y="-12" width="26" height="20" fill="#BA1A1A" />
                    <text x="113" y="1" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8.5" fontWeight="bold" textAnchor="middle">
                      {scenario.rainfall_mm >= 280 ? '94' : '91'}
                    </text>
                  </g>

                  {/* Substation */}
                  <g
                    transform="translate(240, 300)"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedAssetId('PWR-CB-104');
                      setActiveTab('infrastructure');
                    }}
                  >
                    <rect x="-4" y="-12" width="115" height="18" fill="#1E1917" stroke="#C8923C" strokeWidth="1.2" />
                    <circle cx="4" cy="-3" r="3.5" fill="#C8923C" />
                    <text x="12" y="0" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                      SUBSTATION-4
                    </text>
                    <rect x="90" y="-12" width="21" height="18" fill="#C8923C" />
                    <text x="100" y="0" fill="#141312" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" textAnchor="middle">
                      {scenario.rainfall_mm >= 280 ? '86' : '74'}
                    </text>
                  </g>

                  {/* Paradip Port */}
                  <g
                    transform="translate(350, 420)"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedAssetId('LOG-PD-01');
                      setActiveTab('infrastructure');
                    }}
                  >
                    <rect x="-4" y="-12" width="110" height="18" fill="#1E1917" stroke="#C8923C" strokeWidth="1.2" />
                    <circle cx="4" cy="-3" r="3.5" fill="#C8923C" />
                    <text x="12" y="0" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                      PARADIP PORT
                    </text>
                    <rect x="86" y="-12" width="20" height="18" fill="#C8923C" />
                    <text x="96" y="0" fill="#141312" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" textAnchor="middle">
                      86
                    </text>
                  </g>

                  {/* Coastal Water Plant */}
                  <g
                    transform="translate(260, 470)"
                    className="cursor-pointer"
                    onClick={() => {
                      setSelectedAssetId('WTR-PD-02');
                      setActiveTab('infrastructure');
                    }}
                  >
                    <rect x="-4" y="-12" width="115" height="18" fill="#1E1917" stroke="#68745A" strokeWidth="1.2" />
                    <circle cx="4" cy="-3" r="3.5" fill="#68745A" />
                    <text x="12" y="0" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold">
                      COASTAL WATER PLANT
                    </text>
                    <rect x="92" y="-12" width="19" height="18" fill="#68745A" />
                    <text x="101" y="0" fill="#FFFFFF" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" textAnchor="middle">
                      62
                    </text>
                  </g>
                </g>
              )}

              {/* Major Roads */}
              <path d="M160,80 L230,220 L260,350 L230,510" fill="none" stroke="#8A716C" strokeDasharray="6,3" strokeWidth="2" />
              <text x="170" y="240" fill="#8A716C" fontFamily="Metrophobic" fontSize="8" transform="rotate(-65 170 240)">
                NH-16 INLAND TRUNK
              </text>
              <path d="M230,220 L330,250 L350,280" fill="none" stroke="#BA1A1A" strokeDasharray="3,2" strokeWidth="2.2" />
              <text x="250" y="270" fill="#FFB4A4" fontFamily="Metrophobic" fontSize="7.5">
                NH-516 [BREACH ZONE]
              </text>

              {/* Compass Rose */}
              <g transform="translate(680, 180)">
                <circle cx="0" cy="0" r="18" fill="none" stroke="#3A342E" strokeWidth="1" />
                <path d="M0,-20 L0,20 M-20,0 L20,0" stroke="#3A342E" strokeWidth="0.75" />
                <polygon points="0,-18 3,-6 0,-9 -3,-6" fill="#B74A32" />
                <text x="0" y="-22" fill="#EDE8E0" fontFamily="Metrophobic" fontSize="7.5" fontWeight="bold" textAnchor="middle">
                  N
                </text>
              </g>
            </svg>
          </div>

          {/* Map Status Bar */}
          <div className="h-8 bg-[#141211] border-t border-[#262320] px-3 flex items-center justify-between shrink-0 text-[#9E978F]">
            <div className="flex items-center gap-3">
              <span className="font-label-serif-caps text-[9px] text-[#DDD8CE]">
                RETICLE: 20.816° N, 86.822° E (SECTOR-04)
              </span>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span className="font-label-serif-caps text-[8.5px]">
                SURF ELEV: {environmentalContext?.elevation.meanM ?? 2.1}M ASL
              </span>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span className="font-label-serif-caps text-[8.5px] text-[#C8923C]">
                TIDE PHASE: SPRING (+0.7M)
              </span>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span
                className={`font-label-serif-caps text-[8px] px-1.5 py-0.5 border ${
                  environmentalContext?.mode === 'LIVE'
                    ? 'bg-[#68745A]/25 border-[#68745A] text-[#BECBAD]'
                    : 'bg-[#2A2318] border-[#685328] text-[#C8923C]'
                }`}
              >
                {environmentalContext?.mode === 'LIVE' ? 'LIVE EARTH ENGINE' : 'DEMO EARTH ENGINE'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] hidden sm:inline">
                {environmentalContext?.mode === 'LIVE'
                  ? 'LIVE METEOROLOGICAL FORECAST (ECMWF)'
                  : 'SIMULATED FORECAST (ECMWF BASELINE)'}
              </span>
              <button
                type="button"
                onClick={() => setShowAttributionModal(true)}
                className="font-label-serif-caps text-[8px] text-[#FFB4A4] hover:underline cursor-pointer flex items-center gap-1 border border-[#3E3832] px-1.5 py-0.5 bg-[#1F1C1B]"
              >
                <span>DATA SOURCES</span>
                <span className="material-symbols-outlined text-[11px]">info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Impact Analysis Panel (Tactical Light Theme Container) */}
        <aside className="w-[360px] lg:w-[400px] h-full bg-[#F7F4EE] text-[#241917] flex flex-col justify-between overflow-y-auto border-l border-[#D8D2C5]">
          <div className="p-4 space-y-3.5">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E2DCCE] pb-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-[#B74A32]"></span>
                <span className="font-label-serif-caps text-[10.5px] uppercase font-bold tracking-wider text-[#241917]">
                  IMPACT ANALYSIS
                </span>
              </div>
              <span className="px-1.5 py-0.5 bg-[#EAE4D7] border border-[#D5CEBF] font-label-serif-caps text-[8px] text-[#7A7168] uppercase">
                GEMINI 3.7 FLASH DECISION INTEL
              </span>
            </div>

            {/* Complex Hazard Synthesis */}
            <div className="p-2.5 bg-white border border-[#E4DEC9] shadow-sm">
              <div className="flex items-center gap-1 text-[#BA1A1A] mb-1">
                <span className="material-symbols-outlined text-[13px]">bolt</span>
                <span className="font-label-serif-caps text-[8.5px] uppercase font-bold tracking-wider">
                  COMPLEX HAZARD SYNTHESIS — SECTOR 04B
                </span>
              </div>
              <p className="font-body-sm text-[11px] text-[#4A3E3B] leading-relaxed">
                High-impact conditions are developing along the projected coastal corridor. Low elevation, forecast
                rainfall ({scenario.rainfall_mm}mm) and {scenario.storm_surge_m}m storm-surge exposure are exponentially
                compounding infrastructure vulnerability along the Dhamra–Paradip coastal belt.
              </p>
            </div>

            {/* Critical Node 01 Dossier Card */}
            <div className="p-3 bg-white border-l-3 border-[#BA1A1A] border-y border-r border-[#E4DEC9] shadow-sm space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="font-label-serif-caps text-[8px] text-[#8A716C] uppercase block">
                    FACILITY ID: MED-OD-402 • URGENT PRIORITY
                  </span>
                  <span className="font-headline-sm text-[12.5px] font-bold text-[#241917] uppercase block mt-0.5">
                    REGIONAL MEDICAL CENTER &amp; TRAUMA COMPLEX
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="px-1.5 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[9.5px] font-bold">
                    {scenario.rainfall_mm >= 280 ? '94' : '91'}
                  </span>
                  <span className="font-label-serif-caps text-[7px] text-[#8A716C] mt-0.5">RISK INDEX</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-1.5 py-1 text-[10px] text-[#5A4E4A] border-y border-[#F0ECE1]">
                <div>ELEVATION: <strong className="text-[#241917]">2.1m ASL</strong></div>
                <div>DIST TO INUND: <strong className="text-[#BA1A1A]">340 METERS</strong></div>
                <div>BED COUNT: <strong className="text-[#241917]">450 (ICU: 38)</strong></div>
                <div>O2 RESERVE: <strong className="text-[#BA1A1A]">72H (ISOLATED RISK)</strong></div>
              </div>

              {/* Pathway Steps */}
              <div>
                <span className="font-label-serif-caps text-[8px] text-[#8A716C] uppercase block mb-1">
                  COMPOUND HAZARD CASCADE PATHWAY:
                </span>
                <div className="space-y-1 text-[10px]">
                  <div className="flex items-start gap-1.5">
                    <span className="px-1 py-0.2 bg-[#F2EDE2] font-label-serif-caps text-[7.5px] font-bold text-[#7A7168]">1</span>
                    <span className="text-[#3A2E2B]">Heavy rainfall ({scenario.rainfall_mm}mm accumulation coastal basin)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="px-1 py-0.2 bg-[#F2EDE2] font-label-serif-caps text-[7.5px] font-bold text-[#7A7168]">2</span>
                    <span className="text-[#3A2E2B]">Estuary backflow drainage choking at high tide (+{scenario.storm_surge_m}m surge)</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="px-1 py-0.2 bg-[#BA1A1A] font-label-serif-caps text-[7.5px] font-bold text-white">3</span>
                    <span className="text-[#BA1A1A] font-medium">Arterial road disruption: NH-516 submerged between MP 12-19</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="px-1 py-0.2 bg-[#BA1A1A] font-label-serif-caps text-[7.5px] font-bold text-white">4</span>
                    <span className="text-[#BA1A1A] font-medium">Complete medical access loss &amp; critical patient transport paralysis</span>
                  </div>
                </div>
              </div>

              {/* Priority Directive */}
              <div className="p-2 bg-[#F7F4EE] border border-[#E2DCCE]">
                <span className="font-label-serif-caps text-[7.5px] text-[#B74A32] uppercase font-bold block mb-0.5">
                  PRIORITY OPERATIONAL DIRECTIVE:
                </span>
                <p className="font-body-sm text-[10px] text-[#4A3E3B] leading-tight">
                  Prepare alternate medical access routes via inland bypass R-4; pre-position NDRF amphibious response teams and deploy mobile high-capacity dewatering pumps at sector 7 culvert.
                </p>
              </div>
            </div>

            {/* Concurrent vulnerabilities */}
            <div>
              <span className="font-label-serif-caps text-[8px] text-[#7A7168] uppercase font-bold block mb-1">
                CONCURRENT ASSET VULNERABILITIES (SECTOR 04B)
              </span>
              <div className="space-y-1">
                <div
                  className="p-1.5 bg-white border border-[#E4DEC9] flex items-center justify-between cursor-pointer hover:border-[#B74A32]"
                  onClick={() => {
                    setSelectedAssetId('PWR-CB-104');
                    setActiveTab('infrastructure');
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#C8923C]">electric_bolt</span>
                    <div>
                      <span className="font-label-serif-md text-[10.5px] text-[#241917] block leading-none font-bold">
                        Power Grid Substation 4 (220kV)
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">
                        18,400 households at imminent blackout risk
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-[#C8923C] text-white font-label-serif-caps text-[8px] font-bold">
                    {scenario.rainfall_mm >= 280 ? '86 RISK' : '74 RISK'}
                  </span>
                </div>

                <div
                  className="p-1.5 bg-white border border-[#E4DEC9] flex items-center justify-between cursor-pointer hover:border-[#B74A32]"
                  onClick={() => {
                    setSelectedAssetId('WTR-PD-02');
                    setActiveTab('infrastructure');
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-[#68745A]">water_drop</span>
                    <div>
                      <span className="font-label-serif-md text-[10.5px] text-[#241917] block leading-none font-bold">
                        Coastal Drinking Water Plant
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">
                        Saltwater intrusion barrier deployment required
                      </span>
                    </div>
                  </div>
                  <span className="px-1.5 py-0.5 bg-[#68745A] text-white font-label-serif-caps text-[8px] font-bold">
                    62 RISK
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="p-3 border-t border-[#D8D2C5] bg-[#EFECE3] flex items-center gap-2">
            <button
              onClick={() => dispatchAdvisory()}
              className="flex-1 py-2.5 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[10.5px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">send</span>
              <span>DISPATCH ORDER</span>
            </button>
            <button
              onClick={() => setActiveTab('advisories-and-alerts')}
              className="px-3 py-2.5 bg-white hover:bg-[#F2EDE2] border border-[#D5CEBF] text-[#241917] font-label-serif-caps text-[10px] font-bold tracking-wider uppercase transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">file_open</span>
              <span>VIEW ADVISORY</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Bottom KPI Rollup */}
      <div className="grid grid-cols-2 md:grid-cols-5 border-b border-[#262320] bg-[#171514] text-left">
        <div className="p-3 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">COMPOSITE SECTOR RISK</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-md text-[20px] font-bold text-[#BA1A1A] leading-none">
              {scenario.risk_score}
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#8A847B]">/ 100</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] block mt-0.5">
            {scenario.risk_level} RISK (FORECAST CALIBRATED)
          </span>
        </div>

        <div className="p-3 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">FLOOD &amp; SURGE EXPOSURE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-md text-[20px] font-bold text-[#FFB4A4] leading-none">
              {scenario.flood_exposure}%
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#8A847B]">SECTOR COV</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block mt-0.5">
            {scenario.inundation_area_km2} KM² INUNDATION AREA
          </span>
        </div>

        <div className="p-3 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">CRITICAL ASSETS ENDANGERED</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-md text-[20px] font-bold text-[#F2EFE8] leading-none">
              {scenario.critical_assets_endangered}
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#8A847B]">FACILITIES</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block mt-0.5">
            3 HEALTH | 7 GRID | 5 TRANSIT | 4 WATER
          </span>
        </div>

        <div className="p-3 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">POPULATION IN DIRECT CONE</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-md text-[20px] font-bold text-[#F2EFE8] leading-none">
              {scenario.population_in_cone}
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#8A847B]">RESIDENTS</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block mt-0.5">
            {scenario.evac_target} EVAC TARGET | 48.2% SHELTERED
          </span>
        </div>

        <div className="p-3">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">ESTIMATED LANDFALL WINDOW</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-md text-[20px] font-bold text-[#BA1A1A] leading-none">
              {scenario.forecast_hour}H
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#8A847B]">T-MINUS</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block mt-0.5">
            18 OCT, 04:00 - 07:00 IST
          </span>
        </div>
      </div>

      {/* Operational Readiness Horizon Timeline Strip */}
      <div className="p-3 bg-[#131110] border-b border-[#262320] flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] uppercase mr-2">HORIZON:</span>
          <button
            onClick={() => setForecastStep(0)}
            className={`px-2 py-1 text-left cursor-pointer transition-colors border ${
              activeForecastStep === 0
                ? 'bg-[#231A18] border-[#B74A32] text-[#FFB4A4]'
                : 'bg-[#191716] border-[#2D2825] text-[#9E978F] hover:border-[#8A847B]'
            }`}
          >
            <span className="font-label-serif-caps text-[7.5px] block font-bold">01 T-36H NOW</span>
            <span className="font-body-sm text-[9.5px] block leading-none">MONITOR &amp; EVAC ALERT</span>
          </button>

          <button
            onClick={() => setForecastStep(1)}
            className={`px-2 py-1 text-left cursor-pointer transition-colors border ${
              activeForecastStep === 1
                ? 'bg-[#231A18] border-[#B74A32] text-[#FFB4A4]'
                : 'bg-[#191716] border-[#2D2825] text-[#9E978F] hover:border-[#8A847B]'
            }`}
          >
            <span className="font-label-serif-caps text-[7.5px] block font-bold">02 T-24H</span>
            <span className="font-body-sm text-[9.5px] block leading-none">PRE-POSITION ASSETS</span>
          </button>

          <button
            onClick={() => setForecastStep(2)}
            className={`px-2 py-1 text-left cursor-pointer transition-colors border ${
              activeForecastStep === 2
                ? 'bg-[#231A18] border-[#B74A32] text-[#FFB4A4]'
                : 'bg-[#191716] border-[#2D2825] text-[#9E978F] hover:border-[#8A847B]'
            }`}
          >
            <span className="font-label-serif-caps text-[7.5px] block font-bold">03 T-12H</span>
            <span className="font-body-sm text-[9.5px] block leading-none">RESTRICT ALL TRANSIT</span>
          </button>

          <button
            onClick={() => setForecastStep(3)}
            className={`px-2 py-1 text-left cursor-pointer transition-colors border ${
              activeForecastStep === 3
                ? 'bg-[#231A18] border-[#BA1A1A] text-[#FFB4A4]'
                : 'bg-[#191716] border-[#2D2825] text-[#9E978F] hover:border-[#8A847B]'
            }`}
          >
            <span className="font-label-serif-caps text-[7.5px] text-[#BA1A1A] block font-bold">04 LANDFALL</span>
            <span className="font-body-sm text-[9.5px] block leading-none">ACTIVE RESCUE STANDBY</span>
          </button>

          <button
            onClick={() => setForecastStep(4)}
            className={`px-2 py-1 text-left cursor-pointer transition-colors border ${
              activeForecastStep === 4
                ? 'bg-[#231A18] border-[#B74A32] text-[#FFB4A4]'
                : 'bg-[#191716] border-[#2D2825] text-[#9E978F] hover:border-[#8A847B]'
            }`}
          >
            <span className="font-label-serif-caps text-[7.5px] block font-bold">05 T+6H</span>
            <span className="font-body-sm text-[9.5px] block leading-none">ASSESS &amp; RESTORE</span>
          </button>
        </div>
        <div className="text-right">
          <span className="font-label-serif-caps text-[8.5px] text-[#B74A32] uppercase font-bold">
            CURRENT PHASE: PHASE 1 (EVACUATION ORDERS ISSUED)
          </span>
        </div>
      </div>
    </div>
  );
};
