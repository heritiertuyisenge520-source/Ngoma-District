import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = jwt.verify(token, JWT_SECRET) as { id: string };
        const user = await UserModel.findById(decoded.id);

        if (!user || !user.isActive) {
            return res.status(401).json({ message: 'User not found or inactive' });
        }

        req.user = {
            id: user._id.toString(),
            email: user.email,
            role: user.role
        };

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

export const authorize = (roles: string[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Insufficient permissions' });
        }

        next();
    };
};

export const generateAuthToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};
