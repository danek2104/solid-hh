const prisma = require('../prisma');

exports.getShifts = async (req, res) => {
    try {
        // For workers: show available shifts or shifts they accepted
        // For employers: show shifts they created
        const userId = req.user.id;
        const role = req.user.role;

        let where = {};

        if (role === 'employer') {
            // Show shifts for jobs created by this employer
            where = {
                job: { employerId: userId }
            };
        } else {
            // Worker: Show available shifts OR shifts accepted by me
            where = {
                OR: [
                    { status: 'available' },
                    { workerId: userId }
                ]
            };
        }

        const shifts = await prisma.shift.findMany({
            where,
            orderBy: { date: 'asc' },
            include: {
                job: {
                    select: {
                        title: true,
                        employer: {
                            select: {
                                profile: { select: { companyName: true } }
                            }
                        }
                    }
                }
            }
        });

        res.json({ shifts });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch shifts' });
    }
};

exports.createShift = async (req, res) => {
    try {
        // Only employers can create shifts
        if (req.user.role !== 'employer') {
            return res.status(403).json({ error: 'Only employers can create shifts' });
        }

        const { jobId, title, date, startTime, endTime, location, payment } = req.body;

        // Verify job belongs to employer
        const job = await prisma.job.findFirst({
            where: {
                id: parseInt(jobId),
                employerId: req.user.id
            }
        });

        if (!job) {
            return res.status(404).json({ error: 'Job not found or access denied' });
        }

        const shift = await prisma.shift.create({
            data: {
                jobId: parseInt(jobId),
                title,
                date: new Date(date), // Ensure proper date format
                startTime,
                endTime,
                location,
                payment,
                status: 'available'
            }
        });

        res.status(201).json({ shift });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create shift' });
    }
};

exports.acceptShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = parseInt(req.params.id);

        // Transaction to ensure atomic update and check
        const result = await prisma.$transaction(async (prisma) => {
            const shift = await prisma.shift.findUnique({
                where: { id: shiftId }
            });

            if (!shift) throw new Error('Shift not found');
            if (shift.status !== 'available') throw new Error('Shift is not available');

            const updatedShift = await prisma.shift.update({
                where: { id: shiftId },
                data: {
                    status: 'accepted',
                    workerId: userId
                }
            });

            return updatedShift;
        });

        res.json({ shift: result });
    } catch (error) {
        console.error(error);
        const status = error.message === 'Shift not found' ? 404 : 400;
        res.status(status).json({ error: error.message || 'Failed to accept shift' });
    }
};

exports.cancelShift = async (req, res) => {
    try {
        const userId = req.user.id;
        const shiftId = parseInt(req.params.id);

        const shift = await prisma.shift.findUnique({
            where: { id: shiftId },
            include: { job: true }
        });

        if (!shift) return res.status(404).json({ error: 'Shift not found' });

        // Logic: 
        // - Worker can cancel if they accepted it
        // - Employer can cancel if they own the job

        const isWorker = shift.workerId === userId;
        const isEmployer = shift.job.employerId === userId;

        if (!isWorker && !isEmployer) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const updatedShift = await prisma.shift.update({
            where: { id: shiftId },
            data: {
                status: isEmployer ? 'cancelled' : 'available', // Worker cancelling makes it available again
                workerId: isEmployer ? shift.workerId : null    // Keep worker ID if employer cancels (history), remove if worker cancels
            }
        });

        res.json({ shift: updatedShift });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to cancel shift' });
    }
};
