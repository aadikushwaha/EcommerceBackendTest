const Order = require('../models/Order');
const Product = require('../models/Product');
const Category = require('../models/Category');
const PDFDocument = require('pdfkit');
const moment = require('moment');

const getDateRange = (period) => {
    const end = moment().endOf('day').toDate();
    let start;
    switch (period) {
        case 'daily':
            start = moment().startOf('day').toDate();
            break;
        case 'weekly':
            start = moment().startOf('week').toDate();
            break;
        case 'monthly':
            start = moment().startOf('month').toDate();
            break;
        default:
            start = moment().startOf('day').toDate();
    }
    return { start, end };
};

exports.getSalesReport = async (req, res) => {
    try {
        const period = req.query.period || 'daily';
        const { start, end } = getDateRange(period);

        // Aggregate total sales and revenue by product
        const salesByProduct = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalQuantity: { $sum: '$products.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 0,
                    productId: '$product._id',
                    productName: '$product.name',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    categoryId: '$product.categoryId'
                }
            }
        ]);

        // Aggregate revenue by category
        const categoryIds = salesByProduct.map(s => s.categoryId);
        const categories = await Category.find({ _id: { $in: categoryIds } });

        const revenueByCategory = categories.map(category => {
            const totalRevenue = salesByProduct
                .filter(s => s.categoryId.equals(category._id))
                .reduce((sum, s) => sum + s.totalRevenue, 0);
            return {
                categoryId: category._id,
                categoryName: category.name,
                totalRevenue
            };
        });

        res.json({ period, salesByProduct, revenueByCategory });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.generatePdfReport = async (req, res) => {
    try {
        const period = req.query.period || 'daily';
        const { start, end } = getDateRange(period);

        // Get sales data (reuse the aggregation logic)
        const salesData = await Order.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end },
                    status: { $ne: 'cancelled' }
                }
            },
            { $unwind: '$products' },
            {
                $group: {
                    _id: '$products.productId',
                    totalQuantity: { $sum: '$products.quantity' },
                    totalRevenue: { $sum: { $multiply: ['$products.quantity', '$products.price'] } }
                }
            },
            {
                $lookup: {
                    from: 'products',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            { $unwind: '$product' },
            {
                $project: {
                    _id: 0,
                    productName: '$product.name',
                    totalQuantity: 1,
                    totalRevenue: 1,
                    categoryId: '$product.categoryId'
                }
            }
        ]);

        const categoryIds = salesData.map(s => s.categoryId);
        const categories = await Category.find({ _id: { $in: categoryIds } });

        const revenueByCategory = categories.map(category => {
            const totalRevenue = salesData
                .filter(s => s.categoryId.equals(category._id))
                .reduce((sum, s) => sum + s.totalRevenue, 0);
            return {
                categoryName: category.name,
                totalRevenue
            };
        });

        // Create PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=sales_report_${period}.pdf`);

        doc.fontSize(20).text(`Sales Report (${period.toUpperCase()})`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(14).text('Sales by Product:');
        salesData.forEach(item => {
            doc.text(
                `${item.productName} - Quantity Sold: ${item.totalQuantity}, Revenue: $${item.totalRevenue.toFixed(2)}`
            );
        });

        doc.moveDown();
        doc.text('Revenue by Category:');
        revenueByCategory.forEach(cat => {
            doc.text(`${cat.categoryName}: $${cat.totalRevenue.toFixed(2)}`);
        });

        doc.end();
        doc.pipe(res);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
