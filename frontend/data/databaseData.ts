import { Pillar, fetchPillars } from '../services/indicatorService';

// Cache for pillars data
let cachedPillars: Pillar[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export const getPillarsFromDatabase = async (): Promise<Pillar[]> => {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedPillars && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedPillars;
  }

  try {
    const pillars = await fetchPillars();
    cachedPillars = pillars;
    lastFetchTime = now;
    return pillars;
  } catch (error) {
    console.error('Error fetching pillars from database:', error);
    // Return empty array as fallback
    return [];
  }
};

export const getIndicatorsFromDatabase = async () => {
  const pillars = await getPillarsFromDatabase();
  const allIndicators: any[] = [];
  
  pillars.forEach(pillar => {
    pillar.outputs.forEach(output => {
      output.indicators.forEach(indicator => {
        allIndicators.push(indicator);
      });
    });
  });
  
  return allIndicators;
};

// Export functions that match the original data.ts structure
export const PILLARS = await getPillarsFromDatabase();
export const INDICATORS = await getIndicatorsFromDatabase();
