import { SubmissionModel } from '../models';

interface QuarterlyProgress {
  q1: { actual: number; target: number; percentage: number };
  q2: { actual: number; target: number; percentage: number };
  q3: { actual: number; target: number; percentage: number };
  q4: { actual: number; target: number; percentage: number };
}

interface AnnualProgress {
  actual: number;
  target: number;
  percentage: number;
}

interface IndicatorProgress {
  indicatorId: string;
  indicatorName: string;
  pillarName: string;
  quarterlyProgress: QuarterlyProgress;
  annualProgress: AnnualProgress;
  status: 'completed' | 'on-track' | 'behind' | 'not-started';
}

/**
 * Calculate progress for a specific indicator
 */
export const calculateIndicatorProgress = async (
  indicatorId: string,
  indicatorName: string,
  pillarName: string,
  userEmail: string,
  indicatorTargets?: any
): Promise<IndicatorProgress> => {
  try {
    // Get all submissions for this indicator by the user
    const submissions = await SubmissionModel.find({
      indicatorId,
      submittedBy: userEmail
    }).sort({ timestamp: 1 });

    // Initialize quarterly progress
    const quarterlyProgress: QuarterlyProgress = {
      q1: { actual: 0, target: 0, percentage: 0 },
      q2: { actual: 0, target: 0, percentage: 0 },
      q3: { actual: 0, target: 0, percentage: 0 },
      q4: { actual: 0, target: 0, percentage: 0 }
    };

    // Calculate quarterly actuals
    submissions.forEach(submission => {
      const quarterId = submission.quarterId;
      const value = submission.value || 0;
      
      if (quarterId === 'q1') {
        quarterlyProgress.q1.actual += value;
      } else if (quarterId === 'q2') {
        quarterlyProgress.q2.actual += value;
      } else if (quarterId === 'q3') {
        quarterlyProgress.q3.actual += value;
      } else if (quarterId === 'q4') {
        quarterlyProgress.q4.actual += value;
      }
    });

    // Set targets (you can modify this to get from indicator data)
    if (indicatorTargets) {
      quarterlyProgress.q1.target = indicatorTargets.q1 || 0;
      quarterlyProgress.q2.target = indicatorTargets.q2 || 0;
      quarterlyProgress.q3.target = indicatorTargets.q3 || 0;
      quarterlyProgress.q4.target = indicatorTargets.q4 || 0;
    } else {
      // Default targets - you may want to get these from your indicators data
      quarterlyProgress.q1.target = 25;
      quarterlyProgress.q2.target = 25;
      quarterlyProgress.q3.target = 25;
      quarterlyProgress.q4.target = 25;
    }

    // Calculate quarterly percentages
    Object.keys(quarterlyProgress).forEach(quarter => {
      const progress = quarterlyProgress[quarter as keyof QuarterlyProgress];
      progress.percentage = progress.target > 0 ? (progress.actual / progress.target) * 100 : 0;
    });

    // Calculate annual progress
    const annualProgress: AnnualProgress = {
      actual: quarterlyProgress.q1.actual + quarterlyProgress.q2.actual + 
              quarterlyProgress.q3.actual + quarterlyProgress.q4.actual,
      target: quarterlyProgress.q1.target + quarterlyProgress.q2.target + 
              quarterlyProgress.q3.target + quarterlyProgress.q4.target,
      percentage: 0
    };
    annualProgress.percentage = annualProgress.target > 0 ? (annualProgress.actual / annualProgress.target) * 100 : 0;

    // Determine status
    let status: 'completed' | 'on-track' | 'behind' | 'not-started';
    if (annualProgress.percentage >= 100) {
      status = 'completed';
    } else if (annualProgress.percentage >= 75) {
      status = 'on-track';
    } else if (annualProgress.percentage > 0) {
      status = 'behind';
    } else {
      status = 'not-started';
    }

    return {
      indicatorId,
      indicatorName,
      pillarName,
      quarterlyProgress,
      annualProgress,
      status
    };
  } catch (error) {
    console.error('Error calculating indicator progress:', error);
    throw error;
  }
};

/**
 * Calculate progress for all indicators assigned to an employee
 */
export const calculateEmployeeProgress = async (userEmail: string): Promise<IndicatorProgress[]> => {
  try {
    // Get all unique indicators the user has submitted data for
    const userSubmissions = await SubmissionModel.find({
      submittedBy: userEmail
    });

    // Group by indicator
    const indicatorMap = new Map<string, any>();
    
    userSubmissions.forEach(submission => {
      const key = submission.indicatorId;
      if (!indicatorMap.has(key)) {
        indicatorMap.set(key, {
          indicatorId: submission.indicatorId,
          indicatorName: submission.indicatorName,
          pillarName: submission.pillarName,
          targets: submission.targetValue // Assuming targetValue contains quarterly targets
        });
      }
    });

    // Calculate progress for each indicator
    const progressPromises = Array.from(indicatorMap.values()).map(async (indicator) => {
      return await calculateIndicatorProgress(
        indicator.indicatorId,
        indicator.indicatorName,
        indicator.pillarName,
        userEmail,
        indicator.targets
      );
    });

    return await Promise.all(progressPromises);
  } catch (error) {
    console.error('Error calculating employee progress:', error);
    throw error;
  }
};
