import React from 'react';
import { ScenarioProvider, useScenario } from './context/ScenarioContext.tsx';
import { Header } from './components/Header.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { CommandCenter } from './components/CommandCenter.tsx';
import { ImpactMap } from './components/ImpactMap.tsx';
import { CycloneSimulator } from './components/CycloneSimulator.tsx';
import { InfrastructureView } from './components/InfrastructureView.tsx';
import { AIImpactAnalyst } from './components/AIImpactAnalyst.tsx';
import { AdvisoryAndAlerts } from './components/AdvisoryAndAlerts.tsx';
import { AttributionModal } from './components/AttributionModal.tsx';

const AppContent: React.FC = () => {
  const { activeTab, dispatchNotification, dismissDispatchNotification } = useScenario();

  return (
    <div className="flex bg-[#141312] min-h-screen text-[#EDE8E0] overflow-hidden select-none font-body-md">
      {/* Universal Side Navigation Bar */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="pl-64 flex flex-col flex-1 h-screen overflow-hidden">
        {/* Universal Top Header */}
        <Header />

        {/* Global Attribution Modal (On-demand) */}
        <AttributionModal />

        {/* Global Dispatch Notification Banner */}
        {dispatchNotification && (
          <div className="fixed top-14 left-64 right-0 z-50 bg-[#251917] border-b border-[#BA1A1A] p-2.5 px-6 flex items-center justify-between shadow-2xl text-white">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 bg-[#BA1A1A] animate-pulse"></span>
              <span className="font-label-serif-caps text-[10px] text-[#FFB4A4] uppercase font-bold tracking-widest">
                DISPATCH SIMULATED
              </span>
              <span className="h-3 w-px bg-[#57423D]"></span>
              <span className="font-body-sm text-[11px] text-[#EDE8E0]">
                {dispatchNotification.message} ({dispatchNotification.timestamp})
              </span>
            </div>
            <button
              onClick={dismissDispatchNotification}
              className="text-[#dec0b9] hover:text-white font-label-serif-caps text-[9px] uppercase tracking-wider px-2 py-0.5 bg-[#3F322F] border border-[#57423D] cursor-pointer"
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Dynamic Screen Viewport */}
        <main className="pt-14 flex-1 overflow-hidden flex flex-col">
          {activeTab === 'command-center' && <CommandCenter />}
          {activeTab === 'impact-map' && <ImpactMap />}
          {activeTab === 'cyclone-simulator' && <CycloneSimulator />}
          {activeTab === 'infrastructure' && <InfrastructureView />}
          {activeTab === 'ai-impact-analyst' && <AIImpactAnalyst />}
          {activeTab === 'advisories-and-alerts' && <AdvisoryAndAlerts />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <ScenarioProvider>
      <AppContent />
    </ScenarioProvider>
  );
}
