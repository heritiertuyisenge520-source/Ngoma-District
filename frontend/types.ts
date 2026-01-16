
export interface IndicatorTargets {
  q1: string | number;
  q2: string | number;
  q3: string | number;
  q4: string | number;
  annual: string | number;
}

export interface Indicator {
  id: string;
  name: string;
  inputLabel?: string;
  isDual?: boolean;
  targetLabel?: string;
  achievementLabel?: string;
  targets?: IndicatorTargets;
  subIndicatorIds?: Record<string, string>;
  measurementType?: 'cumulative' | 'percentage' | 'decreasing';
}

export interface Output {
  id: string;
  name: string;
  indicators: Indicator[];
}

export interface Pillar {
  id: string;
  name: string;
  outputs: Output[];
}

export interface Quarter {
  id: string;
  name: string;
  months: string[];
}

export interface MonitoringEntry {
  _id?: string;
  pillarId: string;
  pillarName?: string;
  outputId: string;
  indicatorId: string;
  indicatorName?: string;
  quarterId: string;
  month: string;
  value: number; // Achievement
  targetValue?: number; // Target (optional)
  subValues?: Record<string, number>;
  comments: string;
  submittedBy?: string;
  timestamp: string;
}
