const prisma = require('../prisma');

exports.getReviews = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`Fetching reviews for targetId (user): ${userId}`);
        
        // Fetch reviews received by the user (as a worker or employer)
        // OR fetch reviews written by the user? Usually "My Reviews" means reviews ABOUT me.
        // Let's assume we fetch reviews RECEIVED by the current user.
        
        const reviews = await prisma.review.findMany({
            where: { targetId: userId },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        email: true,
                        profile: { select: { companyName: true, fullName: true, avatarUrl: true } }
                    }
                }
            }
        });

        console.log(`Found ${reviews.length} reviews.`);

        const formattedReviews = reviews.map(r => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            author: {
                id: r.author.id,
                name: r.author.profile?.companyName || r.author.profile?.fullName || r.author.email,
                avatar: r.author.profile?.avatarUrl
            }
        }));

        res.json({ reviews: formattedReviews });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch reviews' });
    }
};

exports.createReview = async (req, res) => {
    try {
        const authorId = req.user.id;
        const { targetId, rating, comment } = req.body;

        if (!targetId || !rating) {
            return res.status(400).json({ error: 'targetId and rating are required' });
        }

        // Validate rating
        if (rating < 1 || rating > 5) {
            return res.status(400).json({ error: 'Rating must be between 1 and 5' });
        }

        // Prevent self-review
        if (parseInt(targetId) === authorId) {
            return res.status(400).json({ error: 'Cannot review yourself' });
        }

        const review = await prisma.review.create({
            data: {
                authorId,
                targetId: parseInt(targetId),
                rating: parseInt(rating),
                comment
            }
        });

        // Update target user's average rating (simplified)
        const aggregations = await prisma.review.aggregate({
            where: { targetId: parseInt(targetId) },
            _avg: { rating: true }
        });

        if (aggregations._avg.rating) {
            await prisma.profile.update({
                where: { userId: parseInt(targetId) },
                data: { rating: aggregations._avg.rating }
            });
        }

        res.status(201).json({ review });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create review' });
    }
};
