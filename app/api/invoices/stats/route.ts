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
  // New payment tracking fields
  billTotal: { type: Number, default: 0 },
  advancePaid: { type: Number, default: 0 },
  dues: { type: Number, default: 0 },
  dateOfIssue: { type: Date, default: Date.now }
}, { timestamps: true });

type InvoiceDocument = mongoose.Document & {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  products: any[];
  totalAmount: number;
  previousDues: number;
  grandTotal: number;
  billTotal: number;
  advancePaid: number;
  dues: number;
  dateOfIssue: Date;
};

const Invoice: mongoose.Model<InvoiceDocument> = mongoose.models.Invoice || mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);

export async function GET() {
  try {
    await connectDB();
    const totalInvoices = await Invoice.countDocuments().exec();
    const invoices = await Invoice.find().exec();
    
    // Calculate total revenue (sum of all bill totals)
    const totalRevenue = invoices.reduce((sum, inv) => {
      // Use billTotal if available, otherwise fall back to grandTotal
      const bill = inv.billTotal || inv.grandTotal || 0;
      return sum + bill;
    }, 0);
    
    // Calculate pending dues (sum of all remaining dues)
    // This is the actual outstanding amount that clients still need to pay
    const pendingDues = invoices.reduce((sum, inv) => {
      // Use the stored dues if available, otherwise calculate from billTotal - advancePaid
      const billTotal = inv.billTotal || inv.grandTotal || 0;
      const advancePaid = inv.advancePaid || 0;
      const invoiceDues = inv.dues ?? (billTotal - advancePaid);
      return sum + Math.max(0, invoiceDues); // Ensure no negative dues
    }, 0);
    
    // Calculate total advance payments received
    const totalAdvancePaid = invoices.reduce((sum, inv) => {
      return sum + (inv.advancePaid || 0);
    }, 0);
    
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthlyInvoices = await Invoice.countDocuments({ createdAt: { $gte: startOfMonth } }).exec();
    
    return NextResponse.json({ 
      totalInvoices, 
      totalRevenue, 
      pendingDues, 
      totalAdvancePaid,
      monthlyInvoices 
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({ totalInvoices: 0, totalRevenue: 0, pendingDues: 0, totalAdvancePaid: 0 });
  }
}
