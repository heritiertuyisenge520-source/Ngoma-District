import bcrypt from 'bcryptjs';
import { UserModel } from '../models';
import logger from './logger';

export const ensureAdminExists = async () => {
    try {
        const adminEmail = 'baptise.nduwayezu@ngoma.gov.rw';
        const existingAdmin = await UserModel.findOne({ email: adminEmail });

        if (!existingAdmin) {
            logger.info('Admin account not found. Creating default admin...');
            
            const hashedPassword = await bcrypt.hash('Imihigo@!1983', 10);
            
            const admin = new UserModel({
                email: adminEmail,
                password: hashedPassword,
                name: 'NDUWAYEZU J.Baptiste',
                firstName: 'NDUWAYEZU',
                lastName: 'J.Baptiste',
                role: 'Super Admin',
                userType: 'super_admin',
                isApproved: true,
                isActive: true,
                unit: 'Planning, Monitoring and Evaluation Unit',
                createdAt: new Date(),
                updatedAt: new Date()
            });

            await admin.save();
            logger.info('Admin account created successfully');
        } else {
            logger.info('Admin account already exists');
        }
    } catch (error) {
        logger.error('Error ensuring admin exists:', error);
    }
};
