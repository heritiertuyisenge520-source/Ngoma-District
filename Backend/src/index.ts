
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import connectDB from './db';
import { PillarModel, EntryModel, SubmissionModel, UserModel } from './models';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import logger from './utils/logger';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
    logger.info(`${req.method} ${req.url}`);
    next();
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error(err.stack);
    res.status(500).json({ message: 'Something went wrong!' });
});

// Connect to Database
connectDB();

// --- ROUTES ---

// Auth Routes
app.use('/api/auth', authRoutes);

// Analytics Routes
app.use('/api/analytics', analyticsRoutes);

// 1. Get Metadata (Pillars Structure)
app.get('/api/metadata', async (req, res) => {
    try {
        const pillars = await PillarModel.find({});
        res.json(pillars);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching metadata' });
    }
});

// 2. Get Entries (With Filters)
app.get('/api/entries', async (req, res) => {
    try {
        const { pillarId, quarterId, month } = req.query;
        const query: any = {};

        if (pillarId) query.pillarId = pillarId;
        if (quarterId) query.quarterId = quarterId;
        if (month) query.month = month;

        const entries = await EntryModel.find(query).sort({ timestamp: -1 });
        res.json(entries);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching entries' });
    }
});

// 3. Add Entry
app.post('/api/entries', async (req, res) => {
    try {
        const newEntry = new EntryModel(req.body);
        const savedEntry = await newEntry.save();
        res.status(201).json(savedEntry);
    } catch (error) {
        res.status(400).json({ message: 'Error saving entry' });
    }
});

// 4. Update Entry
app.patch('/api/entries/:id', async (req, res) => {
    try {
        const updatedEntry = await EntryModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedEntry);
    } catch (error) {
        res.status(400).json({ message: 'Error updating entry' });
    }
});

// 5. Delete Entry (Optional cleanup)
app.delete('/api/entries/:id', async (req, res) => {
    try {
        await EntryModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting entry' });
    }
});

// 6. Submit Data (Submission Collection)
app.get('/api/submissions', async (req, res) => {
    try {
        const submissions = await SubmissionModel.find({}).sort({ timestamp: -1 });
        res.json(submissions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submissions' });
    }
});

app.get('/api/submissions/:id', async (req, res) => {
    try {
        const submission = await SubmissionModel.findById(req.params.id);
        res.json(submission);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching submission' });
    }
});

app.post('/api/submissions', async (req, res) => {
    try {
        const newSubmission = new SubmissionModel(req.body);
        const savedSubmission = await newSubmission.save();
        res.status(201).json(savedSubmission);
    } catch (error) {
        console.error("Error saving submission:", error);
        res.status(400).json({ message: 'Error saving submission' });
    }
});

app.patch('/api/submissions/:id', async (req, res) => {
    try {
        const updatedSubmission = await SubmissionModel.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );
        res.json(updatedSubmission);
    } catch (error) {
        res.status(400).json({ message: 'Error updating submission' });
    }
});

app.delete('/api/submissions/:id', async (req, res) => {
    try {
        await SubmissionModel.findByIdAndDelete(req.params.id);
        res.json({ message: 'Submission deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting submission' });
    }
});

app.post('/api/register', async (req, res) => {
    try {
        const { email, name, role } = req.body;
        // Check if user already exists
        let user = await UserModel.findOne({ email });
        if (user) {
            // Update existing user info
            user.name = name;
            user.role = role;
            user.lastLogin = new Date();
            await user.save();
        } else {
            // Create new user (temporary password until added later)
            user = new UserModel({
                email,
                name,
                role,
                password: 'temp-password',
                lastLogin: new Date()
            });
            await user.save();
        }
        res.status(200).json(user);
    } catch (error) {
        console.error("Error registering user:", error);
        res.status(400).json({ message: 'Error registering user' });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, name } = req.body;
        const user = await UserModel.findOne({ email });

        if (user) {
            // Update last login
            user.lastLogin = new Date();
            await user.save();
            res.status(200).json(user);
        } else {
            res.status(404).json({ message: 'User not found. Please register first.' });
        }
    } catch (error) {
        console.error("Error logging in:", error);
        res.status(400).json({ message: 'Error logging in' });
    }
});

// 7. Clear All Data (Dev only - for "removing dummy data" request)
app.post('/api/clear-data', async (req, res) => {
    try {
        await EntryModel.deleteMany({});
        await SubmissionModel.deleteMany({});
        logger.info('Database cleared by user request');
        res.json({ message: 'All entries and submissions cleared.' });
    } catch (error) {
        logger.error('Error clearing data', error);
        res.status(500).json({ message: 'Error clearing data' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

