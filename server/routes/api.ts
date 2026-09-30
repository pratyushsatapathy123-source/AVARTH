/**
 * AVARTH REST API Routes Router
 */

import { Router, Request, Response } from 'express';
import { riskEngine } from '../services/riskEngine.ts';
import { simulationEngine } from '../services/simulationEngine.ts';
import { infrastructureService } from '../services/infrastructureService.ts';
import { earthEngineService } from '../services/earthEngineService.ts';
import { weatherService } from '../services/weatherService.ts';
import { meteorologicalService } from '../services/meteorologicalService.ts';
import { dataOrchestrator } from '../services/dataOrchestrator.ts';
import { geminiService } from '../services/geminiService.ts';
import { advisoryService } from '../services/advisoryService.ts';
import { alertService } from '../services/alertService.ts';
import { FORECAST_TIMELINE } from '../data/demoData.ts';
import { DEMO_AOI, DATA_ATTRIBUTIONS } from '../config/geoConfig.ts';
import { geminiClient } from '../ai/geminiClient.ts';

const router = Router();

/**
 * GET /api/health
 */
router.get('/health', async (_req: Request, res: Response) => {
  const eeStatus = earthEngineService.getStatus();
  const weatherStatus = meteorologicalService.getStatus();

  res.json({
    status: 'operational',
    services: {
      gemini: geminiClient ? 'ready' : 'unavailable',
      earthEngine: eeStatus.connected ? 'live' : (eeStatus.mode === 'DEMO' ? 'demo' : 'unavailable'),
      meteorology: weatherStatus.status === 'live' ? 'live' : 'demo',
      riskEngine: 'ready',
      firestore: 'ready (in-memory persistent store)',
    },
    mode: eeStatus.mode,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/earth-engine/status & /api/earthengine/status
 */
const handleEarthEngineStatus = (_req: Request, res: Response) => {
  const status = earthEngineService.getStatus();
  res.json({
    connected: status.connected,
    mode: status.connected ? 'LIVE' : (status.mode === 'DEMO' ? 'DEMO' : 'UNAVAILABLE'),
    project: status.projectId || process.env.EARTH_ENGINE_PROJECT || 'none',
    error: status.error,
  });
};
router.get('/earth-engine/status', handleEarthEngineStatus);
router.get('/earthengine/status', handleEarthEngineStatus);

/**
 * GET /api/earth-engine/test
 * Diagnostic test on predefined AVARTH AOI
 */
router.get('/earth-engine/test', async (_req: Request, res: Response) => {
  const eeStatus = earthEngineService.getStatus();
  try {
    const elev = await earthEngineService.getElevationStats(DEMO_AOI);
    const lc = await earthEngineService.getLandCoverStats(DEMO_AOI);
    const met = await meteorologicalService.getForecast(DEMO_AOI, 0);

    res.json({
      earthEngine: eeStatus.connected ? 'PASS' : (eeStatus.mode === 'DEMO' ? 'PASS (DEMO FALLBACK)' : 'FAIL'),
      elevation: elev.meanM !== undefined ? 'PASS' : 'FAIL',
      landCover: lc.builtUpFraction !== undefined ? 'PASS' : 'FAIL',
      meteorology: met.wind?.speedKmh !== undefined ? 'PASS' : 'FAIL',
    });
  } catch (err) {
    res.status(500).json({
      earthEngine: 'FAIL',
      elevation: 'FAIL',
      landCover: 'FAIL',
      meteorology: 'FAIL',
      error: err instanceof Error ? err.message : String(err),
    });
  }
});

/**
 * GET /api/environment/context
 * Ingests SRTM elevation and Dynamic World land cover for the AOI
 */
router.get('/environment/context', async (req: Request, res: Response) => {
  try {
    const forecastTime = (req.query.forecastTime as string) || 'T-36H';
    const context = await earthEngineService.getEnvironmentalContext(DEMO_AOI, forecastTime);
    res.json(context);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Environmental query failed';
    res.status(500).json({ error: message, mode: 'DEMO' });
  }
});

/**
 * GET /api/weather/forecast
 * Ingests ECMWF atmospheric forecast or deterministic demo baseline
 */
router.get('/weather/forecast', async (req: Request, res: Response) => {
  try {
    const forecastHour = Number(req.query.forecastHour ?? 0);
    const forecast = await meteorologicalService.getForecast(DEMO_AOI, forecastHour);
    res.json(forecast);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Weather forecast query failed';
    res.status(500).json({ error: message, mode: 'DEMO' });
  }
});

/**
 * GET /api/map/environmental-layers
 * Normalized map layer telemetry metadata
 */
router.get('/map/environmental-layers', async (_req: Request, res: Response) => {
  const eeStatus = earthEngineService.getStatus();
  const weatherStatus = meteorologicalService.getStatus();
  const now = new Date().toISOString();

  res.json([
    {
      layer: 'rainfall',
      source: weatherStatus.status === 'live' ? 'ECMWF/NRT_FORECAST/IFS/OPER' : 'ECMWF (Simulated Median)',
      mode: weatherStatus.mode,
      updatedAt: now,
      available: true,
      description: '0.25° Total Precipitation Surface & Rate',
    },
    {
      layer: 'elevation',
      source: eeStatus.connected ? 'USGS/SRTMGL1_003 (Earth Engine)' : 'SRTM 30m Global DEM (Baseline)',
      mode: eeStatus.mode,
      updatedAt: now,
      available: true,
      description: 'Terrain Elevation & Low-Lying Coastal Exposure',
    },
    {
      layer: 'landCover',
      source: eeStatus.connected ? 'GOOGLE/DYNAMICWORLD/V1 (Earth Engine)' : 'Dynamic World 10m NRT (Estuary Baseline)',
      mode: eeStatus.mode,
      updatedAt: now,
      available: true,
      description: 'Built-up Infrastructure Proxy, Water Channels, Vegetation',
    },
    {
      layer: 'floodSusceptibility',
      source: 'AVARTH Model (Rapid Flood Susceptibility)',
      mode: 'PROTOTYPE_MODEL',
      updatedAt: now,
      available: true,
      description: 'Terrain-Hydrological Composite Screening Index (0–100)',
    },
    {
      layer: 'stormSurge',
      source: 'Scenario Surge Potential Model',
      mode: 'SIMULATED',
      updatedAt: now,
      available: true,
      description: 'Tidal-surge boundary coupling & inundation pressure',
    },
  ]);
});

/**
 * GET /api/scenario/orchestrated
 * Returns multi-source ingested scenario data
 */
router.get('/scenario/orchestrated', async (req: Request, res: Response) => {
  try {
    const data = await dataOrchestrator.getScenarioData(req.query);
    res.json(data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Orchestration failed';
    res.status(500).json({ error: message });
  }
});

/**
 * GET /api/attributions
 * Returns data provider attributions
 */
router.get('/attributions', (_req: Request, res: Response) => {
  res.json({
    aoi: DEMO_AOI,
    attributions: DATA_ATTRIBUTIONS,
  });
});

/**
 * GET /api/scenario & GET /api/scenario/active
 */
const handleGetScenario = (_req: Request, res: Response) => {
  const scenario = riskEngine.getCurrentScenario();
  res.json({
    scenario,
    data_mode: 'demo',
    label: 'SIMULATED SCENARIO',
    notice: 'Prototype decision-support matrix. Not an official warning.',
  });
};
router.get('/scenario', handleGetScenario);
router.get('/scenario/active', handleGetScenario);

/**
 * POST /api/scenario/reset
 */
router.post('/scenario/reset', (_req: Request, res: Response) => {
  const resetScenario = riskEngine.resetToBaseline();
  res.json({
    success: true,
    scenario: resetScenario,
    message: 'Scenario reset to Cyclone Varun baseline (T-36H).',
  });
});

/**
 * POST /api/simulation/run
 */
router.post('/simulation/run', (req: Request, res: Response) => {
  const { wind_kmh, rainfall_mm, storm_surge_m, landfall_distance_km, forecast_hour } = req.body;

  if (wind_kmh === undefined || rainfall_mm === undefined || storm_surge_m === undefined) {
    res.status(400).json({ error: 'Missing simulation inputs: wind_kmh, rainfall_mm, storm_surge_m are required.' });
    return;
  }

  const result = simulationEngine.runSimulation({
    wind_kmh: Number(wind_kmh),
    rainfall_mm: Number(rainfall_mm),
    storm_surge_m: Number(storm_surge_m),
    landfall_distance_km: Number(landfall_distance_km ?? 12),
    forecast_hour: Number(forecast_hour ?? 36),
  });

  res.json(result);
});

/**
 * GET /api/forecast/timeline
 */
router.get('/forecast/timeline', async (_req: Request, res: Response) => {
  const weather = await weatherService.getForecast();
  res.json({
    timeline: FORECAST_TIMELINE,
    meta: {
      cyclone: weather.cyclone_name,
      category: weather.category,
      source: weather.sourceType,
    },
  });
});

/**
 * GET /api/map/layers
 */
router.get('/map/layers', async (_req: Request, res: Response) => {
  const scenario = riskEngine.getCurrentScenario();
  const infraGeoJSON = infrastructureService.toGeoJSON();
  const eeContext = await earthEngineService.getEnvironmentalContext(DEMO_AOI);

  res.json({
    cyclone_track: {
      trajectory_path: 'M850,560 C720,490 560,390 380,285',
      current_eye_pos: { x: 820, y: 540, lat: 19.8, lng: 87.2 },
      landfall_pos: { x: 380, y: 285, lat: 20.8, lng: 86.85 },
      drift_vector: scenario.drift,
    },
    forecast_cone: {
      path: 'M850,560 L380,285 L800,200 Z',
      confidence_interval_pct: 90,
    },
    rainfall_field: {
      peak_mm: scenario.rainfall_mm,
      isohyet_outer_rx: 210,
      isohyet_inner_rx: 140,
    },
    storm_surge: {
      height_m: scenario.storm_surge_m,
      polygon: 'M320,200 L440,225 L455,330 L360,345 L320,290 Z',
      tide_coupling: 'SPRING TIDE CONCURRENT (+0.7M)',
    },
    flood_susceptibility: {
      coverage_pct: scenario.flood_exposure,
      inundation_area_km2: scenario.inundation_area_km2,
      terrain_elevation_context: eeContext,
    },
    infrastructure: infraGeoJSON,
  });
});

/**
 * GET /api/zones
 */
router.get('/zones', (_req: Request, res: Response) => {
  res.json(riskEngine.getAllZones());
});

/**
 * GET /api/zones/:id
 */
router.get('/zones/:id', (req: Request, res: Response) => {
  const zone = riskEngine.getZoneDetails(req.params.id);
  if (!zone) {
    res.status(404).json({ error: `Zone not found: ${req.params.id}` });
    return;
  }
  res.json(zone);
});

/**
 * GET /api/infrastructure
 */
router.get('/infrastructure', (req: Request, res: Response) => {
  const { type, risk, zone, access, status, search } = req.query;
  const assets = infrastructureService.getAssets({
    type: type as string,
    risk: risk as string,
    zone: zone as string,
    access: access as string,
    status: status as string,
    search: search as string,
  });
  res.json(assets);
});

/**
 * GET /api/infrastructure/:id
 */
router.get('/infrastructure/:id', (req: Request, res: Response) => {
  const asset = infrastructureService.getAssetById(req.params.id);
  if (!asset) {
    res.status(404).json({ error: `Asset not found: ${req.params.id}` });
    return;
  }
  res.json(asset);
});

/**
 * GET /api/infrastructure/:id/location
 */
router.get('/infrastructure/:id/location', (req: Request, res: Response) => {
  const location = infrastructureService.getAssetLocation(req.params.id);
  if (!location) {
    res.status(404).json({ error: `Asset not found: ${req.params.id}` });
    return;
  }
  res.json(location);
});

/**
 * POST /api/ai/analyze
 */
router.post('/ai/analyze', async (req: Request, res: Response) => {
  try {
    const { question, scenario, zoneId, assetId, zone_id, asset_id } = req.body;
    if (!question) {
      res.status(400).json({ error: 'Question string is required' });
      return;
    }

    const result = await geminiService.analyzeImpact({
      question,
      scenario,
      zoneId: zoneId || zone_id,
      assetId: assetId || asset_id,
    });

    res.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown AI analysis failure';
    res.status(500).json({
      status: 'AI_UNAVAILABLE',
      message: 'Gemini analysis is temporarily unavailable.',
      error: message,
    });
  }
});

/**
 * POST /api/ai/advisory
 */
router.post('/ai/advisory', async (req: Request, res: Response) => {
  try {
    const { scenario, riskOutput, selectedZone, exposedInfrastructure, recommendations } = req.body;
    const advisory = await geminiService.generateAdvisory({
      scenario,
      riskOutput,
      selectedZone,
      exposedInfrastructure,
      recommendations,
    });
    res.json(advisory);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Advisory generation failed';
    res.status(500).json({
      status: 'AI_UNAVAILABLE',
      message: 'Gemini advisory generation is temporarily unavailable.',
      error: message,
    });
  }
});

/**
 * POST /api/advisory/generate
 */
router.post('/advisory/generate', (req: Request, res: Response) => {
  const { zone, scenario_id, custom_directives } = req.body;
  const advisory = advisoryService.generateAdvisory({
    zone,
    scenario_id,
    custom_directives,
  });
  res.json(advisory);
});

/**
 * GET /api/advisory/current
 */
router.get('/advisory/current', (_req: Request, res: Response) => {
  res.json(advisoryService.getCurrentAdvisory());
});

/**
 * POST /api/advisory/dispatch & POST /api/advisory/:id/dispatch
 */
const handleDispatch = (req: Request, res: Response) => {
  const id = req.params.id || req.body.id || 'SEOC/OD/VARUN-04/DIR-09';
  const recipients = req.body.recipients;
  const dispatchReceipt = advisoryService.simulateDispatch(id, recipients);
  res.json(dispatchReceipt);
};
router.post('/advisory/dispatch', handleDispatch);
router.post('/advisory/:id/dispatch', handleDispatch);

/**
 * GET /api/alerts
 */
router.get('/alerts', (_req: Request, res: Response) => {
  res.json(alertService.getAlerts());
});

/**
 * POST /api/alerts
 */
router.post('/alerts', (req: Request, res: Response) => {
  const { area, severity, trigger, risk_score, status } = req.body;
  if (!area || !severity || !trigger) {
    res.status(400).json({ error: 'Missing required alert fields: area, severity, trigger' });
    return;
  }
  const created = alertService.createAlert({
    area,
    severity,
    trigger,
    risk_score: risk_score || 75,
    status: status || 'ACTIVE',
  });
  res.status(201).json(created);
});

/**
 * PATCH /api/alerts/:id
 */
router.patch('/alerts/:id', (req: Request, res: Response) => {
  const updated = alertService.updateAlert(req.params.id, req.body);
  if (!updated) {
    res.status(404).json({ error: `Alert not found: ${req.params.id}` });
    return;
  }
  res.json(updated);
});

export default router;
