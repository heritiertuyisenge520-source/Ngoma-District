import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models';

export interface AuthenticatedRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
        userType?: 'super_admin' | 'head' | 'employee';
        unit?: string;
    };
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here';

// Permission constants
export const PERMISSIONS = {
    // User Management
    MANAGE_USERS: 'manage_users',
    APPROVE_USERS: 'approve_users',
    
    // Data Management
    VIEW_ALL_DATA: 'view_all_data',
    VIEW_UNIT_DATA: 'view_unit_data',
    VIEW_OWN_DATA: 'view_own_data',
    SUBMIT_DATA: 'submit_data',
    EDIT_OWN_DATA: 'edit_own_data',
    DELETE_DATA: 'delete_data',
    
    // System Management
    MANAGE_PERIODS: 'manage_periods',
    VIEW_ANALYTICS: 'view_analytics',
    MANAGE_INDICATORS: 'manage_indicators'
} as const;

export type PermissionType = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role permissions mapping
const ROLE_PERMISSIONS: Record<string, PermissionType[]> = {
    super_admin: [
        PERMISSIONS.MANAGE_USERS,
        PERMISSIONS.APPROVE_USERS,
        PERMISSIONS.VIEW_ALL_DATA,
        PERMISSIONS.SUBMIT_DATA,
        PERMISSIONS.EDIT_OWN_DATA,
        PERMISSIONS.DELETE_DATA,
        PERMISSIONS.MANAGE_PERIODS,
        PERMISSIONS.VIEW_ANALYTICS,
        PERMISSIONS.MANAGE_INDICATORS
    ],
    head: [
        PERMISSIONS.VIEW_UNIT_DATA,
        PERMISSIONS.SUBMIT_DATA,
        PERMISSIONS.EDIT_OWN_DATA,
        PERMISSIONS.VIEW_ANALYTICS
    ],
    employee: [
        PERMISSIONS.VIEW_OWN_DATA,
        PERMISSIONS.SUBMIT_DATA,
        PERMISSIONS.EDIT_OWN_DATA
    ]
};

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
            role: user.role,
            userType: user.userType,
            unit: user.unit
        };

        // Update last login time
        user.lastLogin = new Date();
        await user.save();

        next();
    } catch (error) {
        res.status(401).json({ message: 'Please authenticate' });
    }
};

export const authorize = (permissions: PermissionType | PermissionType[]) => {
    return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const userPermissions = ROLE_PERMISSIONS[req.user.userType || 'employee'] || [];
        const requiredPermissions = Array.isArray(permissions) ? permissions : [permissions];
        
        const hasPermission = requiredPermissions.every(permission => 
            userPermissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({ 
                message: 'Insufficient permissions',
                required: requiredPermissions,
                userPermissions: userPermissions
            });
        }

        next();
    };
};

// Specialized authorization helpers
export const authorizeUnitAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin can access all units
    if (req.user.userType === 'super_admin') {
        return next();
    }

    // Head can only access their own unit
    if (req.user.userType === 'head') {
        const requestedUnit = req.query.unit || req.body.unit;
        if (requestedUnit && requestedUnit !== req.user.unit) {
            return res.status(403).json({ 
                message: 'Can only access data from your own unit',
                userUnit: req.user.unit,
                requestedUnit
            });
        }
        return next();
    }

    // Employees can only access their own data
    if (req.user.userType === 'employee') {
        const requestedEmail = req.query.email || req.body.email || req.user.email;
        if (requestedEmail !== req.user.email) {
            return res.status(403).json({ 
                message: 'Can only access your own data',
                userEmail: req.user.email,
                requestedEmail
            });
        }
        return next();
    }

    return res.status(403).json({ message: 'Access denied' });
};

// Check if user can access specific submission data
export const authorizeSubmissionAccess = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    // Super admin can access all submissions
    if (req.user.userType === 'super_admin') {
        return next();
    }

    // For other roles, we'll check at the route level
    next();
};

export const generateAuthToken = (userId: string): string => {
    return jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: '7d' });
};
