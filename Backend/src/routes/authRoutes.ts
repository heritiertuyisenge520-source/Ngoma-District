import express from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models';
import { generateAuthToken } from '../middleware/auth';

const router = express.Router();

// Register a new user (Admin only)
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user already exists
        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create new user
        const user = new UserModel({
            email,
            password: hashedPassword,
            name,
            role: role || 'viewer'
        });

        await user.save();

        // Generate token
        const token = generateAuthToken(user._id.toString());

        res.status(201).json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(400).json({ message: 'Error creating user' });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate token
        const token = generateAuthToken(user._id.toString());

        res.json({
            user: {
                id: user._id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            token
        });
    } catch (error) {
        res.status(400).json({ message: 'Error logging in' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    try {
        // In a real implementation, this would use the authenticate middleware
        // For now, we'll just return a mock response
        res.json({
            message: 'Authentication middleware would be used here in production'
        });
    } catch (error) {
        res.status(400).json({ message: 'Error fetching user data' });
    }
});

export default router;
