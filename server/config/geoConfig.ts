/**
 * AVARTH Geographic & Forecast Configuration
 * Defines explicit Area of Interest (AOI) geometry and prototype forecast-horizon mappings.
 *
 * Primary region: BAY OF BENGAL / SECTOR-04 (Dhamra-Paradip Estuary Coastal Tract, Odisha, India)
 */

export interface AOIGeometry {
  id: string;
  name: string;
  regionCode: string;
  center: { lat: number; lng: number };
  bbox: {
    minLng: number;
    minLat: number;
    maxLng: number;
    maxLat: number;
  };
  /** GeoJSON Polygon coordinates [lng, lat] */
  polygon: number[][][];
  description: string;
}

export const DEMO_AOI: AOIGeometry = {
  id: 'aoi-bob-sector04',
  name: 'BAY OF BENGAL / SECTOR-04',
  regionCode: 'IND-OD-SECTOR04',
  center: { lat: 20.816, lng: 86.822 },
  bbox: {
    minLng: 86.60,
    minLat: 20.60,
    maxLng: 87.15,
    maxLat: 21.05,
  },
  polygon: [
    [
      [86.60, 20.60],
      [87.15, 20.60],
      [87.15, 21.05],
      [86.60, 21.05],
      [86.60, 20.60],
    ],
  ],
  description: 'Dhamra-Paradip Estuary and coastal arterial corridor',
};

/**
 * Prototype Forecast Horizon Mappings
 *
 * Maps timeline steps to actual forecast-hour offsets.
 * NOTE: These are prototype forecast-horizon mappings for tactical simulation.
 * They do not imply certified official timestamps unless linked to an active storm track.
 */
export interface ForecastHorizonConfig {
  stepId: string;
  label: string;
  forecastHour: number;
  offsetHoursFromLandfall: number;
  operationalPhase: string;
}

export const FORECAST_HORIZON_MAP: Record<string, ForecastHorizonConfig> = {
  'T-36H': {
    stepId: 'T-36H',
    label: 'T-36H NOW',
    forecastHour: 0,
    offsetHoursFromLandfall: -36,
    operationalPhase: 'PRE-LANDFALL PREPARATION & STAGING',
  },
  'T-24H': {
    stepId: 'T-24H',
    label: 'T-24H',
    forecastHour: 12,
    offsetHoursFromLandfall: -24,
    operationalPhase: 'EVACUATION & CORRIDOR HARDENING',
  },
  'T-12H': {
    stepId: 'T-12H',
    label: 'T-12H',
    forecastHour: 24,
    offsetHoursFromLandfall: -12,
    operationalPhase: 'SHELTER LOCKDOWN & CREW STANDBY',
  },
  'LANDFALL': {
    stepId: 'LANDFALL',
    label: 'LANDFALL',
    forecastHour: 36,
    offsetHoursFromLandfall: 0,
    operationalPhase: 'PEAK HAZARD / SURGE COINCIDENCE',
  },
  'T+6H': {
    stepId: 'T+6H',
    label: 'T+6H POST-LANDFALL',
    forecastHour: 42,
    offsetHoursFromLandfall: 6,
    operationalPhase: 'DAMAGE ASSESSMENT & RAPID RELIEF',
  },
};

/**
 * Official Data Attributions
 */
export const DATA_ATTRIBUTIONS = [
  {
    dataset: 'ECMWF IFS Atmospheric Forecast',
    provider: 'European Centre for Medium-Range Weather Forecasts (ECMWF)',
    catalogId: 'ECMWF/NRT_FORECAST/IFS/OPER',
    resolution: '0.25° (~28 km) Atmospheric Grid',
    purpose: 'Precipitation, 10m U/V Wind, Atmospheric Pressure',
  },
  {
    dataset: 'Dynamic World 10m NRT Land Cover',
    provider: 'World Resources Institute (WRI) & Google Earth Engine',
    catalogId: 'GOOGLE/DYNAMICWORLD/V1',
    resolution: '10m Sentinel-2 Derived Surface Cover',
    purpose: 'Built-up Infrastructure Proxy, Water/Wetlands, Vegetation Ratio',
  },
  {
    dataset: 'SRTM 30m Global Digital Elevation Model',
    provider: 'NASA / USGS / CGIAR via Google Earth Engine',
    catalogId: 'USGS/SRTMGL1_003',
    resolution: '30m (1 Arc-Second) Terrain Elevation',
    purpose: 'Low-Lying Estuary Exposure, Mean/Min/Max Elevation',
  },
  {
    dataset: 'Copernicus Sentinel Constellation',
    provider: 'European Space Agency (ESA) & European Commission',
    catalogId: 'COPERNICUS/S1_GRD & COPERNICUS/S2_SR_HARMONIZED',
    resolution: '10–20m Radar & Optical Sensor Suite',
    purpose: 'SAR Inundation Penetration & Multi-Spectral Ground Validation',
  },
];
