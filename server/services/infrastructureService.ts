/**
 * AVARTH Infrastructure Service
 * Manages critical infrastructure assets, GeoJSON mapping, vulnerability dossiers, and filters.
 */

import { DEMO_INFRASTRUCTURE } from '../data/demoData.ts';
import { InfrastructureAsset } from '../models/types.ts';
import { evaluateAssetRisk } from '../engine/riskCalculation.ts';

class InfrastructureService {
  private assets: InfrastructureAsset[] = [];

  constructor() {
    this.resetToBaseline();
  }

  public resetToBaseline() {
    this.assets = JSON.parse(JSON.stringify(DEMO_INFRASTRUCTURE));
  }

  public getAssets(filters?: {
    type?: string;
    risk?: string;
    zone?: string;
    access?: string;
    status?: string;
    search?: string;
  }): InfrastructureAsset[] {
    let result = [...this.assets];

    if (!filters) return result;

    if (filters.type && filters.type !== 'ALL') {
      result = result.filter(a => a.type.toLowerCase() === filters.type!.toLowerCase());
    }

    if (filters.risk) {
      result = result.filter(a => a.risk_level.toLowerCase() === filters.risk!.toLowerCase());
    }

    if (filters.zone) {
      result = result.filter(a => a.zone.toLowerCase().includes(filters.zone!.toLowerCase()));
    }

    if (filters.access) {
      result = result.filter(a => a.access_risk.toLowerCase().includes(filters.access!.toLowerCase()));
    }

    if (filters.status) {
      result = result.filter(a => a.status.toLowerCase().includes(filters.status!.toLowerCase()));
    }

    if (filters.search) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        a =>
          a.name.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          (a.sub_zone && a.sub_zone.toLowerCase().includes(q))
      );
    }

    return result;
  }

  public getAssetById(id: string): InfrastructureAsset | undefined {
    return this.assets.find(a => a.id.toLowerCase() === id.toLowerCase());
  }

  public getAssetLocation(id: string): { id: string; name: string; coordinates: [number, number]; svg_pos: { x: number; y: number } } | undefined {
    const asset = this.getAssetById(id);
    if (!asset) return undefined;
    return {
      id: asset.id,
      name: asset.name,
      coordinates: asset.coordinates,
      svg_pos: asset.svg_pos,
    };
  }

  /**
   * Updates all infrastructure risk ratings based on a simulated or updated scenario
   */
  public updateForScenario(scenario: {
    wind_kmh: number;
    rainfall_mm: number;
    storm_surge_m: number;
    landfall_dist_km: number;
  }): InfrastructureAsset[] {
    this.assets = this.assets.map(asset => {
      const evaluated = evaluateAssetRisk(asset, scenario);
      return {
        ...asset,
        risk_score: evaluated.risk_score,
        risk_level: evaluated.risk_level,
        status: evaluated.status,
        is_newly_exposed: evaluated.is_newly_exposed,
      };
    });
    return this.assets;
  }

  /**
   * Generates standard GeoJSON FeatureCollection
   */
  public toGeoJSON() {
    return {
      type: 'FeatureCollection',
      features: this.assets.map(asset => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: asset.coordinates,
        },
        properties: {
          id: asset.id,
          name: asset.name,
          type: asset.type,
          criticality: asset.criticality,
          zone: asset.zone,
          risk_score: asset.risk_score,
          risk_level: asset.risk_level,
          status: asset.status,
          elevation_m: asset.elevation_m,
          dist_to_surge_m: asset.dist_to_surge_m,
          is_newly_exposed: !!asset.is_newly_exposed,
        },
      })),
    };
  }
}

export const infrastructureService = new InfrastructureService();
