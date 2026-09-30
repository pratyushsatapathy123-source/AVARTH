/**
 * AVARTH Environmental Data Provider Interface
 * Unified contract for Earth Engine and Demo Environmental data layers.
 */

import { AOIGeometry } from '../config/geoConfig.ts';

export interface ElevationStats {
  meanM: number;
  minM: number;
  maxM: number;
}

export interface LandCoverStats {
  builtUpFraction: number;
  waterFraction: number;
  vegetationFraction: number;
}

export interface EnvironmentalContextResult {
  mode: 'LIVE' | 'DEMO';
  elevation: ElevationStats;
  landCover: LandCoverStats;
  dataSources: string[];
  timestamp: string;
  aoiName?: string;
  satelliteContext?: {
    platform: string;
    radarBackscatterDeltaDb?: number;
    sceneDate?: string;
    status: string;
  };
}

export interface EnvironmentalDataProvider {
  readonly name: string;
  readonly mode: 'LIVE' | 'DEMO';

  /**
   * Retrieves unified elevation and land-cover context for the given AOI.
   */
  getEnvironmentalContext(
    aoi: AOIGeometry,
    forecastTime?: string
  ): Promise<EnvironmentalContextResult>;

  /**
   * Retrieves SRTM terrain elevation statistics.
   */
  getElevationStats(aoi: AOIGeometry): Promise<ElevationStats>;

  /**
   * Retrieves Dynamic World land-cover fractions.
   */
  getLandCoverStats(aoi: AOIGeometry): Promise<LandCoverStats>;
}
