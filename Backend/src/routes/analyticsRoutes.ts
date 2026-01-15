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
        const pillars = await PillarModel.find({});

        const progressData = await Promise.all(
            pillars.map(async (pillar) => {
                // Get all entries for this pillar
                const entries = await EntryModel.find({
                    pillarId: pillar.id,
                    isDeleted: false
                });

                if (entries.length === 0) {
                    return {
                        pillarId: pillar.id,
                        pillarName: pillar.name,
                        progress: 0,
                        totalEntries: 0
                    };
                }

                // Calculate progress based on value vs target
                const entriesWithProgress = entries.map(entry => {
                    const progress = entry.targetValue
                        ? Math.min(100, (entry.value / entry.targetValue) * 100)
                        : 100;
                    return progress;
                });

                const avgProgress = entriesWithProgress.reduce((sum, p) => sum + p, 0) / entriesWithProgress.length;

                return {
                    pillarId: pillar.id,
                    pillarName: pillar.name,
                    progress: parseFloat(avgProgress.toFixed(2)),
                    totalEntries: entries.length
                };
            })
        );

        res.json(progressData);
    } catch (error) {
        res.status(500).json({ message: 'Error calculating progress' });
    }
});

export default router;
