import express from 'express';
import { dbOps } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/dashboard
router.get('/', (req, res) => {
  try {
    const summary = dbOps.getDashboardSummary(req.user.organizationId);
    return res.json({
      summary: {
        ...summary,
        organizationName: req.org.name,
      },
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ error: 'Failed to load dashboard summary' });
  }
});

export default router;
