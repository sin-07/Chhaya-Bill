import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { calculatePayment, calculateProductsTotal } from '@/lib/paymentCalculations';

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

const InvoiceModel: mongoose.Model<InvoiceDocument> = mongoose.models.Invoice || mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const invoice = await InvoiceModel.findById(id).exec();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const body = await request.json();
    
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
    
    console.log('Products being updated:', JSON.stringify(body.products, null, 2));
    
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
    
    console.log('Updating invoice with products:', JSON.stringify(body.products, null, 2));

    const invoice = await InvoiceModel.findByIdAndUpdate(id, body, { new: true, runValidators: true }).exec();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json(invoice);
  } catch (error: any) {
    console.error('Error updating invoice:', error);
    return NextResponse.json({ 
      error: 'Failed to update invoice',
      message: error.message 
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await connectDB();
    const { id } = await params;
    const invoice = await InvoiceModel.findByIdAndDelete(id).exec();
    if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    return NextResponse.json({ message: 'Invoice deleted successfully' });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return NextResponse.json({ error: 'Failed to delete invoice' }, { status: 500 });
  }
}
