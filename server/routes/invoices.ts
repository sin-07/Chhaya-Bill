import express, { Request, Response } from 'express';
import Invoice from '../models/Invoice';
import authMiddleware from '../middleware/auth';

const router = express.Router();

// Get all invoices
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { search, startDate, endDate, page = '1', limit = '20' } = req.query;
    
    let query: any = {};

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
      if (startDate) query.dateOfIssue.$gte = new Date(startDate as string);
      if (endDate) query.dateOfIssue.$lte = new Date(endDate as string);
    }

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);

    const total = await Invoice.countDocuments(query);
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .limit(limitNum)
      .skip((pageNum - 1) * limitNum);

    res.json({
      invoices,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      total,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching invoices', error: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    
    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching invoice', error: error.message });
  }
});

// Get next invoice number
router.get('/meta/next-number', async (req: Request, res: Response): Promise<void> => {
  try {
    const lastInvoice = await Invoice.findOne().sort({ createdAt: -1 });
    
    let nextNumber = 1;
    if (lastInvoice && lastInvoice.invoiceNumber) {
      const currentNum = parseInt(lastInvoice.invoiceNumber.replace(/\D/g, ''));
      nextNumber = currentNum + 1;
    }

    res.json({ nextNumber: nextNumber.toString() });
  } catch (error: any) {
    res.status(500).json({ message: 'Error getting next invoice number', error: error.message });
  }
});

// Create invoice
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { invoiceNumber, clientName, clientAddress, products, previousDues, dateOfIssue } = req.body;

    // Calculate totals
    const totalAmount = products.reduce((sum: number, item: any) => sum + item.total, 0);
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating invoice', error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { clientName, clientAddress, products, previousDues, dateOfIssue } = req.body;

    // Calculate totals
    const totalAmount = products.reduce((sum: number, item: any) => sum + item.total, 0);
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
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.json(invoice);
  } catch (error: any) {
    res.status(500).json({ message: 'Error updating invoice', error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const invoice = await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      res.status(404).json({ message: 'Invoice not found' });
      return;
    }

    res.json({ message: 'Invoice deleted successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error deleting invoice', error: error.message });
  }
});

// Get statistics
router.get('/stats/summary', async (req: Request, res: Response): Promise<void> => {
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
  } catch (error: any) {
    res.status(500).json({ message: 'Error fetching statistics', error: error.message });
  }
});

export default router;
