import express from 'express';
import { AnnouncementModel, UNITS } from '../models';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

router.post('/publish', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const message = String(req.body?.message || '').trim();
    const audience = String(req.body?.audience || '').trim();
    const targetUnit = req.body?.targetUnit ? String(req.body.targetUnit).trim() : undefined;

    if (!message) {
      return res.status(400).json({ message: 'Message is required' });
    }

    if (message.length > 2000) {
      return res.status(400).json({ message: 'Message is too long' });
    }

    if (!['all', 'unit', 'planning_head'].includes(audience)) {
      return res.status(400).json({ message: 'Invalid audience' });
    }

    if (audience === 'unit') {
      if (!targetUnit) {
        return res.status(400).json({ message: 'targetUnit is required for unit audience' });
      }
      if (!UNITS.includes(targetUnit as any)) {
        return res.status(400).json({ message: 'Invalid unit specified' });
      }
    }

    const announcement = new AnnouncementModel({
      message,
      audience,
      targetUnit: audience === 'unit' ? targetUnit : null,
      createdByEmail: req.user?.email,
      createdByName: req.user?.email,
      createdAt: new Date()
    });

    await announcement.save();

    res.json({ success: true, announcement });
  } catch (error: any) {
    console.error('Error publishing comment:', error);
    res.status(500).json({ message: 'Failed to publish comment', error: error.message });
  }
});

router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userType = req.user?.userType;
    const unit = req.user?.unit;
    const email = req.user?.email;

    const isPlanningHead = userType === 'head' && unit === 'Planning, Monitoring and Evaluation Unit';

    const filter: any = {
      $or: [
        { audience: 'all' },
        ...(unit ? [{ audience: 'unit', targetUnit: unit }] : []),
        ...(isPlanningHead ? [{ audience: 'planning_head' }] : []),
        ...(email ? [{ createdByEmail: email }] : [])
      ]
    };

    if (userType === 'super_admin') {
      delete filter.$or;
    }

    const announcements = await AnnouncementModel.find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ success: true, announcements });
  } catch (error: any) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ message: 'Failed to load comments', error: error.message });
  }
});

export default router;
