const prisma = require('../prisma');

exports.getJobs = async (req, res) => {
  try {
    const page = parseInt(req.query.page || '1');
    const limit = parseInt(req.query.limit || '10');
    const search = req.query.search || '';
    
    const skip = (page - 1) * limit;

    const where = search ? {
        OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
        ]
    } : {};

    const [jobs, total] = await prisma.$transaction([
        prisma.job.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                employer: {
                    select: {
                        id: true,
                        email: true,
                        profile: {
                            select: { companyName: true, location: true, rating: true }
                        }
                    }
                }
            }
        }),
        prisma.job.count({ where })
    ]);

    res.json({
        jobs,
        pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
        }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
};

exports.getJobById = async (req, res) => {
    try {
        const { id } = req.params;
        const job = await prisma.job.findUnique({
            where: { id: parseInt(id) },
            include: {
                employer: {
                    include: { profile: true }
                },
                shifts: true
            }
        });

        if (!job) return res.status(404).json({ error: 'Job not found' });
        res.json({ job });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch job' });
    }
};

exports.createJob = async (req, res) => {
    try {
        const employerId = req.user.id;

        const job = await prisma.job.create({
            data: {
                ...req.body,
                employerId: employerId
            }
        });
        res.status(201).json({ job });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create job' });
    }
};

exports.applyForJob = async (req, res) => {
    try {
        const userId = req.user.id;
        const { jobId, message } = req.body;

        if (!jobId) {
            return res.status(400).json({ error: 'jobId is required' });
        }

        // Check if application already exists
        const existingApplication = await prisma.application.findUnique({
            where: {
                jobId_userId: {
                    jobId: parseInt(jobId),
                    userId: userId
                }
            }
        });

        if (existingApplication) {
            return res.status(409).json({ error: 'Already applied for this job' });
        }

        const application = await prisma.application.create({
            data: {
                jobId: parseInt(jobId),
                userId: userId,
                message: message || '',
                status: 'pending'
            }
        });

        res.status(201).json({ application });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to apply for job' });
    }
};

exports.getApplications = async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page || '1');
        const limit = parseInt(req.query.limit || '50');
        const status = req.query.status;

        const skip = (page - 1) * limit;

        const where = {
            userId: userId,
            ...(status && { status: status })
        };

        const [applications, total] = await prisma.$transaction([
            prisma.application.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    job: true // Include job details
                }
            }),
            prisma.application.count({ where })
        ]);

        res.json({
            applications,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch applications' });
    }
};