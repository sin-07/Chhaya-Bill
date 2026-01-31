import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const INVOICES_FILE = path.join(DATA_DIR, 'invoices.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize file if it doesn't exist
if (!fs.existsSync(INVOICES_FILE)) {
  fs.writeFileSync(INVOICES_FILE, JSON.stringify([]));
}

export interface Product {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  products: Product[];
  totalAmount: number;
  previousDues: number;
  grandTotal: number;
  dateOfIssue: string;
  createdAt: string;
  updatedAt: string;
}

export class InvoiceStorage {
  private static readInvoices(): Invoice[] {
    try {
      const data = fs.readFileSync(INVOICES_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  private static writeInvoices(invoices: Invoice[]): void {
    fs.writeFileSync(INVOICES_FILE, JSON.stringify(invoices, null, 2));
  }

  static getAll(): Invoice[] {
    return this.readInvoices();
  }

  static getById(id: string): Invoice | null {
    const invoices = this.readInvoices();
    return invoices.find(inv => inv._id === id) || null;
  }

  static create(invoice: Omit<Invoice, '_id' | 'createdAt' | 'updatedAt'>): Invoice {
    const invoices = this.readInvoices();
    const newInvoice: Invoice = {
      ...invoice,
      _id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    invoices.push(newInvoice);
    this.writeInvoices(invoices);
    return newInvoice;
  }

  static update(id: string, data: Partial<Invoice>): Invoice | null {
    const invoices = this.readInvoices();
    const index = invoices.findIndex(inv => inv._id === id);
    
    if (index === -1) return null;
    
    invoices[index] = {
      ...invoices[index],
      ...data,
      _id: invoices[index]._id,
      createdAt: invoices[index].createdAt,
      updatedAt: new Date().toISOString()
    };
    
    this.writeInvoices(invoices);
    return invoices[index];
  }

  static delete(id: string): boolean {
    const invoices = this.readInvoices();
    const filtered = invoices.filter(inv => inv._id !== id);
    
    if (filtered.length === invoices.length) return false;
    
    this.writeInvoices(filtered);
    return true;
  }

  static count(): number {
    return this.readInvoices().length;
  }
}
