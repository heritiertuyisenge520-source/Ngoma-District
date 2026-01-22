import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Super Admin Details
const SUPER_ADMIN = {
    name: 'NDUWAYEZU JeanBaptiste',
    email: 'baptise.nduwayezu@ngoma.gov.rw',
    password: 'Imihigo@!1983',
    role: 'Super Admin',
    firstName: 'NDUWAYEZU',
    lastName: 'JeanBaptiste',
    isApproved: true,
    userType: 'super_admin',
    isActive: true
};

const seedSuperAdmin = async () => {
    try {
        const mongoUri = process.env.MONGODB_URI;
        if (!mongoUri) {
            throw new Error('MONGODB_URI environment variable is not set');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Define user schema inline for this script
        const UserSchema = new mongoose.Schema({
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            role: { type: String, required: true },
            name: { type: String, required: true },
            firstName: { type: String },
            lastName: { type: String },
            lastLogin: { type: Date },
            isActive: { type: Boolean, default: true },
            isApproved: { type: Boolean, default: false },
            approvedAt: { type: Date },
            approvedBy: { type: String },
            unit: { type: String },
            userType: { type: String, enum: ['super_admin', 'head', 'employee'], default: 'employee' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        const UserModel = mongoose.models.User || mongoose.model('User', UserSchema);

        // Check if super admin already exists
        const existingAdmin = await UserModel.findOne({ email: SUPER_ADMIN.email });

        if (existingAdmin) {
            console.log('Super Admin already exists. Updating...');

            // Update existing admin
            const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);
            await UserModel.updateOne(
                { email: SUPER_ADMIN.email },
                {
                    $set: {
                        name: SUPER_ADMIN.name,
                        password: hashedPassword,
                        role: SUPER_ADMIN.role,
                        firstName: SUPER_ADMIN.firstName,
                        lastName: SUPER_ADMIN.lastName,
                        isApproved: true,
                        userType: 'super_admin',
                        isActive: true,
                        updatedAt: new Date()
                    }
                }
            );
            console.log('Super Admin updated successfully!');
        } else {
            console.log('Creating new Super Admin...');

            // Create new super admin
            const hashedPassword = await bcrypt.hash(SUPER_ADMIN.password, 10);

            const superAdmin = new UserModel({
                email: SUPER_ADMIN.email,
                password: hashedPassword,
                name: SUPER_ADMIN.name,
                role: SUPER_ADMIN.role,
                firstName: SUPER_ADMIN.firstName,
                lastName: SUPER_ADMIN.lastName,
                isApproved: true,
                userType: 'super_admin',
                isActive: true
            });

            await superAdmin.save();
            console.log('Super Admin created successfully!');
        }

        console.log('\n========================================');
        console.log('SUPER ADMIN CREDENTIALS:');
        console.log('----------------------------------------');
        console.log(`Name: ${SUPER_ADMIN.name}`);
        console.log(`Email: ${SUPER_ADMIN.email}`);
        console.log(`Password: ${SUPER_ADMIN.password}`);
        console.log('========================================\n');

        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding super admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
