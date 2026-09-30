import React from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';

export const AttributionModal: React.FC = () => {
  const { showAttributionModal, setShowAttributionModal, environmentalContext, environmentalLayers, attributions } =
    useScenario();

  if (!showAttributionModal) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="attribution-title"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150"
      onClick={() => setShowAttributionModal(false)}
    >
      <div
        className="w-full max-w-2xl bg-[#171514] border border-[#B74A32]/70 shadow-2xl text-[#EDE8E0] p-5 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#2C2724] pb-2.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#B74A32] text-[18px]">verified</span>
            <div>
              <h2
                id="attribution-title"
                className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase"
              >
                ENVIRONMENTAL &amp; METEOROLOGICAL DATA PROVENANCE
              </h2>
              <span className="font-label-serif-caps text-[8px] text-[#9E978F] block">
                AUTHENTICATED GOOGLE EARTH ENGINE &amp; ECMWF INGESTION MATRIX
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowAttributionModal(false)}
            aria-label="Close modal"
            className="text-[#9E978F] hover:text-white p-1 text-[16px] cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Live vs Demo Status Badge */}
        <div className="p-2.5 bg-[#1F1C1B] border border-[#3A332E] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                environmentalContext?.mode === 'LIVE' ? 'bg-[#68745A] animate-pulse' : 'bg-[#C8923C]'
              }`}
            ></span>
            <span className="font-label-serif-caps text-[9px] uppercase font-bold text-[#F2EFE8]">
              ACTIVE MODE: {environmentalContext?.mode === 'LIVE' ? 'LIVE EARTH ENGINE' : 'DEMO ENVIRONMENTAL DATA'}
            </span>
          </div>
          <span className="font-label-serif-caps text-[8px] text-[#8A847B]">
            REGION: BAY OF BENGAL / SECTOR-04
          </span>
        </div>

        {/* Active Layers Status */}
        <div className="space-y-2">
          <span className="font-label-serif-caps text-[8.5px] uppercase font-bold text-[#8A716C] tracking-wider block">
            01 // ACTIVE INGESTION TELEMETRY
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10.5px]">
            {environmentalLayers.map(l => (
              <div key={l.layer} className="p-2 bg-[#1B1917] border border-[#2D2825] space-y-0.5">
                <div className="flex items-center justify-between">
                  <span className="font-headline-sm text-[11px] font-bold text-[#DDD8CE] uppercase">{l.layer}</span>
                  <span
                    className={`px-1 py-0.2 font-label-serif-caps text-[7px] uppercase font-bold ${
                      l.mode === 'LIVE'
                        ? 'bg-[#68745A]/30 text-[#BECBAD] border border-[#68745A]'
                        : 'bg-[#C8923C]/20 text-[#DDD8CE] border border-[#C8923C]/40'
                    }`}
                  >
                    {l.mode}
                  </span>
                </div>
                <div className="font-body-sm text-[10px] text-[#9E978F]">{l.source}</div>
                <div className="font-label-serif-caps text-[7.5px] text-[#6E675F]">{l.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dataset Catalog Sources */}
        <div className="space-y-2">
          <span className="font-label-serif-caps text-[8.5px] uppercase font-bold text-[#8A716C] tracking-wider block">
            02 // OFFICIAL CATALOG ATTRIBUTIONS
          </span>
          <div className="space-y-1.5">
            {attributions.map((attr, idx) => (
              <div key={idx} className="p-2 bg-[#141312] border border-[#262320] text-[10px] space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-[#FFB4A4] uppercase">{attr.dataset}</span>
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">{attr.resolution}</span>
                </div>
                <div className="text-[#DDD8CE]">{attr.provider}</div>
                <div className="font-mono text-[8.5px] text-[#6E675F]">{attr.catalogId}</div>
                <div className="font-body-sm text-[9px] text-[#8A847B] italic">Purpose: {attr.purpose}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scientific Claim Discipline Notice */}
        <div className="p-2.5 bg-[#231A18] border border-[#57423D] text-[9.5px] text-[#dec0b9] space-y-1">
          <span className="font-label-serif-caps text-[8px] text-[#FFB4A4] uppercase font-bold block">
            SCIENTIFIC CLAIM &amp; PROTOTYPE SCREENING DISCIPLINE
          </span>
          <p className="leading-relaxed">
            Values displayed represent rapid-screening heuristics and scenario simulation models. Inundation depth,
            flood susceptibility scores, and infrastructure exposures are prototype screening indices for anticipatory
            pre-landfall staging and do not constitute certified hydrodynamic flood predictions or official meteorological
            warnings.
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-[#262320]">
          <button
            type="button"
            onClick={() => setShowAttributionModal(false)}
            className="px-4 py-1 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[9px] uppercase tracking-wider cursor-pointer"
          >
            ACKNOWLEDGE &amp; RETURN
          </button>
        </div>
      </div>
    </div>
  );
};
