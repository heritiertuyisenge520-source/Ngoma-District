import { API_ENDPOINTS, getIndicatorsByPillarUrl } from '../config/api';
import { authGet } from './authFetch';

export interface Indicator {
  id: string;
  name: string;
  pillarId: string;
  measurementType?: 'cumulative' | 'percentage';
  targets: {
    q1: string | number;
    q2: string | number;
    q3: string | number;
    q4: string | number;
    annual: string | number;
  };
  isDual?: boolean;
  subIndicators?: Array<{
    key: string;
    name: string;
    targets: {
      q1: string | number;
      q2: string | number;
      q3: string | number;
      q4: string | number;
      annual: string | number;
    };
  }>;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

// Fetch all indicators from database
export const fetchIndicators = async (): Promise<Indicator[]> => {
  try {
    const response = await authGet(API_ENDPOINTS.INDICATORS);
    if (!response.ok) {
      throw new Error('Failed to fetch indicators');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching indicators:', error);
    throw error;
  }
};

// Fetch indicators by pillar from database
export const fetchIndicatorsByPillar = async (pillarId: string): Promise<Indicator[]> => {
  try {
    const response = await authGet(getIndicatorsByPillarUrl(pillarId));
    if (!response.ok) {
      throw new Error('Failed to fetch indicators by pillar');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching indicators by pillar:', error);
    throw error;
  }
};

// Cache indicators to avoid repeated API calls
let indicatorsCache: Indicator[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getIndicators = async (forceRefresh = false): Promise<Indicator[]> => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && indicatorsCache && (now - lastFetchTime) < CACHE_DURATION) {
    return indicatorsCache;
  }
  
  // Fetch fresh data
  const indicators = await fetchIndicators();
  indicatorsCache = indicators;
  lastFetchTime = now;
  
  return indicators;
};

export const getIndicatorsByPillar = async (pillarId: string, forceRefresh = false): Promise<Indicator[]> => {
  const now = Date.now();
  
  // Return cached data if still valid and not forcing refresh
  if (!forceRefresh && indicatorsCache && (now - lastFetchTime) < CACHE_DURATION) {
    return indicatorsCache.filter(indicator => indicator.pillarId === pillarId);
  }
  
  // Fetch fresh data for this pillar
  return await fetchIndicatorsByPillar(pillarId);
};

// Clear cache (useful after updates)
export const clearIndicatorsCache = () => {
  indicatorsCache = null;
  lastFetchTime = 0;
};
