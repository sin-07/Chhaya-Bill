import { NextResponse } from 'next/server';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chhaya-printing';
let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  products: [{ name: String, quantity: Number, unitCost: Number, total: Number }],
  totalAmount: { type: Number, required: true },
  previousDues: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  dateOfIssue: { type: Date, default: Date.now }
}, { timestamps: true });

const Invoice = mongoose.models.Invoice || mongoose.model('Invoice', invoiceSchema);

export async function GET() {
  try {
    await connectDB();
    const totalInvoices = await Invoice.countDocuments();
    const invoices = await Invoice.find();
    const totalRevenue = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const totalDues = invoices.reduce((sum, inv) => sum + inv.previousDues, 0);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyInvoices = await Invoice.countDocuments({ createdAt: { $gte: startOfMonth } });
    return NextResponse.json({ totalInvoices, totalRevenue, pendingDues: totalDues, monthlyInvoices });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ totalInvoices: 0, totalRevenue: 0, pendingDues: 0 });
  }
}
