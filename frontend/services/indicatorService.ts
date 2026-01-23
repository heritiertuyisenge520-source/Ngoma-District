import { authGet } from '../utils/authFetch';
import { API_ENDPOINTS } from '../config/api';

export interface Indicator {
  id: string;
  name: string;
  pillarId: string;
  pillarName?: string;
  outputId?: string;
  outputName?: string;
  isDual?: boolean;
  measurementType?: 'cumulative' | 'percentage' | 'decreasing';
  targets: {
    q1: string | number;
    q2: string | number;
    q3: string | number;
    q4: string | number;
    annual: string | number;
  };
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
  order?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Pillar {
  id: string;
  name: string;
  outputs: Array<{
    id: string;
    name: string;
    indicators: Indicator[];
  }>;
}

// Fetch all indicators from database
export const fetchIndicators = async (): Promise<Indicator[]> => {
  try {
    const response = await authGet(API_ENDPOINTS.INDICATORS);
    if (response.ok) {
      const indicators = await response.json();
      return indicators;
    }
    throw new Error('Failed to fetch indicators');
  } catch (error) {
    console.error('Error fetching indicators from database:', error);
    // Fallback to empty array or handle error as needed
    return [];
  }
};

// Fetch pillars with grouped indicators from database
export const fetchPillars = async (): Promise<Pillar[]> => {
  try {
    const response = await authGet(API_ENDPOINTS.PILLARS);
    if (response.ok) {
      const pillars = await response.json();
      return pillars;
    }
    throw new Error('Failed to fetch pillars');
  } catch (error) {
    console.error('Error fetching pillars from database:', error);
    // Fallback to empty array or handle error as needed
    return [];
  }
};

// Get indicator by ID from database
export const getIndicatorById = async (id: string): Promise<Indicator | null> => {
  try {
    const indicators = await fetchIndicators();
    return indicators.find(ind => ind.id === id) || null;
  } catch (error) {
    console.error('Error getting indicator by ID:', error);
    return null;
  }
};

// Get indicators by pillar from database
export const getIndicatorsByPillar = async (pillarId: string): Promise<Indicator[]> => {
  try {
    const indicators = await fetchIndicators();
    return indicators.filter(ind => ind.pillarId === pillarId);
  } catch (error) {
    console.error('Error getting indicators by pillar:', error);
    return [];
  }
};
