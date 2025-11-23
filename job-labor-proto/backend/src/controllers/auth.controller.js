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
    const { 
        email, 
        phone, 
        password, 
        role, 
        confirmPassword, 
        mode, 
        emailVerificationCode, 
        phoneVerificationCode,
        ...rest 
    } = req.body;

    const profileData = {
        skill: rest.workerSkill,
        companyName: rest.employerCompany,
    };

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
            { email: email || undefined },
            { phone: phone || undefined }
        ]
      }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          email,
          phone,
          password: hashedPassword,
          role: role || 'worker',
          profile: {
            create: profileData
          }
        },
        include: { profile: true }
      });
      return newUser;
    });

    const token = generateToken(user);

    res.status(201).json({
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
    console.error('Registration Error:', error);
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

exports.refresh = async (req, res) => {
    try {
        const { refreshToken } = req.body;
        
        if (!refreshToken || !refreshToken.startsWith('refresh-')) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }

        // Simplified refresh logic: verify existing token signature if possible
        // In a real app, refresh tokens should be stored in DB and checked
        
        // Extract the original token from 'refresh-ORIGINAL_TOKEN'
        const originalToken = refreshToken.replace('refresh-', '');
        
        // Try to decode it to get user ID (ignoring expiration)
        const decoded = jwt.decode(originalToken);
        
        if (!decoded || !decoded.id) {
             return res.status(401).json({ error: 'Invalid refresh token structure' });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.id },
            include: { profile: true }
        });

        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        // Generate new tokens
        const newToken = generateToken(user);
        const newRefreshToken = `refresh-${newToken}`;

        res.json({
            token: newToken,
            refreshToken: newRefreshToken
        });

    } catch (error) {
        console.error('Refresh Error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
};

exports.verify = async (req, res) => {
  const { target, contact } = req.body;
  setTimeout(() => {
    res.json({
      delivered: true,
      target,
      contact,
      code: '123456'
    });
  }, 1000);
};