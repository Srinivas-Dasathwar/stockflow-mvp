import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { dbOps } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'stockflow_mvp_jwt_secret_dev_key_2026';
const JWT_EXPIRES_IN = '7d';

export function hashPassword(password) {
  const salt = bcrypt.genSaltSync(10);
  return bcrypt.hashSync(password, salt);
}

export function comparePassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded || !decoded.userId || !decoded.orgId) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  const user = dbOps.getUserById(decoded.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  const org = dbOps.getOrgById(user.organization_id);
  if (!org) {
    return res.status(401).json({ error: 'Unauthorized: Organization not found' });
  }

  req.user = {
    id: user.id,
    email: user.email,
    organizationId: user.organization_id,
  };
  req.org = org;

  next();
}
