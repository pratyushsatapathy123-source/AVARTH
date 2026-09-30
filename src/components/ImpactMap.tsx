import React, { useState, useEffect, useRef } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';
import type { ForecastTimelineItem } from '../../server/models/types.ts';

export const ImpactMap: React.FC = () => {
  const {
    scenario,
    simulationResult,
    forecastStates,
    activeForecastStep,
    setForecastStep,
    selectedZone,
    setSelectedZoneId,
    selectedAsset,
    setSelectedAssetId,
    dispatchAdvisory,
    setActiveTab,
    environmentalContext,
    setShowAttributionModal,
  } = useScenario();

  // Timeline playback state
  const [currentStep, setCurrentStep] = useState<number>(activeForecastStep || 0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [deltaActive, setDeltaActive] = useState<boolean>(false);
  const [modelStatusText, setModelStatusText] = useState<string>('SIM PULSE ACTIVE');
  const [activeTabInspection, setActiveTabInspection] = useState<'zone' | 'asset'>('zone');
  const [dispatchedBtnText, setDispatchedBtnText] = useState<string>('DISPATCH SECTOR DIRECTIVE');
  const [isHazardMenuOpen, setIsHazardMenuOpen] = useState<boolean>(false);
  const hazardMenuRef = useRef<HTMLDivElement>(null);

  // Sync internal step with context active forecast step
  useEffect(() => {
    setCurrentStep(activeForecastStep);
  }, [activeForecastStep]);

  // Layer Visibility
  const [layers, setLayers] = useState({
    track: true,
    cone: true,
    rain: true,
    surge: true,
    zones: true,
  });

  const [timelineItems, setTimelineItems] = useState<ForecastTimelineItem[]>([]);
  const playIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchTimeline();
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, []);

  // Close hazard menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (hazardMenuRef.current && !hazardMenuRef.current.contains(event.target as Node)) {
        setIsHazardMenuOpen(false);
      }
    };
    if (isHazardMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isHazardMenuOpen]);

  const fetchTimeline = async () => {
    try {
      const res = await fetch('/api/forecast/timeline');
      if (res.ok) {
        const data = await res.json();
        setTimelineItems(data.timeline || []);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    }
  };

  const currentTimelineData = timelineItems[currentStep] || {
    step: 0,
    label: 'T-36H NOW',
    coords: { x: 820, y: 540 },
    wind: `${scenario.wind_kmh} KM/H`,
    pressure: `${scenario.central_pressure_hpa} HPA`,
    risk_score_str: `${scenario.risk_score} ${scenario.risk_level}`,
    precip: `${scenario.rainfall_mm} MM`,
    surge: `+${scenario.storm_surge_m} M`,
  };

  const handleStepChange = (stepIdx: number) => {
    setCurrentStep(stepIdx);
    setForecastStep(stepIdx);
    setModelStatusText('UPDATING HAZARD FIELD...');
    setTimeout(() => {
      setModelStatusText('SIM PULSE ACTIVE');
    }, 500);
  };

  const togglePlay = () => {
    if (isPlaying) {
      setIsPlaying(false);
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    } else {
      setIsPlaying(true);
      playIntervalRef.current = setInterval(() => {
        setCurrentStep(prev => (prev + 1) % (timelineItems.length || 5));
      }, 2600);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    handleStepChange(0);
  };

  const handleDispatch = () => {
    dispatchAdvisory();
    setDispatchedBtnText('DIRECTIVE BROADCASTED ✓');
    setTimeout(() => {
      setDispatchedBtnText('DISPATCH SECTOR DIRECTIVE');
    }, 2800);
  };

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-hidden bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header Bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            IMPACT MAP
          </span>
          <span className="px-1.5 py-0.5 bg-[#B74A32]/20 border border-[#B74A32]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            CRISIS OPERATIONAL LEVEL-4
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            GEOSPATIAL HAZARD, EXPOSURE &amp; VULNERABILITY MATRIX
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-serif-caps text-[8.5px] text-[#8A847B] uppercase mr-1 hidden sm:inline">
            ACTIVE FEEDS:
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#121110] border border-[#2D2A26] font-label-serif-caps text-[8.5px] text-[#BECBAD]">
            <span className="w-1 h-1 bg-[#68745A]"></span>EARTH ENGINE
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#121110] border border-[#2D2A26] font-label-serif-caps text-[8.5px] text-[#BECBAD]">
            <span className="w-1 h-1 bg-[#68745A]"></span>MET FORECAST
          </span>
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-[#121110] border border-[#2D2A26] font-label-serif-caps text-[8.5px] text-[#BECBAD]">
            <span className="w-1 h-1 bg-[#68745A]"></span>GIS INFRA DB
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex flex-1 h-[calc(100%-2.5rem)] overflow-hidden">
        {/* Left Map Canvas (72%) */}
        <div className="relative w-[72%] h-full bg-[#0F0E0D] flex flex-col overflow-hidden border-r border-[#262320]">
          {/* Top Floating Controls */}
          <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none">
            {/* Playback Controls & Timeline buttons */}
            <div className="pointer-events-auto flex items-center gap-2 bg-[#171514]/95 backdrop-blur border border-[#2F2B27] px-2.5 py-1.5 shadow-xl">
              <div className="flex items-center gap-1 border-r border-[#2F2B27] pr-2">
                <button
                  onClick={togglePlay}
                  className="flex items-center gap-1 px-2 py-1 bg-[#B74A32] text-white hover:bg-[#97331D] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">
                    {isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                  <span className="font-label-serif-caps text-[9px] uppercase tracking-wider">
                    {isPlaying ? 'PAUSE SIM' : 'PLAY FORECAST'}
                  </span>
                </button>
                <button
                  onClick={handleReset}
                  title="Reset Timeline"
                  className="p-1 text-[#9E978F] hover:text-[#EDE8E0] hover:bg-[#23201D] transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">restart_alt</span>
                </button>
              </div>

              <div className="flex items-center gap-1">
                <span className="px-1.5 py-0.5 bg-[#251917] border border-[#B74A32]/40 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B74A32] animate-pulse"></span>
                  <span>{modelStatusText}</span>
                </span>
                <div className="flex items-center gap-1">
                  {['T-36H NOW', 'T-24H', 'T-12H', 'LANDFALL (T-0)', 'T+6H'].map((label, idx) => {
                    const isActive = currentStep === idx;
                    return (
                      <button
                        key={label}
                        onClick={() => {
                          if (isPlaying) togglePlay();
                          handleStepChange(idx);
                        }}
                        className={`px-2 py-0.5 font-label-serif-caps text-[8.5px] uppercase tracking-wider cursor-pointer ${
                          isActive
                            ? 'bg-[#B74A32] text-white font-bold'
                            : idx === 3
                            ? 'bg-[#1E1C1A] text-[#BA1A1A] border border-[#BA1A1A]/40 font-bold'
                            : 'bg-[#1E1C1A] text-[#9E978F] hover:text-[#DDD8CE]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="h-4 w-px bg-[#2F2B27]"></div>
              <button
                onClick={() => setDeltaActive(!deltaActive)}
                className={`flex items-center gap-1 px-2 py-0.5 border transition-colors cursor-pointer ${
                  deltaActive
                    ? 'bg-[#B74A32] text-white border-[#FFB4A4]'
                    : 'bg-[#1E1C1A] text-[#DDD8CE] border-[#3E3832] hover:border-[#B74A32]'
                }`}
              >
                <span className="material-symbols-outlined text-[13px] text-[#B74A32]">compare_arrows</span>
                <span className="font-label-serif-caps text-[8.5px] uppercase tracking-wider">
                  SHOW IMPACT DELTA
                </span>
              </button>
            </div>

            {/* Right Telemetry Pill */}
            <div className="pointer-events-auto flex items-center gap-2 bg-[#171514]/95 backdrop-blur border border-[#2F2B27] px-2.5 py-1.5 shadow-xl">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#B74A32] text-[15px]">air</span>
                <span className="font-label-serif-caps text-[8.5px] text-[#9E978F] uppercase">SUSTAINED WIND:</span>
                <span className="font-label-serif-md text-[11px] font-bold text-[#FFB4A4]">
                  {currentTimelineData.wind}
                </span>
              </div>
              <div className="h-3 w-px bg-[#2F2B27]"></div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#C8923C] text-[15px]">speed</span>
                <span className="font-label-serif-caps text-[8.5px] text-[#9E978F] uppercase">CENTRAL PRESSURE:</span>
                <span className="font-label-serif-md text-[11px] font-bold text-[#F2EFE8]">
                  {currentTimelineData.pressure}
                </span>
              </div>
            </div>
          </div>

          {/* Impact Delta Floating Badge */}
          {deltaActive && (
            <div className="absolute top-16 right-3 z-30 bg-[#1A1615]/95 backdrop-blur border border-[#B74A32] p-2.5 shadow-2xl space-y-1.5 pointer-events-auto">
              <div className="flex items-center justify-between gap-3">
                <span className="font-label-serif-caps text-[9px] text-[#FFB4A4] font-bold uppercase tracking-wider flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-[#BA1A1A]"></span>EXPOSURE DELTA (SINCE T-36H)
                </span>
                <span className="font-label-serif-caps text-[8px] text-[#BECBAD] uppercase">NET EXPANDING</span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="px-2 py-1 bg-[#231C1A] border border-[#3E2D28]">
                  <span className="font-headline-sm text-[12px] font-bold text-[#FFB4A4] block leading-none">
                    {simulationResult.delta.roadsDelta >= 0 ? `+${simulationResult.delta.roadsDelta}` : simulationResult.delta.roadsDelta}
                  </span>
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] uppercase">ROAD LINKS</span>
                </div>
                <div className="px-2 py-1 bg-[#231C1A] border border-[#3E2D28]">
                  <span className="font-headline-sm text-[12px] font-bold text-[#BA1A1A] block leading-none">
                    {simulationResult.delta.medicalDelta >= 0 ? `+${simulationResult.delta.medicalDelta}` : simulationResult.delta.medicalDelta}
                  </span>
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] uppercase">HOSPITAL</span>
                </div>
                <div className="px-2 py-1 bg-[#231C1A] border border-[#3E2D28]">
                  <span className="font-headline-sm text-[12px] font-bold text-[#C8923C] block leading-none">
                    {simulationResult.delta.powerDelta >= 0 ? `+${simulationResult.delta.powerDelta}` : simulationResult.delta.powerDelta}
                  </span>
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] uppercase">PWR GRIDS</span>
                </div>
              </div>
            </div>
          )}

          {/* Hazard Layers Menu (Left Panel Overlay) */}
          <div ref={hazardMenuRef} className="absolute top-16 left-3 z-30">
            {/* Menu Trigger Button */}
            <button
              type="button"
              onClick={() => setIsHazardMenuOpen(prev => !prev)}
              aria-expanded={isHazardMenuOpen}
              aria-label="Toggle Hazard Layers Menu"
              className={`flex items-center gap-2 px-2.5 py-1.5 backdrop-blur transition-all cursor-pointer shadow-xl border ${
                isHazardMenuOpen
                  ? 'bg-[#1C1918] border-[#B74A32] text-[#F7F4EE]'
                  : 'bg-[#161413]/95 hover:bg-[#1E1B19] border-[#2F2B27] hover:border-[#B74A32]/70 text-[#DDD8CE]'
              }`}
            >
              <span className="material-symbols-outlined text-[14px] text-[#B74A32]">layers</span>
              <span className="font-label-serif-caps text-[9px] font-bold tracking-wider uppercase">
                HAZARD LAYERS
              </span>
              <span className="font-label-serif-caps text-[7.5px] text-[#BECBAD] bg-[#121110] px-1 py-0.5 border border-[#2D2A26]">
                SYNC {activeLayerCount}/5
              </span>
              <span
                className={`material-symbols-outlined text-[14px] text-[#9E978F] transition-transform duration-200 ${
                  isHazardMenuOpen ? 'rotate-180 text-[#FFB4A4]' : ''
                }`}
              >
                expand_more
              </span>
            </button>

            {/* Menu Dropdown - Opens only when Hazard Layer is clicked */}
            {isHazardMenuOpen && (
              <div className="mt-1 w-60 bg-[#161413]/98 backdrop-blur border border-[#B74A32]/60 p-2.5 shadow-2xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-[#282421] pb-1.5">
                  <span className="font-label-serif-caps text-[8.5px] text-[#9E978F] tracking-wider uppercase font-bold flex items-center gap-1">
                    ACTIVE OVERLAYS
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setLayers({ track: true, cone: true, rain: true, surge: true, zones: true })}
                      className="text-[7.5px] font-label-serif-caps text-[#C8923C] hover:underline uppercase cursor-pointer"
                    >
                      ALL
                    </button>
                    <span className="text-[#3E3832] text-[9px]">|</span>
                    <button
                      type="button"
                      onClick={() => setLayers({ track: false, cone: false, rain: false, surge: false, zones: false })}
                      className="text-[7.5px] font-label-serif-caps text-[#8A847B] hover:text-[#EDE8E0] uppercase cursor-pointer"
                    >
                      NONE
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="flex items-center justify-between py-0.5 cursor-pointer text-[#EDE8E0] hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layers.track}
                        onChange={e => setLayers({ ...layers, track: e.target.checked })}
                        className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="font-label-serif-md text-[10.5px]">Cyclone Track &amp; Eye</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#BA1A1A]"></span>
                  </label>

                  <label className="flex items-center justify-between py-0.5 cursor-pointer text-[#EDE8E0] hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layers.cone}
                        onChange={e => setLayers({ ...layers, cone: e.target.checked })}
                        className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="font-label-serif-md text-[10.5px]">Forecast Cone (90%)</span>
                    </div>
                    <span className="w-2 h-1 bg-[#B74A32]/60 border border-[#B74A32]"></span>
                  </label>

                  <label className="flex items-center justify-between py-0.5 cursor-pointer text-[#EDE8E0] hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layers.rain}
                        onChange={e => setLayers({ ...layers, rain: e.target.checked })}
                        className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="font-label-serif-md text-[10.5px]">Rainfall Isohyets</span>
                    </div>
                    <span className="w-2 h-1 bg-[#C8923C]"></span>
                  </label>

                  <label className="flex items-center justify-between py-0.5 cursor-pointer text-[#EDE8E0] hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layers.surge}
                        onChange={e => setLayers({ ...layers, surge: e.target.checked })}
                        className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="font-label-serif-md text-[10.5px]">Storm Surge Inundation</span>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-[#B74A32]"></span>
                  </label>

                  <label className="flex items-center justify-between py-0.5 cursor-pointer text-[#EDE8E0] hover:text-white">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="checkbox"
                        checked={layers.zones}
                        onChange={e => setLayers({ ...layers, zones: e.target.checked })}
                        className="w-3 h-3 text-[#B74A32] bg-[#23201D] border-[#3E3832] rounded focus:ring-0 cursor-pointer"
                      />
                      <span className="font-label-serif-md text-[10.5px]">Risk Sector Zones</span>
                    </div>
                    <span className="w-2 h-2 border border-[#FFB4A4]"></span>
                  </label>
                </div>

                <div className="border-t border-[#282421] pt-1.5">
                  <span className="font-label-serif-caps text-[8.5px] text-[#8A847B] uppercase tracking-wider block mb-1">
                    CRITICAL INFRASTRUCTURE
                  </span>
                  <div className="grid grid-cols-2 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId('MED-OD-402');
                        setActiveTabInspection('asset');
                        setIsHazardMenuOpen(false);
                      }}
                      className="px-1.5 py-1 bg-[#1F1D1B] border border-[#332E2A] text-left flex items-center justify-between hover:border-[#B74A32] cursor-pointer"
                    >
                      <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">MED-CENTERS</span>
                      <span className="w-1.5 h-1.5 bg-[#BA1A1A]"></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId('PWR-CB-104');
                        setActiveTabInspection('asset');
                        setIsHazardMenuOpen(false);
                      }}
                      className="px-1.5 py-1 bg-[#1F1D1B] border border-[#332E2A] text-left flex items-center justify-between hover:border-[#B74A32] cursor-pointer"
                    >
                      <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">220kV GRID</span>
                      <span className="w-1.5 h-1.5 bg-[#C8923C]"></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId('SHL-KR-07');
                        setActiveTabInspection('asset');
                        setIsHazardMenuOpen(false);
                      }}
                      className="px-1.5 py-1 bg-[#1F1D1B] border border-[#332E2A] text-left flex items-center justify-between hover:border-[#B74A32] cursor-pointer"
                    >
                      <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">SHELTERS</span>
                      <span className="w-1.5 h-1.5 bg-[#68745A]"></span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssetId('WTR-PD-02');
                        setActiveTabInspection('asset');
                        setIsHazardMenuOpen(false);
                      }}
                      className="px-1.5 py-1 bg-[#1F1D1B] border border-[#332E2A] text-left flex items-center justify-between hover:border-[#B74A32] cursor-pointer"
                    >
                      <span className="font-label-serif-caps text-[8px] text-[#DDD8CE]">PORTS &amp; WATER</span>
                      <span className="w-1.5 h-1.5 bg-[#9E978F]"></span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SVG Map Canvas */}
          <div className="relative w-full h-full flex-1">
            <svg
              className="w-full h-full block"
              id="gisSvgMap"
              preserveAspectRatio="xMidYMid slice"
              viewBox="0 0 1000 680"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern height="40" id="gis-grid" patternUnits="userSpaceOnUse" width="40">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#221F1C" strokeWidth="0.75" />
                  <circle cx="40" cy="0" fill="#3A342E" r="0.8" />
                </pattern>
                <linearGradient id="ocean-grad" x1="0%" x2="100%" y1="0%" y2="100%">
                  <stop offset="0%" stopColor="#100E0D" />
                  <stop offset="50%" stopColor="#141211" />
                  <stop offset="100%" stopColor="#1A1715" />
                </linearGradient>
                <linearGradient id="cone-grad" x1="0%" x2="100%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#BA1A1A" stopOpacity="0.38" />
                  <stop offset="60%" stopColor="#B74A32" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#B74A32" stopOpacity="0.04" />
                </linearGradient>
                <radialGradient cx="50%" cy="50%" id="surge-pulse" r="50%">
                  <stop offset="0%" stopColor="#BA1A1A" stopOpacity="0.55" />
                  <stop offset="50%" stopColor="#B74A32" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#B74A32" stopOpacity="0" />
                </radialGradient>
              </defs>

              <rect fill="url(#ocean-grad)" height="680" width="1000" />
              <rect fill="url(#gis-grid)" height="680" width="1000" />

              {/* Coastal Landmass and Topography */}
              <path
                d="M-10,0 L320,0 C340,60 310,120 330,170 C345,210 390,230 380,290 C370,340 330,370 340,430 C350,480 395,510 370,570 C340,630 310,650 300,690 L-10,690 Z"
                fill="#1C1917"
                stroke="#36312B"
                strokeWidth="1.5"
              />
              <path
                d="M120,-10 C180,80 160,180 200,260 C240,340 210,420 230,520 C240,580 210,640 200,690"
                fill="none"
                stroke="#2B2622"
                strokeDasharray="3,3"
                strokeWidth="1"
              />
              <text fill="#5A524A" fontFamily="Metrophobic" fontSize="9" letterSpacing="1.5" x="80" y="80">
                INLAND BASIN // ELEV +12M
              </text>
              <path
                d="M330,0 C350,70 325,130 345,180 C360,220 410,240 395,300 C380,355 345,380 355,445 C368,495 412,525 385,585 C355,645 325,660 315,690"
                fill="none"
                stroke="#68745A"
                strokeLinecap="round"
                strokeWidth="2.5"
              />

              {/* Bathymetry Contours */}
              <path
                d="M380,120 C420,180 430,260 480,330 C510,380 500,470 540,560"
                fill="none"
                stroke="#2D2824"
                strokeDasharray="6,4"
                strokeWidth="1"
              />
              <text fill="#4A433D" fontFamily="Metrophobic" fontSize="9" x="460" y="320">
                BATHYMETRY -20M
              </text>

              <path
                d="M460,80 C520,160 550,260 610,360 C640,420 630,510 680,620"
                fill="none"
                stroke="#26221E"
                strokeDasharray="8,6"
                strokeWidth="0.75"
              />
              <text fill="#3D3732" fontFamily="Metrophobic" fontSize="9" x="590" y="330">
                BATHYMETRY -60M
              </text>

              {/* River Mouths */}
              <path
                d="M395,240 C360,250 330,245 290,250 L270,265 C320,270 355,260 385,280 Z"
                fill="#24201D"
                stroke="#4A4138"
                strokeWidth="1"
              />
              <text fill="#9E978F" fontFamily="Metrophobic" fontSize="9" letterSpacing="1" x="240" y="240">
                DHAMRA RIVER
              </text>

              <path
                d="M340,430 C300,435 260,430 220,445 L215,455 C265,450 310,455 350,450 Z"
                fill="#24201D"
                stroke="#4A4138"
                strokeWidth="1"
              />
              <text fill="#9E978F" fontFamily="Metrophobic" fontSize="9" letterSpacing="1" x="180" y="435">
                MAHANADI ESTUARY
              </text>

              {/* LAYER: STORM SURGE INUNDATION */}
              {layers.surge && (
                <g className="map-layer">
                  <path
                    className="anim-surge-polygon"
                    d="M320,200 L440,225 L455,330 L360,345 L320,290 Z"
                    fill="url(#surge-pulse)"
                    stroke="#BA1A1A"
                    strokeDasharray="4,2"
                    strokeWidth="1.8"
                  />
                </g>
              )}

              {/* LAYER: RISK SECTOR ZONES (INTERACTIVE) */}
              {layers.zones && (
                <g className="map-layer">
                  {/* Zone B */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedZoneId('Zone B');
                      setActiveTabInspection('zone');
                    }}
                  >
                    <rect
                      className="group-hover:stroke-[#FFB4A4] transition-colors"
                      fill="#1E1917"
                      height="18"
                      stroke="#BA1A1A"
                      strokeWidth="1"
                      width="130"
                      x="330"
                      y="270"
                    />
                    <text
                      className="group-hover:fill-white transition-colors"
                      fill="#FFB4A4"
                      fontFamily="Metrophobic"
                      fontSize="9"
                      fontWeight="bold"
                      letterSpacing="1"
                      x="336"
                      y="282"
                    >
                      ZONE B — DHAMRA ESTUARY
                    </text>
                  </g>

                  {/* Zone C */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedZoneId('Zone C');
                      setActiveTabInspection('zone');
                    }}
                  >
                    <path
                      className="group-hover:fill-opacity-25 transition-all"
                      d="M315,355 L420,365 L410,480 L330,470 Z"
                      fill="#C8923C"
                      fillOpacity="0.12"
                      stroke="#C8923C"
                      strokeDasharray="3,3"
                      strokeWidth="1.2"
                    />
                    <text fill="#C8923C" fontFamily="Metrophobic" fontSize="8.5" letterSpacing="1" x="325" y="420">
                      ZONE C — KENDRAPARA S
                    </text>
                  </g>

                  {/* Zone A */}
                  <g
                    className="cursor-pointer group"
                    onClick={() => {
                      setSelectedZoneId('Zone A');
                      setActiveTabInspection('zone');
                    }}
                  >
                    <path
                      className="group-hover:fill-opacity-25 transition-all"
                      d="M300,90 L410,120 L380,210 L300,190 Z"
                      fill="#68745A"
                      fillOpacity="0.12"
                      stroke="#68745A"
                      strokeDasharray="3,3"
                      strokeWidth="1.2"
                    />
                    <text fill="#BECBAD" fontFamily="Metrophobic" fontSize="8.5" letterSpacing="1" x="310" y="150">
                      ZONE A — BALASORE N
                    </text>
                  </g>
                </g>
              )}

              {/* LAYER: RAINFALL ISOHYETS */}
              {layers.rain && (
                <g className="map-layer">
                  <ellipse
                    className="anim-isohyet"
                    cx="380"
                    cy="280"
                    fill="none"
                    rx="140"
                    ry="90"
                    stroke="#C8923C"
                    strokeDasharray="5,4"
                    strokeOpacity="0.5"
                    strokeWidth="1.2"
                  />
                  <text fill="#C8923C" fontFamily="Metrophobic" fontSize="8" x="470" y="220">
                    ISOHYET: {scenario.rainfall_mm} MM PEAK
                  </text>
                  <ellipse
                    className="anim-isohyet"
                    cx="375"
                    cy="275"
                    fill="none"
                    rx="210"
                    ry="135"
                    stroke="#C8923C"
                    strokeDasharray="4,6"
                    strokeOpacity="0.25"
                    strokeWidth="1"
                  />
                </g>
              )}

              {/* LAYER: FORECAST CONE */}
              {layers.cone && (
                <g className="map-layer">
                  <path className="anim-cone-breath" d="M850,560 L380,285 L800,200 Z" fill="url(#cone-grad)" />
                  <path
                    d="M800,200 C670,220 520,240 380,285"
                    fill="none"
                    stroke="#B74A32"
                    strokeDasharray="4,4"
                    strokeOpacity="0.7"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M850,560 C740,515 620,445 380,285"
                    fill="none"
                    stroke="#B74A32"
                    strokeDasharray="4,4"
                    strokeOpacity="0.7"
                    strokeWidth="1.5"
                  />
                </g>
              )}

              {/* LAYER: CYCLONE TRACK & TIMELINE WAYPOINTS */}
              {layers.track && (
                <g className="map-layer">
                  <path
                    d="M850,560 C720,490 560,390 380,285"
                    fill="none"
                    stroke="#BA1A1A"
                    strokeDasharray="8,5"
                    strokeLinecap="round"
                    strokeWidth="2.5"
                  />

                  {/* Waypoint T-36H (NOW) */}
                  <g className="cursor-pointer" onClick={() => handleStepChange(0)}>
                    <circle cx="820" cy="540" fill="#BA1A1A" r="5" />
                    <circle cx="820" cy="540" fill="none" r="9" stroke="#BA1A1A" strokeOpacity="0.6" strokeWidth="1" />
                    <text fill="#EDE8E0" fontFamily="Metrophobic" fontSize="9" fontWeight="bold" x="835" y="544">
                      T-36H (NOW)
                    </text>
                  </g>

                  {/* Waypoint T-24H */}
                  <g className="cursor-pointer" onClick={() => handleStepChange(1)}>
                    <circle cx="680" cy="450" fill="#B74A32" r="4.5" />
                    <text fill="#DDD8CE" fontFamily="Metrophobic" fontSize="8.5" x="695" y="454">
                      T-24H (195 KM/H)
                    </text>
                  </g>

                  {/* Waypoint T-12H */}
                  <g className="cursor-pointer" onClick={() => handleStepChange(2)}>
                    <circle cx="520" cy="365" fill="#B74A32" r="4.5" />
                    <text fill="#DDD8CE" fontFamily="Metrophobic" fontSize="8.5" x="535" y="369">
                      T-12H (205 KM/H)
                    </text>
                  </g>

                  {/* Landfall Marker */}
                  <g className="cursor-pointer" onClick={() => handleStepChange(3)}>
                    <circle cx="380" cy="285" fill="#BA1A1A" r="7" />
                    <circle cx="380" cy="285" fill="none" r="16" stroke="#BA1A1A" strokeWidth="1.8">
                      <animate attributeName="r" dur="2.4s" repeatCount="indefinite" values="12;24;12" />
                      <animate attributeName="opacity" dur="2.4s" repeatCount="indefinite" values="0.8;0.2;0.8" />
                    </circle>
                    <circle cx="380" cy="285" fill="none" r="32" stroke="#B74A32" strokeDasharray="4,3" strokeWidth="1" />
                    <rect fill="#BA1A1A" height="18" stroke="#FFB4A4" strokeWidth="0.75" width="134" x="388" y="295" />
                    <text
                      fill="#FFFFFF"
                      fontFamily="Metrophobic"
                      fontSize="8.5"
                      fontWeight="bold"
                      letterSpacing="1"
                      x="394"
                      y="307"
                    >
                      LANDFALL (T-0) // CAT-4
                    </text>
                  </g>

                  {/* Active Cyclone Marker Dynamic Position */}
                  <g
                    style={{ transition: 'transform 0.8s cubic-bezier(0.2, 0.8, 0.2, 1)' }}
                    transform={`translate(${currentTimelineData.coords.x}, ${currentTimelineData.coords.y})`}
                  >
                    <circle cx="0" cy="0" fill="none" opacity="0.8" r="18" stroke="#B74A32" strokeWidth="1.2">
                      <animate attributeName="r" dur="2.8s" repeatCount="indefinite" values="6;26;36" />
                      <animate attributeName="opacity" dur="2.8s" repeatCount="indefinite" values="0.9;0.4;0" />
                    </circle>
                    <circle cx="0" cy="0" fill="#FFB4A4" r="3.5" />
                    <circle cx="0" cy="0" fill="#141312" r="1.5" />
                  </g>
                </g>
              )}

              {/* Arterials */}
              <path d="M180,100 L240,230 L270,360 L240,510" fill="none" stroke="#8A716C" strokeDasharray="6,3" strokeWidth="2.5" />
              <path d="M240,230 L350,265 L360,290" fill="none" stroke="#BA1A1A" strokeDasharray="3,2" strokeWidth="2" />
              <text fill="#FFB4A4" fontFamily="Metrophobic" fontSize="8" x="260" y="278">
                NH-516 [BREACH ZONE]
              </text>

              {/* CRITICAL INFRASTRUCTURE ASSETS */}
              {/* Regional Medical Center */}
              <g
                transform="translate(355, 245)"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedAssetId('MED-OD-402');
                  setActiveTabInspection('asset');
                }}
              >
                <rect className="asset-ping-ring" fill="none" height="18" stroke="#BA1A1A" strokeWidth="1" width="114" x="-6" y="-13" />
                <rect fill="#1E1917" height="16" stroke="#BA1A1A" strokeWidth="1.2" width="112" x="-5" y="-12" />
                <circle cx="2" cy="-4" fill="#BA1A1A" r="3.5" />
                <text fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" x="10" y="-1">
                  MED CENTER (RISK {scenario.rainfall_mm >= 280 ? '94' : '91'})
                </text>
              </g>

              {/* Chandbali Substation */}
              <g
                transform="translate(290, 310)"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedAssetId('PWR-CB-104');
                  setActiveTabInspection('asset');
                }}
              >
                <rect className="asset-ping-ring" fill="none" height="18" stroke="#C8923C" strokeWidth="1" width="112" x="-6" y="-13" />
                <rect fill="#1E1917" height="16" stroke="#C8923C" strokeWidth="1.2" width="110" x="-5" y="-12" />
                <circle cx="2" cy="-4" fill="#C8923C" r="3.5" />
                <text fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" x="10" y="-1">
                  CHANDBALI SUB ({scenario.rainfall_mm >= 280 ? '86' : '88'})
                </text>
              </g>

              {/* Paradip Port */}
              <g
                transform="translate(370, 440)"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedAssetId('LOG-PD-01');
                  setActiveTabInspection('asset');
                }}
              >
                <rect fill="#1E1917" height="16" stroke="#C8923C" strokeWidth="1.2" width="105" x="-5" y="-12" />
                <circle cx="2" cy="-4" fill="#C8923C" r="3.5" />
                <text fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" x="10" y="-1">
                  PARADIP PORT (86)
                </text>
              </g>

              {/* Water Plant 02 */}
              <g
                transform="translate(260, 205)"
                className="cursor-pointer"
                onClick={() => {
                  setSelectedAssetId('WTR-PD-02');
                  setActiveTabInspection('asset');
                }}
              >
                <rect fill="#1E1917" height="16" stroke="#68745A" strokeWidth="1.2" width="105" x="-5" y="-12" />
                <circle cx="2" cy="-4" fill="#68745A" r="3.5" />
                <text fill="#EDE8E0" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" x="10" y="-1">
                  WATER PLANT 02 (62)
                </text>
              </g>

              {/* Delta Marker (Shown when SHOW IMPACT DELTA is active) */}
              {deltaActive && (
                <g transform="translate(320, 370)" className="transition-opacity">
                  <rect className="asset-ping-ring" fill="none" height="18" stroke="#BA1A1A" strokeWidth="1.2" width="116" x="-6" y="-13" />
                  <rect fill="#231917" height="16" stroke="#BA1A1A" strokeWidth="1.4" width="114" x="-5" y="-12" />
                  <circle cx="2" cy="-4" fill="#BA1A1A" r="3.5" />
                  <text fill="#FFB4A4" fontFamily="Metrophobic" fontSize="8" fontWeight="bold" x="10" y="-1">
                    +BYPASS 4 (NEWLY CUT)
                  </text>
                </g>
              )}

              {/* District Labels */}
              <text fill="#7A7168" fontFamily="Be Vietnam Pro" fontSize="11" fontWeight="bold" letterSpacing="1" x="210" y="80">
                BHADRAK DISTRICT
              </text>
              <text fill="#7A7168" fontFamily="Be Vietnam Pro" fontSize="11" fontWeight="bold" letterSpacing="1" x="190" y="380">
                KENDRAPARA DISTRICT
              </text>
              <text fill="#3A342E" fontFamily="Be Vietnam Pro" fontSize="15" fontWeight="bold" letterSpacing="3" x="720" y="160">
                BAY OF BENGAL
              </text>
            </svg>
          </div>

          {/* Bottom Reticle Bar */}
          <div className="h-8 bg-[#141211] border-t border-[#262320] px-3 flex items-center justify-between z-30 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px] text-[#B74A32]">filter_center_focus</span>
                <span className="font-label-serif-caps text-[9px] text-[#DDD8CE]">
                  CROSSHAIR: 20.2961° N, 86.6714° E
                </span>
              </div>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span className="font-label-serif-caps text-[8.5px] text-[#9E978F]">ELEV: 2.1M ASL</span>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span className="font-label-serif-caps text-[8.5px] text-[#C8923C]">TIDE PHASE: SPRING (+0.7M)</span>
              <div className="h-3 w-px bg-[#262320]"></div>
              <span className="font-label-serif-caps text-[8.5px] text-[#68745A]">SLOSH-IND-V2</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-label-serif-caps text-[8px] text-[#8A847B] uppercase">COMPOUND RISK INDEX:</span>
              <div className="flex items-center h-2.5 border border-[#332E2A]">
                <span className="px-1.5 bg-[#444F37] text-[7.5px] text-[#dae7c8] font-label-serif-caps">0-30 LOW</span>
                <span className="px-1.5 bg-[#C8923C]/40 text-[7.5px] text-[#ffdad2] font-label-serif-caps border-l border-r border-[#332E2A]">31-60 MOD</span>
                <span className="px-1.5 bg-[#B74A32] text-[7.5px] text-white font-label-serif-caps font-bold">61-80 HIGH</span>
                <span className="px-1.5 bg-[#BA1A1A] text-[7.5px] text-white font-label-serif-caps font-bold">81-100 CRIT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Analytical Inspection Panel (28%) */}
        <aside className="w-[28%] h-full bg-[#F7F4EE] text-[#241917] flex flex-col justify-between overflow-y-auto border-l border-[#D8D2C5]">
          <div className="p-4 space-y-3.5">
            {/* Tabs */}
            <div className="flex items-center border-b border-[#E2DCCE] pb-2">
              <button
                onClick={() => setActiveTabInspection('zone')}
                className={`flex-1 py-1 text-center font-label-serif-caps text-[10px] uppercase font-bold tracking-wider -mb-2 pb-2 cursor-pointer transition-colors ${
                  activeTabInspection === 'zone'
                    ? 'text-[#B74A32] border-b-2 border-[#B74A32]'
                    : 'text-[#7A7168] hover:text-[#241917] border-b-2 border-transparent'
                }`}
              >
                ZONE INTELLIGENCE
              </button>
              <button
                onClick={() => setActiveTabInspection('asset')}
                className={`flex-1 py-1 text-center font-label-serif-caps text-[10px] uppercase font-bold tracking-wider -mb-2 pb-2 cursor-pointer transition-colors ${
                  activeTabInspection === 'asset'
                    ? 'text-[#B74A32] border-b-2 border-[#B74A32]'
                    : 'text-[#7A7168] hover:text-[#241917] border-b-2 border-transparent'
                }`}
              >
                ASSET INSPECTION
              </button>
            </div>

            {/* View: Zone Intelligence */}
            {activeTabInspection === 'zone' && (
              <div className="space-y-3.5">
                <div className="p-3 bg-white border border-[#E4DEC9] shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-[#BA1A1A]"></span>
                        <span className="font-headline-sm text-[14px] font-bold text-[#241917] uppercase tracking-wide">
                          {selectedZone?.name || 'ZONE B — DHAMRA ESTUARY'}
                        </span>
                      </div>
                      <span className="font-body-sm text-[10px] text-[#7A7168] mt-0.5">
                        {selectedZone?.sub_region || 'Bhadrak / Kendrapara Coastal Transition Sector'}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[10px] font-bold tracking-wider uppercase">
                        {selectedZone?.risk_score || scenario.risk_score} {selectedZone?.risk_level || 'CRITICAL'}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] mt-0.5">RISK SCORE</span>
                    </div>
                  </div>
                </div>

                {/* Hazard Profile */}
                <div>
                  <span className="font-label-serif-caps text-[8.5px] uppercase tracking-wider text-[#7A7168] font-bold block mb-1.5">
                    HAZARD PROFILE
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2 bg-white border border-[#E4DEC9]">
                      <div className="flex items-center justify-between text-[#8A716C] mb-0.5">
                        <span className="font-label-serif-caps text-[8px] uppercase">PRECIPITATION</span>
                        <span className="material-symbols-outlined text-[13px] text-[#C8923C]">rainy</span>
                      </div>
                      <span className="font-headline-sm text-[16px] font-bold text-[#241917] block leading-tight">
                        {scenario.rainfall_mm} MM
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">PEAK BASIN RAINFALL</span>
                    </div>
                    <div className="p-2 bg-white border border-[#E4DEC9]">
                      <div className="flex items-center justify-between text-[#8A716C] mb-0.5">
                        <span className="font-label-serif-caps text-[8px] uppercase">STORM SURGE</span>
                        <span className="material-symbols-outlined text-[13px] text-[#BA1A1A]">waves</span>
                      </div>
                      <span className="font-headline-sm text-[16px] font-bold text-[#BA1A1A] block leading-tight">
                        +{scenario.storm_surge_m} M
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">SPRING TIDE MATCH</span>
                    </div>
                    <div className="p-2 bg-white border border-[#E4DEC9]">
                      <div className="flex items-center justify-between text-[#8A716C] mb-0.5">
                        <span className="font-label-serif-caps text-[8px] uppercase">MEAN ELEVATION</span>
                        <span className="material-symbols-outlined text-[13px] text-[#68745A]">terrain</span>
                      </div>
                      <span className="font-headline-sm text-[16px] font-bold text-[#241917] block leading-tight">
                        {selectedZone?.hazard_profile.mean_elevation || '3.1 M'}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">LOW-LYING COASTAL FLAT</span>
                    </div>
                    <div className="p-2 bg-white border border-[#E4DEC9]">
                      <div className="flex items-center justify-between text-[#8A716C] mb-0.5">
                        <span className="font-label-serif-caps text-[8px] uppercase">DRAINAGE STATUS</span>
                        <span className="material-symbols-outlined text-[13px] text-[#BA1A1A]">water_loss</span>
                      </div>
                      <span className="font-headline-sm text-[16px] font-bold text-[#B74A32] block leading-tight">
                        {selectedZone?.hazard_profile.drainage_status || 'HIGH CHOKE'}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#8A716C]">RUNOFF PARALYSIS</span>
                    </div>
                  </div>
                </div>

                {/* Critical Exposure Audit */}
                <div className="p-2.5 bg-[#EDE8DE] border border-[#D8D2C5]">
                  <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#6B6359] block mb-1 font-semibold">
                    CRITICAL EXPOSURE AUDIT
                  </span>
                  <div className="flex items-center justify-between text-center">
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[13px] font-bold text-[#241917]">
                        {selectedZone?.exposure.roads || 7}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#7A7168]">ROAD LINKS</span>
                    </div>
                    <div className="h-5 w-px bg-[#D5CEBF]"></div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[13px] font-bold text-[#BA1A1A]">
                        {selectedZone?.exposure.hospitals || 2}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#7A7168]">HOSPITALS</span>
                    </div>
                    <div className="h-5 w-px bg-[#D5CEBF]"></div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[13px] font-bold text-[#C8923C]">
                        {selectedZone?.exposure.power_grids || 4}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#7A7168]">PWR GRIDS</span>
                    </div>
                    <div className="h-5 w-px bg-[#D5CEBF]"></div>
                    <div className="flex flex-col">
                      <span className="font-headline-sm text-[13px] font-bold text-[#68745A]">
                        {selectedZone?.exposure.shelters || 6}
                      </span>
                      <span className="font-label-serif-caps text-[7.5px] text-[#7A7168]">SHELTERS</span>
                    </div>
                  </div>
                </div>

                {/* Analyst Brief */}
                <div className="p-2.5 bg-white border-l-2 border-[#B74A32] border-y border-r border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[8.5px] font-bold text-[#B74A32] uppercase tracking-wider flex items-center gap-1 mb-1">
                    <span className="material-symbols-outlined text-[12px]">analytics</span>ANALYST BRIEF (WHY THIS ZONE?)
                  </span>
                  <p className="font-body-sm text-[11px] text-[#4A3E3B] leading-relaxed">
                    {selectedZone?.analyst_brief ||
                      'Alluvial elevation combined with concurrent spring high-tide and 220mm precipitation creates severe drainage backflow paralysis along the Dhamra–Paradip corridor.'}
                  </p>
                </div>

                {/* Compound Hazard Cascade */}
                <div>
                  <span className="font-label-serif-caps text-[8.5px] uppercase tracking-wider text-[#7A7168] font-bold block mb-1.5">
                    COMPOUND HAZARD CASCADE
                  </span>
                  <div className="space-y-1.5">
                    <div className="flex items-start gap-2 p-1.5 bg-white border border-[#E4DEC9]">
                      <span className="px-1 py-0.5 bg-[#F2EDE2] font-label-serif-caps text-[8px] font-bold text-[#7A7168]">01</span>
                      <p className="font-body-sm text-[10.5px] text-[#241917] leading-snug">
                        Heavy coastal rainfall ({scenario.rainfall_mm}mm) exceeds basin absorption capacity
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-1.5 bg-white border border-[#E4DEC9]">
                      <span className="px-1 py-0.5 bg-[#F2EDE2] font-label-serif-caps text-[8px] font-bold text-[#7A7168]">02</span>
                      <p className="font-body-sm text-[10.5px] text-[#241917] leading-snug">
                        Estuary drainage backflow caused by +{scenario.storm_surge_m}m storm surge
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-1.5 bg-white border border-[#E4DEC9]">
                      <span className="px-1 py-0.5 bg-[#BA1A1A] font-label-serif-caps text-[8px] font-bold text-white">03</span>
                      <p className="font-body-sm text-[10.5px] text-[#BA1A1A] font-medium leading-snug">
                        NH-516 submerged between MP 12-19 (0.8m - 1.2m depth)
                      </p>
                    </div>
                    <div className="flex items-start gap-2 p-1.5 bg-white border border-[#E4DEC9]">
                      <span className="px-1 py-0.5 bg-[#BA1A1A] font-label-serif-caps text-[8px] font-bold text-white">04</span>
                      <p className="font-body-sm text-[10.5px] text-[#BA1A1A] font-medium leading-snug">
                        Complete medical access loss &amp; critical patient transport paralysis
                      </p>
                    </div>
                  </div>
                </div>

                {/* Gemini Decision Directive */}
                <div className="p-2.5 bg-[#241917] text-[#EDE8E0] border border-[#3E2E2A]">
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="material-symbols-outlined text-[13px] text-[#FFB4A4]">auto_awesome</span>
                    <span className="font-label-serif-caps text-[8.5px] font-bold text-[#FFB4A4] uppercase tracking-wider">
                      GEMINI DECISION DIRECTIVE
                    </span>
                  </div>
                  <p className="font-body-sm text-[10.5px] text-[#dec0b9] leading-relaxed">
                    Prepare alternate medical access routes via inland bypass R-4; pre-position NDRF amphibious response teams and deploy high-capacity dewatering pumps at sector 7 culvert.
                  </p>
                </div>
              </div>
            )}

            {/* View: Asset Inspection */}
            {activeTabInspection === 'asset' && (
              <div className="space-y-3">
                <div className="p-3 bg-white border border-[#E4DEC9] shadow-sm">
                  <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#7A7168] block">
                    PRIMARY CRITICAL FACILITY
                  </span>
                  <div className="flex items-center justify-between mt-1">
                    <span className="font-headline-sm text-[13px] font-bold text-[#241917] uppercase">
                      {selectedAsset?.name || 'REGIONAL MEDICAL CENTER'}
                    </span>
                    <span className="px-1.5 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[9px] font-bold">
                      RISK {selectedAsset?.risk_score || (scenario.rainfall_mm >= 280 ? 94 : 91)}
                    </span>
                  </div>
                  <span className="font-body-sm text-[10px] text-[#7A7168]">
                    {selectedAsset?.sub_zone || 'Sector 4B Coastal Access Hub'} • {selectedAsset?.capacity || '450 In-Patient Beds'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <span className="font-label-serif-caps text-[8.5px] uppercase tracking-wider text-[#7A7168] font-bold block">
                    DIRECT HAZARD EXPOSURE
                  </span>
                  <div className="p-2 bg-white border border-[#E4DEC9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#BA1A1A]">flood</span>
                      <span className="font-label-serif-md text-[11px] text-[#241917]">Water Inundation Threshold</span>
                    </div>
                    <span className="font-label-serif-caps text-[9px] font-bold text-[#BA1A1A]">+0.65M EXCEEDED</span>
                  </div>
                  <div className="p-2 bg-white border border-[#E4DEC9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#C8923C]">electric_bolt</span>
                      <span className="font-label-serif-md text-[11px] text-[#241917]">Grid Power Redundancy</span>
                    </div>
                    <span className="font-label-serif-caps text-[9px] font-bold text-[#C8923C]">DG GEN ONLY (48H)</span>
                  </div>
                  <div className="p-2 bg-white border border-[#E4DEC9] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[15px] text-[#68745A]">minor_crash</span>
                      <span className="font-label-serif-md text-[11px] text-[#241917]">Evacuation Arterial NH-516</span>
                    </div>
                    <span className="font-label-serif-caps text-[9px] font-bold text-[#BA1A1A]">SEVERED AT MP 14</span>
                  </div>
                </div>

                <div className="p-2.5 bg-[#EDE8DE] border border-[#D8D2C5]">
                  <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#6B6359] block mb-1 font-semibold">
                    COASTAL SUB-SECTOR SUMMARY
                  </span>
                  <div className="text-[10.5px] text-[#4A3E3B] space-y-1">
                    <p>• Chandbali 132kV Substation: {scenario.rainfall_mm >= 280 ? '86' : '88'} Critical Risk (transformer yard surge cutoff threat).</p>
                    <p>• Paradip Deepwater Port: 86 Critical Risk (cargo berth stoppage ordered at T-12H).</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Dispatch Button */}
          <div className="p-3 border-t border-[#D8D2C5] bg-[#EFECE3]">
            <button
              onClick={handleDispatch}
              className="w-full py-2.5 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[11px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">send</span>
              <span>{dispatchedBtnText}</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
