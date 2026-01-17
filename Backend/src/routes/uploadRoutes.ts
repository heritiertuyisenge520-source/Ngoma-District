import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { Router, Request, Response } from 'express';
import path from 'path';

const router = Router();

// Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only images and PDFs are allowed.'));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    }
});

// Upload single file
router.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        // Convert buffer to base64
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataUri = `data:${req.file.mimetype};base64,${b64}`;

        // Determine resource type based on file type
        const resourceType = req.file.mimetype === 'application/pdf' ? 'raw' : 'image';

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'imihigo-documents',
            resource_type: resourceType,
            public_id: `${Date.now()}-${path.parse(req.file.originalname).name}`,
        });

        res.json({
            success: true,
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            resourceType: result.resource_type
        });

    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({
            message: 'Failed to upload file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Upload multiple files
router.post('/upload-multiple', upload.array('files', 5), async (req: Request, res: Response) => {
    try {
        const files = req.files as Express.Multer.File[];

        if (!files || files.length === 0) {
            return res.status(400).json({ message: 'No files uploaded' });
        }

        const uploadPromises = files.map(async (file) => {
            const b64 = Buffer.from(file.buffer).toString('base64');
            const dataUri = `data:${file.mimetype};base64,${b64}`;
            const resourceType = file.mimetype === 'application/pdf' ? 'raw' : 'image';

            const result = await cloudinary.uploader.upload(dataUri, {
                folder: 'imihigo-documents',
                resource_type: resourceType,
                public_id: `${Date.now()}-${path.parse(file.originalname).name}`,
            });

            return {
                url: result.secure_url,
                publicId: result.public_id,
                format: result.format,
                originalName: file.originalname
            };
        });

        const results = await Promise.all(uploadPromises);

        res.json({
            success: true,
            files: results
        });

    } catch (error) {
        console.error('Multiple upload error:', error);
        res.status(500).json({
            message: 'Failed to upload files',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Delete a file from Cloudinary
router.delete('/delete/:publicId', async (req: Request, res: Response) => {
    try {
        const { publicId } = req.params;
        const result = await cloudinary.uploader.destroy(publicId);

        res.json({
            success: true,
            result
        });
    } catch (error) {
        console.error('Delete error:', error);
        res.status(500).json({
            message: 'Failed to delete file',
            error: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

export default router;
