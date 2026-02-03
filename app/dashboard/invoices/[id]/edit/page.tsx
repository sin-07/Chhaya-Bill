'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { 
  calculatePayment, 
  calculateProductsTotal, 
  formatCurrency,
  getPaymentStatus,
  getPaymentStatusBadge
} from '@/lib/paymentCalculations';

const API_URL = '';

interface Product {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
  width?: number;
  height?: number;
  sqft?: number;
}

interface FormData {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  dateOfIssue: string;
  previousDues: number;
  advancePaid: number;  // New field for advance payment
  products: Product[];
}

interface Invoice extends FormData {
  _id: string;
  totalAmount: number;
  grandTotal: number;
  billTotal: number;
  dues: number;
  createdAt: string;
  updatedAt: string;
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchingInvoice, setFetchingInvoice] = useState(true);
  const [paymentError, setPaymentError] = useState<string | null>(null);  // Payment validation error
  
  const [formData, setFormData] = useState<FormData>({
    invoiceNumber: '',
    clientName: '',
    clientAddress: '',
    dateOfIssue: '',
    previousDues: 0,
    advancePaid: 0,  // Initialize advance payment to 0
    products: [
      { name: '', quantity: 1, unitCost: 0, total: 0, width: undefined, height: undefined, sqft: undefined }
    ]
  });

  useEffect(() => {
    if (params.id) {
      fetchInvoice();
    }
  }, [params.id]);

  const fetchInvoice = async () => {
    try {
      const response = await axios.get<Invoice>(`${API_URL}/api/invoices/${params.id}`);
      
      const invoice = response.data;
      console.log('RAW API Response:', response.data);
      console.log('RAW Products from API:', invoice.products);
      
      // Map products with width, height, sqft values
      const productsWithDimensions = invoice.products.map(p => {
        console.log('Each product from API:', p, 'width:', p.width, 'height:', p.height);
        return {
          name: p.name,
          quantity: p.quantity,
          unitCost: p.unitCost,
          total: p.total,
          width: p.width,
          height: p.height,
          sqft: p.sqft
        };
      });
      
      console.log('Products with dimensions after mapping:', productsWithDimensions);
      
      setFormData({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        clientAddress: invoice.clientAddress,
        dateOfIssue: format(new Date(invoice.dateOfIssue), 'yyyy-MM-dd'),
        previousDues: invoice.previousDues || 0,
        advancePaid: invoice.advancePaid || 0,
        products: productsWithDimensions
      });
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Failed to fetch invoice');
    } finally {
      setFetchingInvoice(false);
    }
  };

  const handleProductChange = (index: number, field: keyof Product, value: string | number) => {
    const updatedProducts = [...formData.products];
    (updatedProducts[index] as any)[field] = value;

    // Auto-calculate sqft when width or height changes
    if (field === 'width' || field === 'height') {
      const width = parseFloat(updatedProducts[index].width?.toString() || '0') || 0;
      const height = parseFloat(updatedProducts[index].height?.toString() || '0') || 0;
      if (width > 0 && height > 0) {
        updatedProducts[index].sqft = Math.round((width * height) * 100) / 100;
      } else {
        updatedProducts[index].sqft = undefined;
      }
    }

    // Auto-calculate total
    // If sqft is available, use it as quantity multiplier
    if (field === 'quantity' || field === 'unitCost' || field === 'width' || field === 'height' || field === 'sqft') {
      const qty = parseFloat(updatedProducts[index].quantity.toString()) || 0;
      const cost = parseFloat(updatedProducts[index].unitCost.toString()) || 0;
      const sqft = updatedProducts[index].sqft || 0;
      
      // If sqft is set, use qty * sqft * cost, otherwise just qty * cost
      if (sqft > 0) {
        updatedProducts[index].total = Math.round((qty * sqft * cost) * 100) / 100;
      } else {
        updatedProducts[index].total = Math.round((qty * cost) * 100) / 100;
      }
    }

    setFormData({ ...formData, products: updatedProducts });
  };

  const addProduct = () => {
    setFormData({
      ...formData,
      products: [...formData.products, { name: '', quantity: 1, unitCost: 0, total: 0, width: undefined, height: undefined, sqft: undefined }]
    });
  };

  const removeProduct = (index: number) => {
    if (formData.products.length > 1) {
      const updatedProducts = formData.products.filter((_, i) => i !== index);
      setFormData({ ...formData, products: updatedProducts });
    }
  };

  /**
   * Calculate all invoice totals using the centralized payment calculation logic
   * This ensures consistency between UI, database, and PDF
   */
  const calculateTotals = () => {
    // Calculate products total
    const totalAmount = calculateProductsTotal(formData.products);
    const previousDues = parseFloat(formData.previousDues.toString()) || 0;
    
    // Bill Total = Products Total + Previous Dues (this is the grand total before advance payment)
    const billTotal = totalAmount + previousDues;
    
    // Use centralized payment calculation for advance payment and dues
    const paymentResult = calculatePayment(billTotal, formData.advancePaid);
    
    return { 
      totalAmount,           // Products total
      previousDues,          // Previous outstanding dues
      billTotal,             // Grand total (totalAmount + previousDues)
      grandTotal: billTotal, // Legacy field - same as billTotal
      advancePaid: paymentResult.advancePaid,
      dues: paymentResult.dues,
      isValid: paymentResult.isValid,
      errorMessage: paymentResult.errorMessage
    };
  };

  /**
   * Handle advance payment input change with real-time validation
   * This allows admin to dynamically update the advance payment
   */
  const handleAdvancePaymentChange = (value: string) => {
    const advancePaid = parseFloat(value) || 0;
    
    // Update form data
    setFormData({ ...formData, advancePaid });
    
    // Calculate totals using the current form data (before update)
    const totalAmount = calculateProductsTotal(formData.products);
    const previousDues = parseFloat(formData.previousDues.toString()) || 0;
    const billTotal = totalAmount + previousDues;
    
    // Validate the new advance payment value
    const paymentResult = calculatePayment(billTotal, advancePaid);
    
    // Set or clear error message
    if (!paymentResult.isValid) {
      setPaymentError(paymentResult.errorMessage || 'Invalid advance payment');
    } else {
      setPaymentError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate totals and validate before submission
    const totals = calculateTotals();
    
    // Check for payment validation errors
    if (!totals.isValid) {
      toast.error(totals.errorMessage || 'Invalid payment details');
      return;
    }
    
    setLoading(true);

    // Explicitly build products with all fields
    const productsData = formData.products.map(p => {
      console.log('Product before update:', p);
      return {
        name: p.name,
        quantity: p.quantity,
        unitCost: p.unitCost,
        total: p.total,
        width: p.width,
        height: p.height,
        sqft: p.sqft
      };
    });

    const invoiceData = {
      invoiceNumber: formData.invoiceNumber,
      clientName: formData.clientName,
      clientAddress: formData.clientAddress,
      dateOfIssue: formData.dateOfIssue,
      previousDues: formData.previousDues,
      advancePaid: totals.advancePaid,
      products: productsData,
      totalAmount: totals.totalAmount,
      grandTotal: totals.grandTotal,
      billTotal: totals.billTotal,
      dues: totals.dues
    };

    console.log('Updating invoice data:', JSON.stringify(invoiceData, null, 2));

    try {
      await axios.put(`${API_URL}/api/invoices/${params.id}`, invoiceData);

      toast.success('Invoice updated successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update invoice');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingInvoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  const { totalAmount, grandTotal, billTotal, advancePaid, dues, isValid } = calculateTotals();
  const paymentStatus = getPaymentStatus(dues, billTotal);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.push('/dashboard')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Edit Invoice #{formData.invoiceNumber}</h1>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-8">
          {/* Invoice Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice Number
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date of Issue
              </label>
              <input
                type="date"
                value={formData.dateOfIssue}
                onChange={(e) => setFormData({ ...formData, dateOfIssue: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Client Details */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Client Information</h2>
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Name *
                </label>
                <input
                  type="text"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Client Address *
                </label>
                <input
                  type="text"
                  value={formData.clientAddress}
                  onChange={(e) => setFormData({ ...formData, clientAddress: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Previous Dues (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.previousDues || ''}
                  onChange={(e) => setFormData({ ...formData, previousDues: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter previous dues if any"
                />
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Products</h2>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                <Plus size={18} />
                Add Product
              </button>
            </div>

            <div className="space-y-4">
              {formData.products.map((product, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded">
                  <div className="grid grid-cols-12 gap-4 items-start mb-4">
                    <div className="col-span-12 md:col-span-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => handleProductChange(index, 'name', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={product.quantity}
                        onChange={(e) => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit Cost (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.unitCost}
                        onChange={(e) => handleProductChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div className="col-span-4 md:col-span-2 flex items-end">
                      <button
                        type="button"
                        onClick={() => removeProduct(index)}
                        disabled={formData.products.length === 1}
                        className="w-full p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-30 disabled:cursor-not-allowed border border-gray-300"
                        title="Remove Product"
                      >
                        <Trash2 size={20} className="mx-auto" />
                      </button>
                    </div>
                  </div>

                  {/* Square Footage Section */}
                  <div className="grid grid-cols-12 gap-4 items-end">
                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Width (ft) <span className="text-gray-500 text-xs">- Optional</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.width || ''}
                        onChange={(e) => handleProductChange(index, 'width', parseFloat(e.target.value) || 0)}
                        placeholder="Width"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Height (ft) <span className="text-gray-500 text-xs">- Optional</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={product.height || ''}
                        onChange={(e) => handleProductChange(index, 'height', parseFloat(e.target.value) || 0)}
                        placeholder="Height"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Sq.Ft {product.sqft ? `(${product.sqft.toFixed(2)})` : ''}
                      </label>
                      <input
                        type="number"
                        value={product.sqft || ''}
                        readOnly
                        placeholder="Auto-calculated"
                        className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50"
                      />
                    </div>

                    <div className="col-span-12 md:col-span-3">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Total (₹)
                      </label>
                      <input
                        type="number"
                        value={product.total}
                        readOnly
                        className="w-full px-4 py-2 border border-gray-300 rounded bg-gray-50 font-semibold"
                      />
                    </div>
                  </div>

                  {product.sqft && (
                    <div className="mt-2 text-xs text-gray-600 bg-blue-50 p-2 rounded">
                      <strong>Calculation:</strong> Qty ({product.quantity}) × Sq.Ft ({product.sqft.toFixed(2)}) × Unit Cost (₹{product.unitCost}) = ₹{product.total.toFixed(2)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-gray-50 rounded-lg p-6 mb-8">
            <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
            <div className="max-w-md ml-auto space-y-3">
              {/* Products Total */}
              <div className="flex justify-between text-lg">
                <span className="font-medium">Products Total:</span>
                <span className="font-semibold">{formatCurrency(totalAmount)}</span>
              </div>
              
              {/* Previous Dues */}
              <div className="flex justify-between text-lg">
                <span className="font-medium">Previous Dues:</span>
                <span className="font-semibold">{formatCurrency(parseFloat(formData.previousDues.toString()) || 0)}</span>
              </div>
              
              {/* Bill Total (Grand Total) */}
              <div className="flex justify-between text-xl border-t-2 border-gray-300 pt-3">
                <span className="font-bold">Grand Total:</span>
                <span className="font-bold text-blue-600">{formatCurrency(billTotal)}</span>
              </div>
              
              {/* Advance Payment Input - EDITABLE */}
              <div className="pt-3 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Advance Payment (₹) - <span className="text-blue-600">Editable</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max={billTotal}
                  value={formData.advancePaid || ''}
                  onChange={(e) => handleAdvancePaymentChange(e.target.value)}
                  className={`w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    paymentError ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter advance payment amount"
                />
                {/* Payment Error Message */}
                {paymentError && (
                  <div className="mt-2 flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle size={16} />
                    <span>{paymentError}</span>
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  You can modify the advance payment amount. Dues will be recalculated automatically.
                </p>
              </div>
              
              {/* Advance Paid Display */}
              <div className="flex justify-between text-lg">
                <span className="font-medium">Advance Paid:</span>
                <span className="font-semibold text-green-600">- {formatCurrency(advancePaid)}</span>
              </div>
              
              {/* Dues / Balance */}
              <div className="flex justify-between text-xl border-t-2 border-gray-300 pt-3">
                <span className="font-bold">
                  Dues / Balance:
                  <span className={`ml-2 text-xs px-2 py-1 rounded-full ${getPaymentStatusBadge(paymentStatus)}`}>
                    {paymentStatus === 'paid' ? 'PAID' : paymentStatus === 'partial' ? 'PARTIAL' : 'UNPAID'}
                  </span>
                </span>
                <span className={`font-bold ${dues > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(dues)}
                </span>
              </div>
              
              {/* Payment Info Box */}
              {dues === 0 && advancePaid > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  ✓ Invoice is fully paid. No remaining balance.
                </div>
              )}
              {dues > 0 && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-yellow-700 text-sm">
                  ⚠ Remaining balance of {formatCurrency(dues)} is due.
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <button
              type="submit"
              disabled={loading || !isValid}
              className="flex-1 px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating Invoice...' : 'Update Invoice'}
            </button>
            <button
              type="button"
              onClick={() => router.push('/dashboard')}
              className="px-6 py-3 border border-gray-300 rounded hover:bg-gray-50 font-semibold"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
