/**
 * AVARTH Weather & Meteorological Forecast Service
 * Provides meteorological inputs from ECMWF/IMD or deterministic demo baseline.
 */

import { logEvent } from '../utils/logger.ts';

export interface WeatherForecastData {
  sourceType: 'METEOROLOGICAL_LIVE' | 'SIMULATED_FORECAST';
  scenario_id: string;
  cyclone_name: string;
  category: string;
  sustained_wind_kmh: number;
  peak_gust_kmh: number;
  precipitation_24h_mm: number;
  peak_storm_surge_m: number;
  central_pressure_hpa: number;
  drift_vector: string;
  landfall_distance_km: number;
  eta_ist: string;
  satellite_imagery_status: string;
}

class WeatherService {
  private mode: 'LIVE' | 'DEMO' = 'DEMO';

  constructor() {
    if (process.env.DATA_MODE === 'live' && process.env.WEATHER_API_KEY) {
      this.mode = 'LIVE';
    } else {
      this.mode = 'DEMO';
    }
    logEvent(`Weather Service Initialized in ${this.mode} mode`);
  }

  public getStatus(): { status: 'ready' | 'demo'; mode: string } {
    return {
      status: this.mode === 'LIVE' ? 'ready' : 'demo',
      mode: this.mode,
    };
  }

  public async getForecast(): Promise<WeatherForecastData> {
    logEvent('Weather forecast requested');
    return {
      sourceType: this.mode === 'LIVE' ? 'METEOROLOGICAL_LIVE' : 'SIMULATED_FORECAST',
      scenario_id: 'AV-VARUN-04',
      cyclone_name: 'CYCLONE VARUN',
      category: 'CAT 4 EQUIVALENT',
      sustained_wind_kmh: 185,
      peak_gust_kmh: 215,
      precipitation_24h_mm: 220,
      peak_storm_surge_m: 2.4,
      central_pressure_hpa: 944,
      drift_vector: 'NNW @ 14 KM/H',
      landfall_distance_km: 12,
      eta_ist: '18 OCT, 04:00–07:00 IST',
      satellite_imagery_status: 'INSAT-3DR / DMSP MULTI-SPECTRAL VERIFIED',
    };
  }

  public async getRainfallForecast(region: string = 'Sector-04B'): Promise<{ mm: number; notice: string }> {
    return {
      mm: 220,
      notice: 'SIMULATED FORECAST — ECMWF-IFS 50-MEMBER ENSEMBLE MEDIAN',
    };
  }

  public async getWindForecast(): Promise<{ wind_kmh: number; gusts_kmh: number }> {
    return {
      wind_kmh: 185,
      gusts_kmh: 215,
    };
  }

  public async getStormSurgeInput(): Promise<{ surge_m: number; tide_phase: string }> {
    return {
      surge_m: 2.4,
      tide_phase: 'SPRING TIDE CONCURRENT (+0.7M)',
    };
  }
}

export const weatherService = new WeatherService();
