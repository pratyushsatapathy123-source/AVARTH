import React from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

interface NavItem {
  id: string;
  label: string;
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'command-center', label: 'Command Center', icon: 'radar' },
  { id: 'impact-map', label: 'Impact Map', icon: 'map' },
  { id: 'cyclone-simulator', label: 'Cyclone Simulator', icon: 'air' },
  { id: 'infrastructure', label: 'Infrastructure', icon: 'domain' },
  { id: 'ai-impact-analyst', label: 'AI Impact Analyst', icon: 'neurology' },
  { id: 'advisories-and-alerts', label: 'Advisory & Alerts', icon: 'warning' },
];

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab } = useScenario();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-[#141312] border-r border-[#262320] z-50 flex flex-col justify-between py-3 select-none">
      <div className="flex flex-col w-full">
        {/* Brand Header */}
        <div className="h-14 px-3 flex items-center gap-2 border-b border-[#262320]">
          <div className="w-8 h-8 border border-[#B74A32]/60 bg-[#1D1B1A] flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[#B74A32] text-[20px]">cyclone</span>
          </div>
          <div className="flex flex-col">
            <span className="font-title-md text-[15px] font-bold tracking-wider text-[#F2EFE8] uppercase leading-none">
              AVARTH
            </span>
            <span className="font-label-serif-caps text-[8px] tracking-widest text-[#9E978F] uppercase mt-1 leading-none">
              TAC-OPS // GEOSPATIAL IMPACT
            </span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-col w-full gap-1 px-2 pt-3">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`group relative flex items-center justify-between px-3 py-2.5 transition-colors text-left w-full cursor-pointer ${
                  isActive
                    ? 'bg-[#B74A32] text-white border-l-2 border-[#FFB4A4] shadow-sm'
                    : 'text-[#9E978F] hover:bg-[#23201D] hover:text-[#EDE8E0]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span className="font-label-serif-md text-[12px] uppercase tracking-wider font-semibold">
                    {item.label}
                  </span>
                </div>
                {isActive && (
                  <span className="w-1.5 h-1.5 bg-[#FFB4A4] rounded-full animate-pulse"></span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom System Status */}
      <div className="flex flex-col w-full px-3 gap-1.5 border-t border-[#262320] pt-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-[#68745A] rounded-full animate-pulse"></span>
            <span className="font-label-serif-caps text-[9px] text-[#EDE8E0] uppercase tracking-wider font-semibold">
              SYS OP 16:04 IST
            </span>
          </div>
          <span className="font-label-serif-caps text-[8.5px] text-[#BECBAD] uppercase">
            SYNCHRONIZED
          </span>
        </div>
        <div className="px-2 py-1 bg-[#1D1B1A] border border-[#2D2825] flex items-center justify-between">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] uppercase">
            SEC-LEVEL: L4 RESTRICTED
          </span>
          <span className="w-1.5 h-1.5 bg-[#B74A32]"></span>
        </div>
      </div>
    </aside>
  );
};
