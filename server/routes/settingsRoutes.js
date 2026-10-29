import express from 'express';
import { dbOps } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/settings
router.get('/', (req, res) => {
  try {
    const org = dbOps.getOrgById(req.user.organizationId);
    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }
    return res.json({
      organization: {
        id: org.id,
        name: org.name,
        default_low_stock_threshold: org.default_low_stock_threshold,
        created_at: org.created_at,
      },
    });
  } catch (err) {
    console.error('Settings fetch error:', err);
    return res.status(500).json({ error: 'Failed to retrieve settings' });
  }
});

// PUT /api/settings
router.put('/', (req, res) => {
  try {
    const { name, default_low_stock_threshold } = req.body;

    if (default_low_stock_threshold !== undefined) {
      const threshold = parseInt(default_low_stock_threshold, 10);
      if (isNaN(threshold) || threshold < 0) {
        return res.status(400).json({ error: 'Default low stock threshold must be a non-negative integer.' });
      }
    }

    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ error: 'Organization name cannot be empty.' });
    }

    const updated = dbOps.updateOrg(req.user.organizationId, {
      name,
      default_low_stock_threshold,
    });

    return res.json({
      message: 'Settings updated successfully',
      organization: {
        id: updated.id,
        name: updated.name,
        default_low_stock_threshold: updated.default_low_stock_threshold,
        created_at: updated.created_at,
      },
    });
  } catch (err) {
    console.error('Settings update error:', err);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
