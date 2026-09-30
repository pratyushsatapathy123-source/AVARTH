import React, { useState, useMemo } from 'react';
import { useScenario } from '../context/ScenarioContext.tsx';
import type { InfrastructureAsset } from '../../server/models/types.ts';

export const InfrastructureView: React.FC = () => {
  const {
    assets,
    selectedAsset,
    setSelectedAssetId,
    scenario,
    simulationResult,
    setActiveTab,
  } = useScenario();

  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAssets = useMemo(() => {
    let result = [...assets];

    if (activeFilter === 'CRITICAL') {
      result = result.filter(a => a.risk_score >= 80);
    } else if (activeFilter === 'NEWLY_EXPOSED') {
      result = result.filter(a => a.is_newly_exposed);
    } else if (activeFilter !== 'ALL') {
      result = result.filter(a => a.type.toLowerCase() === activeFilter.toLowerCase());
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.sub_zone && a.sub_zone.toLowerCase().includes(q))
      );
    }

    return result;
  }, [assets, activeFilter, searchTerm]);

  const currentDossier: InfrastructureAsset = selectedAsset || assets[0] || {
    id: 'MED-OD-402',
    name: 'REGIONAL MEDICAL CENTER & TRAUMA COMPLEX',
    type: 'medical',
    criticality: 'high',
    zone: 'Zone B',
    sub_zone: 'Dhamra Intersection',
    elevation_m: 2.1,
    dist_to_surge_m: 340,
    risk_score: scenario.rainfall_mm >= 280 ? 94 : 91,
    risk_level: 'CRITICAL',
    primary_hazard: 'Estuary backflow drainage choking at high tide (+2.4m surge)',
    access_risk: 'NH-516 Cut MP 12-19',
    vulnerability_factors: [
      { name: 'Low Elevation & Alluvial Silt Basin', weight: 94 },
      { name: 'Arterial Road Inaccessibility', weight: 92 },
      { name: 'Compound Estuary Backflow', weight: 89 },
      { name: 'Structural Wind Integrity', weight: 42 },
    ],
    likely_consequence: 'Complete medical access loss & critical patient transport paralysis',
    recommended_preparation: 'Prepare alternate medical access routes via inland bypass R-4',
    coordinates: [86.822, 20.816],
    svg_pos: { x: 355, y: 245 },
    status: 'ACTIVE RISK (38 ICU)',
    capacity: '450 Beds (38 ICU)',
    genset_fuel_hours: 48,
    oxygen_reserve_hours: 72,
  };

  return (
    <div className="flex flex-col flex-1 h-[calc(100vh-3.5rem)] overflow-y-auto bg-[#141312] text-[#EDE8E0] select-none">
      {/* Sub-header Bar */}
      <div className="h-10 bg-[#191716] border-b border-[#262320] px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-headline-sm text-[13px] font-bold tracking-wider text-[#F7F4EE] uppercase">
            INFRASTRUCTURE VULNERABILITY
          </span>
          <span className="px-1.5 py-0.5 bg-[#B74A32]/20 border border-[#B74A32]/50 text-[#FFB4A4] font-label-serif-caps text-[8px] uppercase">
            CRISIS OPERATIONAL LEVEL-4
          </span>
          <div className="h-3 w-px bg-[#332E2A]"></div>
          <span className="font-label-serif-md text-[10.5px] text-[#9E978F] uppercase tracking-wider hidden md:inline">
            Critical asset exposure, accessibility risk and pre-landfall operational readiness
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-label-serif-caps text-[8.5px] text-[#BECBAD]">
            SLOSH-IND-V2 CALIBRATED • GEE DATABASE ODISHA-COAST-04
          </span>
        </div>
      </div>

      {/* Top Metric Cards Strip */}
      <div className="grid grid-cols-2 md:grid-cols-6 border-b border-[#262320] bg-[#171514]">
        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">CRITICAL ASSETS</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#F2EFE8]">19</span>
            <span className="font-label-serif-caps text-[8px] text-[#8A847B]">SECTOR-04B</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">Total monitored</span>
        </div>

        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">HIGH / CRIT RISK</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#BA1A1A]">11</span>
            <span className="font-label-serif-caps text-[8px] text-[#BA1A1A]">58% TOTAL</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">&ge; 70 Severity Score</span>
        </div>

        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">ACCESS DISRUPTION</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#FFB4A4]">
              {simulationResult.roadsExposed}
            </span>
            <span className="font-label-serif-caps text-[8px] text-[#FFB4A4]">CHOKED</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">Road links submerged</span>
        </div>

        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">MEDICAL FACILITIES</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#BA1A1A]">
              {simulationResult.medicalFacilitiesExposed}
            </span>
            <span className="font-label-serif-caps text-[8px] text-[#BA1A1A]">ISOLATED</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">Surge Threatened</span>
        </div>

        <div className="p-2.5 border-r border-[#262320]">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">POWER GRID ASSETS</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#C8923C]">
              {simulationResult.powerAssetsExposed}
            </span>
            <span className="font-label-serif-caps text-[8px] text-[#C8923C]">SUBSTATIONS</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">In Flood Plain</span>
        </div>

        <div className="p-2.5">
          <span className="font-label-serif-caps text-[8px] text-[#8A847B] block">EMERGENCY SHELTERS</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="font-headline-sm text-[16px] font-bold text-[#68745A]">
              {simulationResult.sheltersExposed}
            </span>
            <span className="font-label-serif-caps text-[8px] text-[#68745A]">ACTIVE</span>
          </div>
          <span className="font-label-serif-caps text-[7.5px] text-[#8A847B] block">Near Inundation</span>
        </div>
      </div>

      {/* Main Workspace: Filter & Table (Left) + Dossier (Right) */}
      <div className="flex flex-1 min-h-[580px] overflow-hidden">
        {/* LEFT COLUMN: Asset Registry Table */}
        <div className="flex-1 bg-[#141211] flex flex-col overflow-hidden border-r border-[#262320]">
          {/* Filter Bar */}
          <div className="p-2.5 bg-[#171514] border-b border-[#262320] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-1 overflow-x-auto">
              {[
                { id: 'ALL', label: 'ALL (19)' },
                ...(simulationResult.newlyExposedAssets.length > 0
                  ? [{ id: 'NEWLY_EXPOSED', label: `NEWLY EXPOSED (${simulationResult.newlyExposedAssets.length})` }]
                  : []),
                { id: 'CRITICAL', label: 'CRITICAL' },
                { id: 'medical', label: `MEDICAL (${simulationResult.medicalFacilitiesExposed})` },
                { id: 'power', label: `POWER (${simulationResult.powerAssetsExposed})` },
                { id: 'road', label: `ROADS (${simulationResult.roadsExposed})` },
                { id: 'shelter', label: `SHELTERS (${simulationResult.sheltersExposed})` },
                { id: 'water', label: 'WATER (2)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-2 py-1 font-label-serif-caps text-[8px] uppercase tracking-wider cursor-pointer transition-colors ${
                    activeFilter === tab.id
                      ? 'bg-[#B74A32] text-white font-bold'
                      : 'bg-[#1E1C1A] text-[#8A847B] hover:text-[#EDE8E0]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="relative w-64">
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search asset name, facility ID, or code..."
                className="w-full bg-[#1E1C1A] border border-[#2D2825] px-2.5 py-1 text-[11px] font-body-sm text-[#EDE8E0] placeholder-[#6E675F] focus:border-[#B74A32] focus:outline-none"
              />
              <span className="material-symbols-outlined absolute right-2 top-1.5 text-[14px] text-[#6E675F]">
                search
              </span>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left text-[11px] font-body-sm border-collapse">
              <thead>
                <tr className="bg-[#1A1816] text-[#8A847B] font-label-serif-caps text-[8px] uppercase tracking-wider border-b border-[#262320]">
                  <th className="p-2.5">ASSET &amp; IDENTIFIER</th>
                  <th className="p-2.5">CLASS</th>
                  <th className="p-2.5">ZONE</th>
                  <th className="p-2.5">RISK SCORE</th>
                  <th className="p-2.5">HAZARD EXPOSURE</th>
                  <th className="p-2.5">ACCESS STATUS</th>
                  <th className="p-2.5">STATUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#221F1C]">
                {filteredAssets.map(asset => {
                  const isSelected = currentDossier.id === asset.id;
                  const isCritical = asset.risk_score >= 80;
                  return (
                    <tr
                      key={asset.id}
                      onClick={() => setSelectedAssetId(asset.id)}
                      className={`cursor-pointer transition-colors hover:bg-[#201C1A] ${
                        isSelected ? 'bg-[#251A18] border-l-2 border-[#B74A32]' : ''
                      }`}
                    >
                      <td className="p-2.5">
                        <div className="flex items-start gap-1.5">
                          <span className="text-[#B74A32] font-bold">+</span>
                          <div>
                            <span className="font-bold text-[#EDE8E0] block leading-snug">
                              {asset.name}
                            </span>
                            <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">
                              ID: {asset.id} {asset.sub_zone ? `• ${asset.sub_zone}` : ''}
                            </span>
                            {asset.is_newly_exposed && (
                              <span className="font-label-serif-caps text-[7px] text-[#BA1A1A] block font-bold">
                                NEWLY EXPOSED (+38KM² EXPANSION)
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-2.5 capitalize text-[#BECBAD]">{asset.type}</td>
                      <td className="p-2.5 text-[#9E978F]">{asset.zone}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-1.5 py-0.5 font-label-serif-caps text-[8.5px] font-bold ${
                            isCritical
                              ? 'bg-[#BA1A1A] text-white'
                              : asset.risk_score >= 60
                              ? 'bg-[#C8923C] text-white'
                              : 'bg-[#68745A] text-white'
                          }`}
                        >
                          {asset.risk_score} {asset.risk_level}
                        </span>
                      </td>
                      <td className="p-2.5 text-[#9E978F] text-[10px] leading-tight">
                        {asset.primary_hazard.length > 35
                          ? asset.primary_hazard.slice(0, 35) + '...'
                          : asset.primary_hazard}
                      </td>
                      <td className="p-2.5">
                        <span className={`font-label-serif-caps text-[8px] font-bold ${
                          asset.access_risk.includes('Cut') || asset.access_risk.includes('BREACHED') || asset.access_risk.includes('CHOKE')
                            ? 'text-[#BA1A1A]'
                            : 'text-[#68745A]'
                        }`}>
                          {asset.access_risk.length > 30 ? asset.access_risk.slice(0, 30) + '...' : asset.access_risk}
                        </span>
                      </td>
                      <td className="p-2.5">
                        <span className="font-label-serif-caps text-[7.5px] text-[#8A847B]">
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN: ENGINEERING ASSET DOSSIER (420px) */}
        <aside className="w-[420px] bg-[#F7F4EE] text-[#241917] flex flex-col justify-between overflow-y-auto border-l border-[#D8D2C5]">
          <div className="p-4 space-y-3.5">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-[#E2DCCE] pb-2">
              <div>
                <span className="font-label-serif-caps text-[8px] text-[#7A7168] block">
                  ENGINEERING ASSET DOSSIER // CRITICAL NODE
                </span>
                <span className="font-headline-sm text-[13px] font-bold text-[#241917] uppercase block mt-0.5">
                  {currentDossier.name}
                </span>
                <span className="font-body-sm text-[10px] text-[#7A7168]">
                  Node #{currentDossier.id} • {currentDossier.capacity || 'Critical Sector Node'}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="px-2 py-0.5 bg-[#BA1A1A] text-white font-label-serif-caps text-[10px] font-bold">
                  {currentDossier.risk_score}
                </span>
                <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] mt-0.5">CRITICAL RISK</span>
              </div>
            </div>

            {/* Physical & Geospatial Parameters Grid */}
            <div>
              <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#7A7168] font-bold block mb-1">
                PHYSICAL &amp; GEOSPATIAL PARAMETERS
              </span>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">ELEVATION ASL</span>
                  <span className="font-bold text-[#241917] text-[12px]">{currentDossier.elevation_m}m ASL</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">Mean Spring Tide: +1.8m</span>
                </div>
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">DIST TO SURGE EDGE</span>
                  <span className="font-bold text-[#BA1A1A] text-[12px]">{currentDossier.dist_to_surge_m} Meters</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">Active Model Delta</span>
                </div>
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">SURGE EXPOSURE</span>
                  <span className="font-bold text-[#BA1A1A] text-[12px]">+{scenario.storm_surge_m} M</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">High-Tide Concurrent</span>
                </div>
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">BASIN RAINFALL</span>
                  <span className="font-bold text-[#241917] text-[12px]">{scenario.rainfall_mm} mm</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">Delta Esc: 280 mm</span>
                </div>
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">OXYGEN RESERVE</span>
                  <span className="font-bold text-[#BA1A1A] text-[12px]">{currentDossier.oxygen_reserve_hours || 72} Hours</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">Isolated Supply Buffer</span>
                </div>
                <div className="p-2 bg-white border border-[#E4DEC9]">
                  <span className="font-label-serif-caps text-[7.5px] text-[#8A716C] block">GENSET FUEL RESERVE</span>
                  <span className="font-bold text-[#241917] text-[12px]">{currentDossier.genset_fuel_hours || 48} Hours</span>
                  <span className="font-label-serif-caps text-[7px] text-[#7A7168] block">Roof Mount (Verified)</span>
                </div>
              </div>
            </div>

            {/* Vulnerability Factor Weights */}
            <div className="p-2.5 bg-white border border-[#E4DEC9] space-y-1.5">
              <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#7A7168] font-bold block">
                VULNERABILITY FACTOR WEIGHTS
              </span>
              {currentDossier.vulnerability_factors.map(f => (
                <div key={f.name} className="space-y-0.5">
                  <div className="flex justify-between text-[10px]">
                    <span className="text-[#3A2E2B] font-medium">{f.name}</span>
                    <span className="font-bold text-[#BA1A1A]">{f.weight}% ({f.weight >= 85 ? 'CRITICAL' : 'HIGH'})</span>
                  </div>
                  <div className="w-full bg-[#EAE4D7] h-1.5">
                    <div className="bg-[#BA1A1A] h-1.5" style={{ width: `${f.weight}%` }}></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Compound Impact Casual Pathway */}
            <div className="p-2.5 bg-[#EDE8DE] border border-[#D8D2C5] space-y-1">
              <span className="font-label-serif-caps text-[8px] uppercase tracking-wider text-[#6B6359] block font-semibold">
                COMPOUND IMPACT CASUAL PATHWAY
              </span>
              <div className="text-[10px] text-[#3A2E2B] space-y-0.5">
                <p>[01] Forecast Basin Rain ({scenario.rainfall_mm}mm) + High-Tide Surge (+{scenario.storm_surge_m}m)</p>
                <p className="text-[#5A4E4A]">&darr; [02] Dhamra River estuary backflow creates severe drainage stagnation</p>
                <p className="text-[#BA1A1A] font-medium">&darr; [03] NH-516 arterial breach between MP 12-19 (water depth 1.2m)</p>
                <p className="text-[#BA1A1A] font-bold">&darr; [04] Complete ambulance transit paralysis &amp; critical O2 supply isolation</p>
              </div>
            </div>

            {/* Geospatial Locator & Direct Action Button */}
            <div className="p-2 bg-white border border-[#E4DEC9]">
              <span className="font-label-serif-caps text-[8px] text-[#7A7168] uppercase font-bold block mb-1">
                GEOSPATIAL LOCATOR // SECTOR- 20.816° N, 86.822° E
              </span>
              <button
                onClick={() => setActiveTab('impact-map')}
                className="w-full py-1.5 bg-[#1F1D1B] hover:bg-[#2C2724] text-[#FFB4A4] border border-[#3E3832] font-label-serif-caps text-[9px] uppercase tracking-wider transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>VIEW ASSET ON IMPACT MAP</span>
                <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </button>
            </div>

            {/* Gemini Decision Directive */}
            <div className="p-2.5 bg-[#241917] text-[#EDE8E0] border border-[#3E2E2A] space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[13px] text-[#FFB4A4]">auto_awesome</span>
                <span className="font-label-serif-caps text-[8.5px] font-bold text-[#FFB4A4] uppercase tracking-wider">
                  GEMINI DECISION DIRECTIVE &amp; PRE-LANDFALL ACTIONS
                </span>
              </div>
              <ol className="list-decimal list-inside text-[10px] text-[#dec0b9] space-y-1 leading-snug">
                <li>Immediate activation of alternate inland bypass Route R-4 via Chandbali high embankment road.</li>
                <li>Pre-position NDRF amphibious evacuation units (Battalion 03) at coordinates 20.82°N, 86.74°E before T-18H.</li>
                <li>Dispatch 2x high-capacity mobile dewatering pump units to Sector 7 culvert before T-24H.</li>
                <li>Air-lift emergency medical O2 cylinder reserves to 96-hour buffer via coastal staging point.</li>
              </ol>
            </div>
          </div>

          <div className="p-3 border-t border-[#D8D2C5] bg-[#EFECE3]">
            <button
              onClick={() => setActiveTab('ai-impact-analyst')}
              className="w-full py-2 bg-[#B74A32] hover:bg-[#97331D] text-white font-label-serif-caps text-[10.5px] font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            >
              <span className="material-symbols-outlined text-[14px]">neurology</span>
              <span>ANALYZE WITH AI IMPACT ANALYST</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};
