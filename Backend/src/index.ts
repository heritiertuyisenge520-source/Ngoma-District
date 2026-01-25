
import dotenv from 'dotenv';
dotenv.config();import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import connectDB from './db';
import { ensureAdminExists } from './utils/adminInit';
import authRoutes from './routes/authRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import submissionsRoutes from './routes/submissionsRoutes';
import dataRoutes from './routes/dataRoutes';
import uploadRoutes from './routes/uploadRoutes';

// Load environment variables
console.log('=== DOTENV DEBUG ===');
console.log('Current working directory:', process.cwd());
console.log('NODE_ENV:', process.env.NODE_ENV);

// Try multiple dotenv approaches
const result1 = dotenv.config();
console.log('Dotenv config result (default):', result1);

if (result1.error) {
    console.error('Dotenv error (default):', result1.error);
    // Try with explicit path
    const result2 = dotenv.config({ path: '.env' });
    console.log('Dotenv config result (explicit path):', result2);
    if (result2.error) {
        console.error('Dotenv error (explicit path):', result2.error);
    }
}

console.log('After dotenv - CLOUDINARY_CLOUD_NAME:', process.env.CLOUDINARY_CLOUD_NAME);
console.log('=== END DOTENV DEBUG ===');

// Add global error handlers
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    console.error('Reason details:', reason instanceof Error ? reason.stack : String(reason));
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware

// Manual CORS headers - set before anything else
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const frontendUrl = process.env.FRONTEND_URL?.replace(/\/$/, ''); // Remove trailing slash
    const allowedOrigins = [
        'http://localhost:3000',
        'http://localhost:3001',
        'http://localhost:5173',
        frontendUrl
    ].filter(Boolean) as string[];

    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle preflight
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

// CORS middleware as backup
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173', process.env.FRONTEND_URL?.replace(/\/$/, '')].filter(Boolean) as string[],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Helmet for security - disable policies that interfere with CORS
app.use(helmet({
    crossOriginResourcePolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api', dataRoutes);
app.use('/api/upload', uploadRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running' });
});

// Connect to database and start server
const startServer = async () => {
    try {
        await connectDB();

        // Initialize admin account if it doesn't exist
        await ensureAdminExists();

        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        console.error('Error details:', error instanceof Error ? error.message : String(error));
        console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        process.exit(1);
    }
};

startServer();
