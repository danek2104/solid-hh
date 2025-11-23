const prisma = require('../prisma');
const fs = require('fs');
const path = require('path');

exports.uploadDocument = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        const { documentType, title, description } = req.body;
        
        // Construct file URL
        // In production, this would be an S3 URL or similar
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        const fileUrl = `${baseUrl}/uploads/${req.file.filename}`;

        const document = await prisma.document.create({
            data: {
                userId,
                title: title || req.file.originalname,
                type: req.file.mimetype.startsWith('image/') ? 'photo' : 'document',
                documentType: documentType || 'general',
                description,
                url: fileUrl,
                mimeType: req.file.mimetype,
                status: 'pending'
            }
        });

        res.status(201).json({ document });
    } catch (error) {
        console.error(error);
        // Cleanup file if DB entry failed
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Failed to delete uploaded file after error:', err);
            });
        }
        res.status(500).json({ error: 'Failed to upload document' });
    }
};

exports.uploadAvatar = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const userId = req.user.id;
        const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
        const avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;

        const updatedProfile = await prisma.profile.update({
            where: { userId },
            data: { avatarUrl }
        });

        res.json({ profile: updatedProfile });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to upload avatar' });
    }
};

exports.deleteDocument = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const document = await prisma.document.findUnique({
            where: { id: parseInt(id) }
        });

        if (!document) return res.status(404).json({ error: 'Document not found' });
        if (document.userId !== userId) return res.status(403).json({ error: 'Access denied' });

        // Delete from DB
        await prisma.document.delete({
            where: { id: parseInt(id) }
        });

        // Delete from filesystem
        const filename = path.basename(document.url);
        const filepath = path.join(__dirname, '../../uploads', filename);
        
        if (fs.existsSync(filepath)) {
            fs.unlinkSync(filepath);
        }

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete document' });
    }
};

exports.getDocuments = async (req, res) => {
    try {
        const userId = req.user.id;
        const documents = await prisma.document.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }
        });
        
        res.json({ documents });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
};
