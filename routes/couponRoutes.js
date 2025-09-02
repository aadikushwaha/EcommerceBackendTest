const express = require('express');
const router = express.Router();
const {
    createCoupon,
    getAllCoupons,
    getCouponByCode,
    updateCoupon,
    deleteCoupon
} = require('../controllers/couponController');

const { protect, adminOnly } = require('../middlewares/authMiddlewares');

router.get('/', protect, adminOnly, getAllCoupons);
router.get('/:code', protect, getCouponByCode);

// Admin only
router.post('/', protect, adminOnly, createCoupon);
router.put('/:id', protect, adminOnly, updateCoupon);
router.delete('/:id', protect, adminOnly, deleteCoupon);

module.exports = router;
