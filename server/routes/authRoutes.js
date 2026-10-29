import express from 'express';
import { dbOps } from '../db.js';
import { hashPassword, comparePassword, generateToken, requireAuth } from '../auth.js';

const router = express.Router();

// POST /api/auth/signup
router.post('/signup', (req, res) => {
  try {
    const { email, password, organizationName } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (!organizationName || organizationName.trim().length === 0) {
      return res.status(400).json({ error: 'Organization name is required.' });
    }

    const existingUser = dbOps.getUserByEmail(email);
    if (existingUser) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Create organization
    const org = dbOps.createOrg(organizationName.trim(), 5);

    // Create user
    const passwordHash = hashPassword(password);
    const user = dbOps.createUser({
      organization_id: org.id,
      email: email.trim(),
      password_hash: passwordHash,
    });

    const token = generateToken({
      userId: user.id,
      orgId: org.id,
      email: user.email,
    });

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: org.id,
      },
      org: {
        id: org.id,
        name: org.name,
        default_low_stock_threshold: org.default_low_stock_threshold,
      },
    });
  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

// POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = dbOps.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const valid = comparePassword(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const org = dbOps.getOrgById(user.organization_id);
    if (!org) {
      return res.status(500).json({ error: 'Associated organization not found.' });
    }

    const token = generateToken({
      userId: user.id,
      orgId: org.id,
      email: user.email,
    });

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        organizationId: org.id,
      },
      org: {
        id: org.id,
        name: org.name,
        default_low_stock_threshold: org.default_low_stock_threshold,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Failed to log in. Please try again.' });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: req.user,
    org: {
      id: req.org.id,
      name: req.org.name,
      default_low_stock_threshold: req.org.default_low_stock_threshold,
    },
  });
});

export default router;
