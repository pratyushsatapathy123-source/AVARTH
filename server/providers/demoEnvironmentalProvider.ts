/**
 * AVARTH Demo Environmental Data Provider
 * Provides deterministic environmental context when live Earth Engine credentials are unavailable.
 * Calibrated to the Bay of Bengal / Sector-04 (Dhamra-Paradip Estuary, Odisha) coastal landscape.
 */

import { AOIGeometry, DEMO_AOI } from '../config/geoConfig.ts';
import {
  EnvironmentalDataProvider,
  EnvironmentalContextResult,
  ElevationStats,
  LandCoverStats,
} from './environmentalDataProvider.ts';

export class DemoEnvironmentalProvider implements EnvironmentalDataProvider {
  public readonly name = 'DemoEnvironmentalProvider';
  public readonly mode = 'DEMO' as const;

  public async getEnvironmentalContext(
    aoi: AOIGeometry = DEMO_AOI,
    _forecastTime?: string
  ): Promise<EnvironmentalContextResult> {
    const elevation = await this.getElevationStats(aoi);
    const landCover = await this.getLandCoverStats(aoi);

    return {
      mode: 'DEMO',
      elevation,
      landCover,
      dataSources: [
        'Earth Engine (Demo Baseline)',
        'Dynamic World (Estuary Calibration)',
        'SRTM 30m Global DEM',
      ],
      timestamp: new Date().toISOString(),
      aoiName: aoi.name,
      satelliteContext: {
        platform: 'Sentinel-1A SAR (Simulated Synthetic)',
        radarBackscatterDeltaDb: -3.8,
        sceneDate: '2026-09-30 06:14 UTC',
        status: 'RADAR FLOOD SIGNATURE VALIDATED',
      },
    };
  }

  public async getElevationStats(_aoi: AOIGeometry = DEMO_AOI): Promise<ElevationStats> {
    // Coastal estuary terrain: mean 2.1m, low tide mudflats 0.3m, coastal barrier dunes 6.8m
    return {
      meanM: 2.1,
      minM: 0.3,
      maxM: 6.8,
    };
  }

  public async getLandCoverStats(_aoi: AOIGeometry = DEMO_AOI): Promise<LandCoverStats> {
    // Coastal estuary composition: 38% water/wetlands/river channels, 48% mangroves/cropland/vegetation, 14% built-up/arterial
    return {
      builtUpFraction: 0.14,
      waterFraction: 0.38,
      vegetationFraction: 0.48,
    };
  }
}

export const demoEnvironmentalProvider = new DemoEnvironmentalProvider();
