const Product = require('../models/Product');
const Order = require('../models/Order');
const Coupon = require('../models/Coupon');
const { broadcastStockUpdate } = require('../src/socket'); // Adjust path as needed

exports.createOrder = async (req, res) => {
    try {
        const { products, couponCode } = req.body; // products: [{ productId, quantity }]

        if (!products || products.length === 0) {
            return res.status(400).json({ message: 'Order must have products' });
        }

        // Fetch products from DB to verify availability & get prices
        const productIds = products.map(p => p.productId);
        const dbProducts = await Product.find({ _id: { $in: productIds } });

        // Validate products and stock, calculate total price
        let total = 0;
        const orderProducts = [];

        for (const item of products) {
            const dbProduct = dbProducts.find(p => p._id.equals(item.productId));
            if (!dbProduct) {
                return res.status(400).json({ message: `Product ${item.productId} not found` });
            }
            if (dbProduct.stock < item.quantity) {
                return res.status(400).json({ message: `Insufficient stock for ${dbProduct.name}` });
            }

            total += dbProduct.price * item.quantity;
            orderProducts.push({
                productId: dbProduct._id,
                quantity: item.quantity,
                price: dbProduct.price
            });
        }



        // Apply coupon discount if provided
        let discountAmount = 0;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode.toUpperCase(), active: true });
            if (!coupon) return res.status(400).json({ message: 'Invalid coupon code' });
            if (coupon.expiresAt && coupon.expiresAt < new Date()) return res.status(400).json({ message: 'Coupon expired' });
            if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
                return res.status(400).json({ message: 'Coupon usage limit reached' });
            }

            // Calculate discount
            if (coupon.discountType === 'percentage') {
                discountAmount = (total * coupon.discountValue) / 100;
            } else if (coupon.discountType === 'fixed') {
                discountAmount = coupon.discountValue;
            }

            total = Math.max(0, total - discountAmount);

            // Increment used count and save coupon
            coupon.usedCount = (coupon.usedCount || 0) + 1;
            await coupon.save();
        }

        // Deduct stock and broadcast updated stock
        for (const item of products) {
            const updatedProduct = await Product.findByIdAndUpdate(
                item.productId,
                { $inc: { stock: -item.quantity } },
                { new: true }
            );
            broadcastStockUpdate(item.productId.toString(), updatedProduct.stock);
        }

        // Create the order
        const order = await Order.create({
            userId: req.user.id,
            products: orderProducts,
            total,
            discount: discountAmount,
            status: 'pending'
        });

        res.status(201).json(order);
    } catch (err) {
        console.error('Create order error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getProductById = async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
};

exports.updateProduct = async (req, res) => {
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(product);
};

exports.deleteProduct = async (req, res) => {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
};


exports.createProduct = async (req, res) => {
    try {
        console.log("Request body:", req.body);

        const product = await Product.create(req.body);

        console.log("Product created:", product);
        res.status(201).json(product);
    } catch (err) {
        console.error("Error creating product:", err);
        res.status(400).json({ message: err.message });
    }
};



exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.aggregate([
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category'
                }
            },
            {
                $unwind: '$category'
            },
            {
                $sort: { createdAt: -1 }
            }
        ]);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

