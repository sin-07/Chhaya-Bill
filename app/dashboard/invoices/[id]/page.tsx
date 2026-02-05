'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import InvoiceLayout from '@/components/InvoiceLayout';
import { ArrowLeft } from 'lucide-react';
import { API_URL } from '@/lib/api';

interface Product {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  width?: number;
  height?: number;
  sqft?: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  products: Product[];
  totalAmount: number;
  previousDues: number;
  grandTotal: number;
  // New payment tracking fields
  billTotal?: number;      // Total bill amount (products total + previous dues)
  advancePaid?: number;    // Amount paid in advance by client
  dues?: number;           // Remaining amount = billTotal - advancePaid
  dateOfIssue: string;
  createdAt: string;
  updatedAt: string;
}

export default function ViewInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get<Invoice>(`${API_URL}/api/invoices/${params.id}`);
      setInvoice(response.data);
    } catch (error) {
      console.error('Failed to fetch invoice:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="no-print max-w-4xl mx-auto px-2 sm:px-4 py-2 sm:py-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>
      </div>
      <InvoiceLayout invoice={invoice} />
    </div>
  );
}
