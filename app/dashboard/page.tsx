'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  Plus, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  FileText,
  IndianRupee,
  Clock,
  LogOut,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { getPaymentStatus, getPaymentStatusBadge, formatCurrency } from '@/lib/paymentCalculations';
import { API_URL } from '@/lib/api';

interface Product {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
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
  billTotal?: number;
  advancePaid?: number;
  dues?: number;
  dateOfIssue: string;
  createdAt: string;
  updatedAt: string;
}

interface Stats {
  totalInvoices: number;
  totalRevenue: number;
  pendingDues: number;
}

interface InvoicesResponse {
  invoices: Invoice[];
  totalPages: number;
  currentPage: number;
  total: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loggingOut, setLoggingOut] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const response = await axios.get<Stats>(`${API_URL}/api/invoices/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  }, []);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      params.append('page', currentPage.toString());
      const response = await axios.get<InvoicesResponse>(`${API_URL}/api/invoices?${params}`);
      setInvoices(response.data.invoices);
      setTotalPages(response.data.totalPages);
    } catch (error) {
      toast.error('Failed to fetch invoices');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, currentPage]);

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      fetchInvoices();
    }, 300);
    return () => clearTimeout(debounceTimer);
  }, [fetchInvoices]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleDelete = async (id: string, invoiceNumber: string) => {
    if (!confirm(`Are you sure you want to delete Invoice #${invoiceNumber}?`)) {
      return;
    }
    try {
      await axios.delete(`${API_URL}/api/invoices/${id}`);
      toast.success('Invoice deleted successfully');
      fetchInvoices();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete invoice');
    }
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await axios.post(`${API_URL}/api/auth/logout`);
      toast.success('Logged out successfully');
      // Use window.location for full page reload to clear all state and trigger middleware
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      setLoggingOut(false);
      // Even if logout API fails, force redirect and clear cookie client-side
      document.cookie = 'admin-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      window.location.href = '/login';
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-neutral-900 rounded-lg flex items-center justify-center">
                <FileText className="text-white" size={18} />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-neutral-900">Chhaya Printing</h1>
                <p className="text-xs text-neutral-500 -mt-0.5">Admin Dashboard</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              {loggingOut ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <LogOut size={16} />
              )}
              <span className="hidden sm:inline">{loggingOut ? 'Logging out...' : 'Logout'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <FileText className="text-neutral-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total Invoices</p>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalInvoices}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <IndianRupee className="text-neutral-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-neutral-900">₹{stats.totalRevenue.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-neutral-200 p-5 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-neutral-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-neutral-700" size={20} />
                </div>
                <div>
                  <p className="text-sm text-neutral-500">Pending Dues</p>
                  <p className="text-2xl font-bold text-neutral-900">₹{stats.pendingDues.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 w-full sm:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={18} />
              <input
                type="text"
                placeholder="Search by invoice # or client name..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-neutral-50 placeholder:text-neutral-400"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            <button
              onClick={() => router.push('/dashboard/invoices/new')}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 active:bg-black transition-colors shadow-sm shrink-0"
            >
              <Plus size={18} />
              New Invoice
            </button>
          </div>
        </div>

        {/* Invoice Table */}
        <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50/80">
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Invoice</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Client</th>
                  <th className="text-left text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden md:table-cell">Date</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Total</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Paid</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Dues</th>
                  <th className="text-center text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Status</th>
                  <th className="text-right text-xs font-medium text-neutral-500 uppercase tracking-wider px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Loader2 className="w-6 h-6 text-neutral-900 animate-spin" />
                        <p className="text-sm text-neutral-500">Loading invoices...</p>
                      </div>
                    </td>
                  </tr>
                ) : invoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-16 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <FileText className="text-neutral-300" size={32} />
                        <p className="text-sm text-neutral-500">
                          {searchTerm ? 'No invoices match your search' : 'No invoices yet. Create your first one!'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  invoices.map((invoice) => {
                    const billTotal = invoice.billTotal ?? invoice.grandTotal;
                    const advancePaid = invoice.advancePaid ?? 0;
                    const dues = invoice.dues ?? (billTotal - advancePaid);
                    const paymentStatus = getPaymentStatus(dues, billTotal);
                    
                    return (
                      <tr key={invoice._id} className="hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3">
                          <span className="text-sm font-medium text-neutral-900">#{invoice.invoiceNumber}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-700">{invoice.clientName}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className="text-sm text-neutral-500">{format(new Date(invoice.dateOfIssue), 'dd MMM yyyy')}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-medium text-neutral-900">{formatCurrency(billTotal)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden lg:table-cell">
                          <span className="text-sm text-neutral-600">{formatCurrency(advancePaid)}</span>
                        </td>
                        <td className="px-4 py-3 text-right hidden sm:table-cell">
                          <span className={`text-sm font-medium ${dues > 0 ? 'text-neutral-900' : 'text-neutral-600'}`}>
                            {formatCurrency(dues)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center hidden sm:table-cell">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadge(paymentStatus)}`}>
                            {paymentStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              onClick={() => router.push(`/dashboard/invoices/${invoice._id}`)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                              title="View"
                            >
                              <Eye size={16} />
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/invoices/${invoice._id}/edit`)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-md transition-colors"
                              title="Edit"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(invoice._id, invoice.invoiceNumber)}
                              className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-md transition-colors"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 border-t border-neutral-200 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-1">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 border border-neutral-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 border border-neutral-200 rounded-md disabled:opacity-30 disabled:cursor-not-allowed hover:bg-neutral-50 transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
