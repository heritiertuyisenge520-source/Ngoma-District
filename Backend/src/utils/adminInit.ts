import bcrypt from 'bcryptjs';
import { UserModel } from '../models';
import logger from './logger';

// Define all admin accounts
const ADMIN_ACCOUNTS = [
    {
        email: 'baptise.nduwayezu@ngoma.gov.rw',
        password: 'Imihigo@!1983',
        name: 'NDUWAYEZU J.Baptiste',
        firstName: 'NDUWAYEZU',
        lastName: 'J.Baptiste',
        role: 'Super Admin',
        unit: 'Planning, Monitoring and Evaluation Unit'
    },
    {
        email: 'heritiertuyisenge520@gmail.com',
        password: '12345678',
        name: 'TUYISENGE HERITIER',
        firstName: 'TUYISENGE',
        lastName: 'HERITIER',
        role: 'Super Admin',
        unit: 'Planning, Monitoring and Evaluation Unit'
    }
    // Add third admin details here when available
];

export const ensureAdminExists = async () => {
    try {
        for (const adminData of ADMIN_ACCOUNTS) {
            const existingAdmin = await UserModel.findOne({ email: adminData.email });

            if (!existingAdmin) {
                logger.info(`Admin account not found. Creating admin: ${adminData.email}...`);
                
                const hashedPassword = await bcrypt.hash(adminData.password, 10);
                
                const admin = new UserModel({
                    email: adminData.email,
                    password: hashedPassword,
                    name: adminData.name,
                    firstName: adminData.firstName,
                    lastName: adminData.lastName,
                    role: adminData.role,
                    userType: 'super_admin',
                    isApproved: true,
                    isActive: true,
                    unit: adminData.unit,
                    createdAt: new Date(),
                    updatedAt: new Date()
                });

                await admin.save();
                logger.info(`Admin account created successfully: ${adminData.email}`);
            } else {
                // Update password if it has changed (optional - for password reset)
                // Uncomment below if you want to update passwords on server restart
                // const hashedPassword = await bcrypt.hash(adminData.password, 10);
                // await UserModel.updateOne(
                //     { email: adminData.email },
                //     { 
                //         $set: { 
                //             password: hashedPassword,
                //             name: adminData.name,
                //             firstName: adminData.firstName,
                //             lastName: adminData.lastName,
                //             role: adminData.role,
                //             userType: 'super_admin',
                //             isApproved: true,
                //             isActive: true,
                //             unit: adminData.unit,
                //             updatedAt: new Date()
                //         }
                //     }
                // );
                logger.info(`Admin account already exists: ${adminData.email}`);
            }
        }
    } catch (error) {
        logger.error('Error ensuring admin exists:', error);
    }
};
