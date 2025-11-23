const prisma = require('../prisma');

exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const profile = await prisma.profile.findUnique({
      where: { userId },
      include: {
        user: {
            select: {
                email: true,
                phone: true,
                role: true,
                pushToken: true // Include push token in response if needed
            }
        }
      }
    });

    if (!profile) {
        return res.status(404).json({ error: 'Profile not found' });
    }

    // Flatten structure to match frontend expectations: 
    // { profile: { ...profileFields, email, phone, role } }
    const { user, ...profileData } = profile;
    const combinedProfile = {
        ...profileData,
        email: user.email,
        phone: user.phone,
        role: user.role
    };

    res.json({ profile: combinedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const updates = req.body.profile; // Frontend wraps data in { profile: ... }

    // Handle Push Token update separately if it's in the body
    if (updates.pushToken) {
        await prisma.user.update({
            where: { id: userId },
            data: { pushToken: updates.pushToken }
        });
        // Remove it from updates to not try updating it on Profile model
        delete updates.pushToken;
    }

    // Only update profile if there are remaining fields
    let updatedProfile = null;
    if (Object.keys(updates).length > 0) {
        updatedProfile = await prisma.profile.update({
            where: { userId },
            data: updates
        });
    } else {
        updatedProfile = await prisma.profile.findUnique({ where: { userId } });
    }

    res.json({ profile: updatedProfile });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

exports.getDocumentsStatus = async (req, res) => {
    try {
        const userId = req.user.id;
        const documents = await prisma.document.findMany({
            where: { userId }
        });
        
        // Transform array to object keyed by documentType
        const docsStatus = documents.reduce((acc, doc) => {
            acc[doc.documentType] = {
                status: doc.status,
                uploadedAt: doc.updatedAt
            };
            return acc;
        }, {});

        res.json({ documents: docsStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch documents status' });
    }
};