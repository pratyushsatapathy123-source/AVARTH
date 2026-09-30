/**
 * AVARTH Earth Engine Integration Service
 * Manages Earth Engine client lifecycle, single-time startup authentication,
 * in-memory query caching, and seamless fallback to DemoEnvironmentalProvider.
 */

// @ts-ignore - CommonJS module without native ESM declaration
import ee from '@google/earthengine';
import { AOIGeometry, DEMO_AOI } from '../config/geoConfig.ts';
import {
  EnvironmentalDataProvider,
  EnvironmentalContextResult,
  ElevationStats,
  LandCoverStats,
} from '../providers/environmentalDataProvider.ts';
import { demoEnvironmentalProvider } from '../providers/demoEnvironmentalProvider.ts';
import { EarthEngineProvider } from '../providers/earthEngineProvider.ts';
import { logEvent, logError } from '../utils/logger.ts';

export interface EarthEngineServiceState {
  connected: boolean;
  mode: 'LIVE' | 'DEMO';
  projectId: string | null;
  error: string | null;
}

interface CacheEntry<T> {
  timestamp: number;
  data: T;
}

export class EarthEngineService {
  private state: EarthEngineServiceState = {
    connected: false,
    mode: 'DEMO',
    projectId: null,
    error: null,
  };

  private provider: EnvironmentalDataProvider = demoEnvironmentalProvider;
  private eeProvider: EarthEngineProvider = new EarthEngineProvider(false);
  private queryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL
  private isInitialized = false;

  constructor() {
    this.init();
  }

  /**
   * Single initialization path attempted once at application startup.
   * Never blocks or crashes the app if credentials are missing or invalid.
   */
  public init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    const dataMode = (process.env.DATA_MODE || 'demo').toLowerCase().trim();
    const projectId = process.env.EARTH_ENGINE_PROJECT || process.env.GOOGLE_CLOUD_PROJECT || null;

    if (dataMode !== 'live') {
      this.state = {
        connected: false,
        mode: 'DEMO',
        projectId,
        error: null,
      };
      this.provider = demoEnvironmentalProvider;
      logEvent('EARTH ENGINE: Initialized in DEMO mode (DATA_MODE=demo)');
      return;
    }

    // DATA_MODE=live requested, attempt authentication
    try {
      const privateKeyRaw = process.env.GEE_PRIVATE_KEY || process.env.EARTH_ENGINE_PRIVATE_KEY;
      const serviceAccountEmail = process.env.GEE_SERVICE_ACCOUNT_EMAIL || process.env.EARTH_ENGINE_SERVICE_ACCOUNT;

      if (privateKeyRaw && serviceAccountEmail) {
        logEvent('EARTH ENGINE: Attempting service account authentication...');
        let privateKey = privateKeyRaw;
        // Handle JSON string or raw key
        try {
          if (privateKeyRaw.trim().startsWith('{')) {
            const parsed = JSON.parse(privateKeyRaw);
            privateKey = parsed.private_key || privateKeyRaw;
          }
        } catch {
          // Keep raw
        }

        ee.data.authenticateViaPrivateKey(
          {
            client_email: serviceAccountEmail,
            private_key: privateKey,
          },
          () => {
            ee.initialize(
              null,
              null,
              () => {
                this.state = {
                  connected: true,
                  mode: 'LIVE',
                  projectId,
                  error: null,
                };
                this.eeProvider.setInitialized(true);
                this.provider = this.eeProvider;
                logEvent('EARTH ENGINE: Live authentication successful', { projectId });
              },
              (initErr: any) => {
                this.handleAuthFailure('Initialization callback failed', initErr);
              },
              projectId
            );
          },
          (authErr: any) => {
            this.handleAuthFailure('Service account authentication failed', authErr);
          }
        );
      } else {
        // Attempt ADC (Application Default Credentials)
        logEvent('EARTH ENGINE: Attempting ADC / default project initialization...');
        ee.initialize(
          null,
          null,
          () => {
            this.state = {
              connected: true,
              mode: 'LIVE',
              projectId,
              error: null,
            };
            this.eeProvider.setInitialized(true);
            this.provider = this.eeProvider;
            logEvent('EARTH ENGINE: ADC Live initialization successful', { projectId });
          },
          (adcErr: any) => {
            this.handleAuthFailure('ADC initialization not available', adcErr);
          },
          projectId
        );
      }
    } catch (err: any) {
      this.handleAuthFailure('Fatal exception during EE startup', err);
    }
  }

  private handleAuthFailure(reason: string, err: any) {
    const errorMsg = err?.message || String(err);
    this.state = {
      connected: false,
      mode: 'DEMO',
      projectId: process.env.EARTH_ENGINE_PROJECT || null,
      error: `Earth Engine live unavailable: ${reason} (${errorMsg})`,
    };
    this.provider = demoEnvironmentalProvider;
    this.eeProvider.setInitialized(false);
    logEvent(`EARTH ENGINE UNAVAILABLE (${reason}) -> Switched to DEMO ENVIRONMENTAL DATA`, { error: errorMsg });
  }

  public getStatus(): EarthEngineServiceState {
    return { ...this.state };
  }

  /**
   * Cached environmental context query
   */
  public async getEnvironmentalContext(
    aoi: AOIGeometry = DEMO_AOI,
    forecastTime: string = 'T-36H'
  ): Promise<EnvironmentalContextResult> {
    const cacheKey = `env_context_${aoi.id}_${forecastTime}_${this.state.mode}`;
    const cached = this.getFromCache<EnvironmentalContextResult>(cacheKey);
    if (cached) return cached;

    try {
      const result = await this.provider.getEnvironmentalContext(aoi, forecastTime);
      this.setCache(cacheKey, result);
      return result;
    } catch (err) {
      logError('getEnvironmentalContext failed, returning demo fallback', err);
      return demoEnvironmentalProvider.getEnvironmentalContext(aoi, forecastTime);
    }
  }

  public async getElevationStats(aoi: AOIGeometry = DEMO_AOI): Promise<ElevationStats> {
    const cacheKey = `elevation_${aoi.id}_${this.state.mode}`;
    const cached = this.getFromCache<ElevationStats>(cacheKey);
    if (cached) return cached;

    const result = await this.provider.getElevationStats(aoi);
    this.setCache(cacheKey, result);
    return result;
  }

  public async getLandCoverStats(aoi: AOIGeometry = DEMO_AOI): Promise<LandCoverStats> {
    const cacheKey = `landcover_${aoi.id}_${this.state.mode}`;
    const cached = this.getFromCache<LandCoverStats>(cacheKey);
    if (cached) return cached;

    const result = await this.provider.getLandCoverStats(aoi);
    this.setCache(cacheKey, result);
    return result;
  }

  private getFromCache<T>(key: string): T | null {
    const entry = this.queryCache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.CACHE_TTL_MS) {
      this.queryCache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    this.queryCache.set(key, { timestamp: Date.now(), data });
  }
}

export const earthEngineService = new EarthEngineService();
