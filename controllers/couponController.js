const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
    try {
        const coupon = await Coupon.create(req.body);
        res.status(201).json(coupon);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.getAllCoupons = async (req, res) => {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
};

exports.getCouponByCode = async (req, res) => {
    const coupon = await Coupon.findOne({ code: req.params.code.toUpperCase(), active: true });
    if (!coupon) return res.status(404).json({ message: 'Coupon not found or inactive' });
    res.json(coupon);
};

exports.updateCoupon = async (req, res) => {
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(coupon);
};

exports.deleteCoupon = async (req, res) => {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ message: 'Coupon deleted' });
};
