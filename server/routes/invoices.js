const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const authMiddleware = require('../middleware/auth');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const { search, startDate, endDate, page = 1, limit = 20 } = req.query;
    
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } },
      ];
    }

    // Date filter
    if (startDate || endDate) {
      query.dateOfIssue = {};
      if (startDate) query.dateOfIssue.$gte = new Date(startDate);
      if (endDate) query.dateOfIssue.$lte = new Date(endDate);
    }

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    res.json({
      invoices,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Get next invoice number
router.get('/meta/next-number', async (req, res) => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const currentNum = parseInt(lastInvoice.invoiceNumber.replace(/\D/g, ''));
      nextNumber = currentNum + 1;
    }

    res.json({ nextNumber: nextNumber.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error getting next invoice number', error: error.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const { invoiceNumber, clientName, clientAddress, products, previousDues, dateOfIssue } = req.body;

    // Calculate totals
    const totalAmount = products.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = totalAmount + (previousDues || 0);

    const invoice = new Invoice({
      invoiceNumber,
      clientName,
      clientAddress,
      products,
      totalAmount,
      previousDues: previousDues || 0,
      grandTotal,
      dateOfIssue: dateOfIssue || new Date(),
    });

    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const { clientName, clientAddress, products, previousDues, dateOfIssue } = req.body;

    // Calculate totals
    const totalAmount = products.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = totalAmount + (previousDues || 0);

    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      {
        clientName,
        clientAddress,
        products,
        totalAmount,
        previousDues: previousDues || 0,
        grandTotal,
        dateOfIssue,
        updatedAt: Date.now(),
      },
      { new: true }
    );

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json(invoice);
  } catch (error) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalInvoices = await Invoice.countDocuments();
    const totalRevenue = await Invoice.aggregate([
      { $group: { _id: null, total: { $sum: '$grandTotal' } } }
    ]);
    const pendingDues = await Invoice.aggregate([
      { $match: { previousDues: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$previousDues' } } }
    ]);

    res.json({
      totalInvoices,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingDues: pendingDues[0]?.total || 0,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

module.exports = router;
