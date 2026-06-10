/**
 * Health check route
 * GET /health → 200 { status: "ok" }
 */

const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

module.exports = router;
