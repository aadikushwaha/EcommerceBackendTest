const express = require('express');
const router = express.Router();
const { getSalesReport, generatePdfReport } = require('../controllers/reportController');
const { protect, adminOnly } = require('../middlewares/authMiddlewares');

router.get('/sales', protect, adminOnly, getSalesReport);
router.get('/sales/pdf', protect, adminOnly, generatePdfReport);

module.exports = router;
