const prisma = require('../prisma');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { email, phone, password, role, ...profileData } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { phone }]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user and profile transaction
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          role: role || 'worker',
          profile: {
            create: {
              // Default empty profile or data from request
              ...profileData
            }
          }
        },
        include: { profile: true }
      });
      return newUser;
    });

    const token = generateToken(user);

    res.status(201).json({
      token,
      refreshToken: `refresh-${token}`, // Simplified refresh token for prototype
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email || undefined },
          { phone: phone || undefined }
        ]
      },
      include: { profile: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);

    res.json({
      token,
      refreshToken: `refresh-${token}`,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Mock verify for the prototype flow
exports.verify = async (req, res) => {
  const { target, contact } = req.body;
  // In a real app, this would send an SMS/Email
  setTimeout(() => {
    res.json({
      delivered: true,
      target,
      contact,
      code: '123456' // Fixed code for dev
    });
  }, 1000);
};
