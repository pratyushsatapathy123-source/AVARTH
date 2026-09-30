import React from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

export const Header: React.FC = () => {
  const { scenario } = useScenario();

  return (
    <header className="fixed top-0 left-64 right-0 h-14 bg-[#141312] border-b border-[#262320] z-40 flex items-center justify-between px-4 select-none">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-[#B74A32]"></span>
          <span className="font-title-md text-[15px] font-bold tracking-wider text-[#F2EFE8] uppercase">
            AVARTH
          </span>
          <span className="font-label-serif-caps text-[9px] tracking-widest text-[#9E978F] uppercase border-l border-[#262320] pl-2 hidden sm:inline">
            TAC-OPS // GEOSPATIAL IMPACT INTELLIGENCE
          </span>
        </div>
      </div>

      <div className="hidden xl:flex items-center gap-3 px-3 py-1 bg-[#1E1C1A] border border-[#262320]">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#B74A32] text-[16px]">explore</span>
          <span className="font-label-serif-md text-[11px] text-[#DDD8CE] tracking-widest uppercase">
            {scenario.region || 'BAY OF BENGAL / SECTOR-04B'}
          </span>
        </div>
        <div className="h-3 w-px bg-[#3E3A36]"></div>
        <span className="font-label-serif-caps text-[9px] text-[#C8923C] bg-[#2A2318] px-1.5 py-0.5 border border-[#685328] uppercase font-semibold">
          SIMULATED SCENARIO
        </span>
        <div className="h-3 w-px bg-[#3E3A36]"></div>
        <span className="font-label-serif-caps text-[8.5px] text-[#FFB4A4]">
          RISK: {scenario.risk_score}/100 ({scenario.risk_level})
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden md:flex flex-col text-right">
          <span className="font-label-serif-md text-[11px] text-[#DDD8CE]">LIVE TELEMETRY: 16:04 IST</span>
          <span className="font-label-serif-caps text-[8.5px] text-[#8A847B] uppercase">GEE &amp; MET BLEND CONNECTED</span>
        </div>
        <div className="flex items-center gap-2 pl-3 border-l border-[#262320]">
          <div className="px-2 py-1 bg-[#23201D] border border-[#3A3530] flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-[#B74A32] rounded-none"></span>
            <span className="font-label-serif-caps text-[9px] text-[#DDD8CE] uppercase tracking-wider hidden lg:inline">
              DG NDRF SEOC - LEVEL-4 CLEARANCE
            </span>
            <span className="font-label-serif-caps text-[9px] text-[#DDD8CE] uppercase tracking-wider lg:hidden">
              SEOC L4
            </span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[#B74A32] text-white flex items-center justify-center font-medium shadow-sm">
            <span className="material-symbols-outlined text-[18px]">person</span>
          </div>
        </div>
      </div>
    </header>
  );
};
