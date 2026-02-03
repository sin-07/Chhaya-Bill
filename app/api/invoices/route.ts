import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dns from 'dns';
import { calculatePayment, calculateProductsTotal } from '@/lib/paymentCalculations';

// Set DNS servers to Google's public DNS to resolve Atlas SRV records
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chhaya-printing';

let isConnected = false;

async function connectDB() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unitCost: { type: Number, required: true },
  total: { type: Number, required: true },
  width: { type: Number, required: false },
  height: { type: Number, required: false },
  sqft: { type: Number, required: false }
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  clientName: { type: String, required: true },
  clientAddress: { type: String, required: true },
  products: [productSchema],
  totalAmount: { type: Number, required: true },
  previousDues: { type: Number, default: 0 },
  grandTotal: { type: Number, required: true },
  // New payment tracking fields
  billTotal: { type: Number, required: true, default: 0, min: 0 },
  advancePaid: { type: Number, required: true, default: 0, min: 0 },
  dues: { type: Number, required: true, default: 0, min: 0 },
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

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = 10;
    const skip = (page - 1) * limit;
    
    // Build search query
    const query: any = {};
    
    if (search) {
      query.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { clientName: { $regex: search, $options: 'i' } }
      ];
    }
    
    const total = await Invoice.countDocuments(query).exec();
    const invoices = await Invoice.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();
    
    const totalPages = Math.ceil(total / limit);
    
    return NextResponse.json({ 
      invoices, 
      totalPages, 
      currentPage: page, 
      total 
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json({ 
      invoices: [], 
      totalPages: 1, 
      currentPage: 1, 
      total: 0 
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();
    console.log('Received invoice data:', JSON.stringify(body, null, 2));
    
    if (!body.invoiceNumber) {
      const count = await Invoice.countDocuments().exec();
      body.invoiceNumber = `INV-${String(count + 1).padStart(4, '0')}`;
    }
    
    // Convert dateOfIssue string to Date if provided
    if (body.dateOfIssue && typeof body.dateOfIssue === 'string') {
      body.dateOfIssue = new Date(body.dateOfIssue);
    }
    
    // ===== PAYMENT CALCULATION LOGIC =====
    // Calculate products total
    const productsTotal = calculateProductsTotal(body.products || []);
    const previousDues = Number(body.previousDues) || 0;
    
    // Ensure products have width, height, sqft preserved - save as numbers
    body.products = (body.products || []).map((p: any) => {
      const product: any = {
        name: p.name,
        quantity: Number(p.quantity) || 0,
        unitCost: Number(p.unitCost) || 0,
        total: Number(p.total) || 0
      };
      
      // Only add width/height/sqft if they have actual values
      if (p.width !== undefined && p.width !== null && p.width !== '' && Number(p.width) > 0) {
        product.width = Number(p.width);
      }
      if (p.height !== undefined && p.height !== null && p.height !== '' && Number(p.height) > 0) {
        product.height = Number(p.height);
      }
      if (p.sqft !== undefined && p.sqft !== null && p.sqft !== '' && Number(p.sqft) > 0) {
        product.sqft = Number(p.sqft);
      }
      
      return product;
    });
    
    console.log('Products being saved:', JSON.stringify(body.products, null, 2));
    
    // Bill Total = Products Total + Previous Dues (this is the grandTotal in legacy terms)
    const billTotal = productsTotal + previousDues;
    body.totalAmount = productsTotal;
    body.grandTotal = billTotal;
    body.billTotal = billTotal;
    
    // Get advance payment (default to 0 if not provided)
    const advancePaid = Number(body.advancePaid) || 0;
    
    // Validate advance payment
    if (advancePaid < 0) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        message: 'Advance payment cannot be negative'
      }, { status: 400 });
    }
    
    if (advancePaid > billTotal) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        message: 'Advance payment cannot be greater than the total bill amount'
      }, { status: 400 });
    }
    
    // Calculate dues using the payment calculation function
    const paymentResult = calculatePayment(billTotal, advancePaid);
    body.advancePaid = paymentResult.advancePaid;
    body.dues = paymentResult.dues;
    // ===== END PAYMENT CALCULATION =====
    
    const invoice = new Invoice(body);
    console.log('Creating invoice:', invoice);
    console.log('Products with dimensions:', JSON.stringify(invoice.products, null, 2));
    
    await invoice.save();
    console.log('Invoice saved successfully');
    
    return NextResponse.json(invoice, { status: 201 });
  } catch (error: any) {
    console.error('Error creating invoice:', error);
    console.error('Error details:', error.message);
    if (error.errors) {
      console.error('Validation errors:', JSON.stringify(error.errors, null, 2));
    }
    return NextResponse.json({ 
      error: 'Failed to create invoice', 
      message: error.message,
      details: error.errors 
    }, { status: 500 });
  }
}
