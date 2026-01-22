import express from 'express';
import { EntryModel, PillarModel } from '../models';

const router = express.Router();

// Get summary analytics by pillar and quarter
router.get('/summary', async (req, res) => {
    try {
        const { pillarId, quarterId } = req.query;

        const query: any = {};
        if (pillarId) query.pillarId = pillarId;
        if (quarterId) query.quarterId = quarterId;

        // Aggregate data by indicator
        const result = await EntryModel.aggregate([
            { $match: query },
            {
                $group: {
                    _id: {
                        pillarId: '$pillarId',
                        indicatorId: '$indicatorId',
                        quarterId: '$quarterId'
                    },
                    count: { $sum: 1 },
                    avgValue: { $avg: '$value' },
                    maxValue: { $max: '$value' },
                    minValue: { $min: '$value' },
                    totalValue: { $sum: '$value' }
                }
            },
            {
                $project: {
                    pillarId: '$_id.pillarId',
                    indicatorId: '$_id.indicatorId',
                    quarterId: '$_id.quarterId',
                    count: 1,
                    avgValue: 1,
                    maxValue: 1,
                    minValue: 1,
                    totalValue: 1,
                    _id: 0
                }
            }
        ]);

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching analytics summary' });
    }
});

// Get time series data for indicators
router.get('/trends', async (req, res) => {
    try {
        const { indicatorId, timeRange } = req.query;

        const query: any = { indicatorId };
        if (timeRange) {
            const now = new Date();
            const pastDate = new Date();

            if (timeRange === 'month') {
                pastDate.setMonth(now.getMonth() - 1);
            } else if (timeRange === 'quarter') {
                pastDate.setMonth(now.getMonth() - 3);
            } else if (timeRange === 'year') {
                pastDate.setFullYear(now.getFullYear() - 1);
            }

            query.timestamp = { $gte: pastDate };
        }

        const entries = await EntryModel.find(query)
            .sort({ timestamp: 1 })
            .select('value timestamp -_id');

        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching trends data' });
    }
});

// Get overall progress by pillar
router.get('/progress', async (req, res) => {
    try {
        const { quarterId } = req.query; // q1, q2, q3, q4, or undefined for all quarters
        const pillars = await PillarModel.find({});

        // Import indicator data and progress utilities
        const { INDICATORS, PILLARS } = require('../data/indicators');
        const { calculateQuarterProgress } = require('../utils/progressUtils');

        // Get total indicators across all pillars (126)
        const totalIndicatorsAcrossAllPillars = INDICATORS.length;

        const progressData = await Promise.all(
            pillars.map(async (pillar) => {
                // Find pillar data to get indicators
                const pillarData = PILLARS.find((p: any) => p.id === pillar.id);
                if (!pillarData) {
                    return {
                        pillarId: pillar.id,
                        pillarName: pillar.name,
                        progress: 0,
                        annualProgress: 0,
                        quarterId: quarterId || 'all',
                        error: 'Pillar data not found'
                    };
                }

                // Get all indicators for this pillar
                const pillarIndicators = pillarData.outputs.flatMap((output: any) => output.indicators);
                const pillarIndicatorCount = pillarIndicators.length;

                // Get all entries for this pillar
                const entries = await EntryModel.find({
                    pillarId: pillar.id,
                    isDeleted: false
                });

                if (entries.length === 0 || pillarIndicators.length === 0) {
                    return {
                        pillarId: pillar.id,
                        pillarName: pillar.name,
                        progress: 0,
                        annualProgress: 0,
                        quarterId: quarterId || 'all',
                        indicatorSum: 0,
                        pillarIndicatorCount: pillarIndicatorCount
                    };
                }

                // Calculate progress for each quarter
                const quarters = quarterId ? [quarterId] : ['q1', 'q2', 'q3', 'q4'];
                const results = [];

                for (const qId of quarters) {
                    let indicatorProgressSum = 0;

                    // Calculate progress for each indicator in this pillar for this quarter
                    for (const indicator of pillarIndicators) {
                        // Get entries for this specific indicator and quarter
                        const indicatorEntries = entries.filter(e => 
                            e.indicatorId === indicator.id && e.quarterId === qId
                        );

                        if (indicatorEntries.length > 0) {
                            // Calculate indicator progress using existing logic
                            const progressResult = calculateQuarterProgress({
                                indicator,
                                entries: indicatorEntries,
                                quarterId: qId,
                                monthsInQuarter: qId === 'q1' ? ['July', 'August', 'September'] :
                                               qId === 'q2' ? ['October', 'November', 'December'] :
                                               qId === 'q3' ? ['January', 'February', 'March'] :
                                               ['April', 'May', 'June']
                            });

                            indicatorProgressSum += progressResult.performance;
                        }
                    }

                    // Calculate pillar progress (sum / pillar indicators)
                    const pillarProgress = pillarIndicatorCount > 0 ? 
                        (indicatorProgressSum / pillarIndicatorCount) : 0;

                    // Calculate annual progress (sum / total indicators across all pillars)
                    const annualProgress = totalIndicatorsAcrossAllPillars > 0 ? 
                        (indicatorProgressSum / totalIndicatorsAcrossAllPillars) : 0;

                    results.push({
                        pillarId: pillar.id,
                        pillarName: pillar.name,
                        quarterId: qId,
                        pillarProgress: parseFloat(pillarProgress.toFixed(2)),
                        annualProgress: parseFloat(annualProgress.toFixed(2)),
                        indicatorSum: parseFloat(indicatorProgressSum.toFixed(2)),
                        pillarIndicatorCount: pillarIndicatorCount,
                        totalIndicatorsAcrossAllPillars: totalIndicatorsAcrossAllPillars
                    });
                }

                // Return single result if specific quarter requested, otherwise return all quarters
                return quarterId ? results[0] : results;
            })
        );

        // Flatten results if all quarters were requested
        const flattenedResults = quarterId ? 
            progressData : 
            progressData.flat();

        res.json(flattenedResults);
    } catch (error) {
        console.error('Error calculating progress:', error);
        res.status(500).json({ message: 'Error calculating progress' });
    }
});

export default router;
