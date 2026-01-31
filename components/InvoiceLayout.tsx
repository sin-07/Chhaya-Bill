'use client';

import { useRef, useEffect, useState } from 'react';
import { format } from 'date-fns';
import QRCode from 'qrcode';
import { Printer, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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
  _id?: string;
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  products: Product[];
  totalAmount: number;
  previousDues: number;
  grandTotal: number;
  dateOfIssue: string;
  createdAt?: string;
  updatedAt?: string;
}

interface InvoiceLayoutProps {
  invoice: Invoice | null;
  onPrint?: () => void;
  onDownload?: () => void;
}

/**
 * EXACT replica of the Chhaya Printing Solution invoice
 * Based on the physical invoice image provided
 */
export default function InvoiceLayout({ invoice, onPrint, onDownload }: InvoiceLayoutProps) {
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState('');

  useEffect(() => {
    if (invoice) {
      const qrData = JSON.stringify({
        invoiceNumber: invoice.invoiceNumber,
        clientName: invoice.clientName,
        grandTotal: invoice.grandTotal,
        date: invoice.dateOfIssue,
      });

      QRCode.toDataURL(qrData, { 
        width: 100, 
        margin: 1,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })
        .then(url => setQrCodeUrl(url))
        .catch(err => console.error(err));
    }
  }, [invoice]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    if (!invoiceRef.current || !invoice) return;

    const element = invoiceRef.current;
    const canvas = await html2canvas(element, {
      scale: 3,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
    } as any);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
  };

  if (!invoice) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">No invoice data</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200 py-8">
      {/* Action Buttons - Hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex gap-4 justify-end px-4">
        <button
          onClick={handlePrint}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          <Printer size={18} />
          Print Invoice
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          <Download size={18} />
          Download PDF
        </button>
      </div>

      {/* Invoice - A4 Size Paper - EXACT LAYOUT FROM IMAGE */}
      <div 
        ref={invoiceRef} 
        className="mx-auto bg-white shadow-xl print-full-page"
        style={{
          width: '210mm',
          minHeight: '297mm',
          padding: '12mm 15mm',
          fontFamily: 'Arial, sans-serif',
          position: 'relative',
        }}
      >
        {/* ============ HEADER SECTION ============ */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
          {/* Left Side - Company Info */}
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              letterSpacing: '1px',
              marginBottom: '0px',
              lineHeight: '1.2',
            }}>
              <span style={{ color: '#4D55CC' }}>CHHAYA </span>
              <span style={{ color: '#228B22' }}>PRINTING </span>
              <span style={{ color: '#000000' }}>SOLUTION</span>
            </h1>
            <p style={{ fontSize: '13px', margin: '2px 0', color: '#0C0950', fontWeight: 'bold' }}>
              (A Complete Advertising Solution)
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>
              Bajrangpuri,Opposite to Power Grid Patna 800007
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>
              Mob:- 8507217478, 7739694140
            </p>
          </div>

          {/* Right Side - Logo Image */}
          <div style={{ width: '90px', height: '90px' }}>
            <img 
              src="/logoC.jpeg?v=2" 
              alt="Chhaya Printing Solution Logo" 
              style={{ width: '90px', height: '90px', objectFit: 'contain' }}
              onError={(e) => { console.error('Logo failed to load'); }}
            />
         
          </div>
        </div>

        {/* ============ BILLED TO SECTION ============ */}
        <div style={{ marginBottom: '15px' }}>
          <p style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '3px' }}>
            BILLED TO
          </p>
          <p style={{ fontSize: '14px', color: '#cc0000', fontWeight: '500', marginBottom: '2px' }}>
            {invoice.clientName}
          </p>
          <p style={{ fontSize: '12px' }}>
            {invoice.clientAddress}
          </p>
        </div>

        {/* ============ MAIN CONTENT AREA ============ */}
        <div style={{ display: 'flex', gap: '10px' }}>
          
          {/* LEFT COLUMN - Invoice Number & Date */}
          <div style={{ width: '120px', paddingTop: '25px' }}>
            <div style={{ marginBottom: '15px' }}>
              <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>INVOICE NUMBER</p>
              <p style={{ fontSize: '12px' }}>
                {invoice.invoiceNumber}
              </p>
            </div>
            <div>
              <p style={{ fontSize: '10px', fontWeight: 'bold', marginBottom: '2px' }}>DATE OF ISSUE</p>
              <p style={{ fontSize: '12px' }}>
                {format(new Date(invoice.dateOfIssue), 'dd/MM/yyyy')}
              </p>
            </div>
          </div>

          {/* MIDDLE - Product Table & Totals */}
          <div style={{ flex: 1 }}>
            {/* Single Unified Invoice Table */}
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '11px',
              tableLayout: 'fixed'
            }}>
              <thead>
                <tr>
                  <th style={{ ...tableHeaderStyle, width: '40px' }}>S.NO</th>
                  <th style={{ ...tableHeaderStyle, width: 'auto' }}>Product</th>
                  <th style={{ ...tableHeaderStyle, width: '60px' }}>QYT</th>
                  <th style={{ ...tableHeaderStyle, width: '80px' }}>Unit/cost</th>
                  <th style={{ ...tableHeaderStyle, width: '80px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.products.map((product, index) => (
                  <tr key={index}>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: '500' }}>
                      {product.name}
                      {product.sqft && (
                        <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '2px', fontWeight: 'normal' }}>
                          [{product.width}ft × {product.height}ft = {product.sqft.toFixed(2)} sq.ft]
                        </span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.quantity}
                      {product.sqft && (
                        <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '1px' }}>
                          pcs
                        </span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.unitCost}
                      {product.sqft && (
                        <span style={{ fontSize: '8px', color: '#555', display: 'block', marginTop: '1px' }}>
                          /sq.ft
                        </span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.total}
                    </td>
                  </tr>
                ))}
                {/* Total Row */}
                <tr>
                  <td style={{ border: 'none' }} colSpan={3}></td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#FFFF00', textAlign: 'center' }}>
                    Total
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                    {invoice.totalAmount}
                  </td>
                </tr>
                {/* ADV PAID Row */}
                <tr>
                  <td style={{ border: 'none' }} colSpan={3}></td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold',  textAlign: 'center' }}>
                    ADV PAID
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold' }}>
                    {invoice.previousDues}
                  </td>
                </tr>
                {/* GRAND TOTAL Row */}
                <tr>
                  <td style={{ border: 'none' }} colSpan={3}></td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#D3D3D3', textAlign: 'center' }}>
                    GRAND TOTAL
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center',backgroundColor: '#D3D3D3', fontWeight: 'bold' }}>
                    {invoice.grandTotal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* RIGHT COLUMN - QR Code Section */}
          <div style={{ width: '110px', textAlign: 'center', paddingLeft: '10px' }}>
            <p style={{ 
              fontSize: '8px', 
              color: '#cc0000', 
              marginBottom: '3px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              ACCEPTED HERE
            </p>
            <p style={{ 
              fontSize: '7px', 
              color: '#666', 
              marginBottom: '5px',
              textAlign: 'center'
            }}>
              Scan & Pay Using PhonePe App
            </p>
            {qrCodeUrl && (
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                style={{ 
                  width: '90px', 
                  height: '90px',
                  margin: '0 auto',
                  display: 'block'
                }}
              />
            )}
            <p style={{ 
              fontSize: '7px', 
              color: '#cc0000', 
              marginTop: '5px',
              textAlign: 'center',
              fontWeight: 'bold'
            }}>
              MR SHUBHAM KUMAR
            </p>
          </div>
        </div>

        {/* ============ BOTTOM SIGNATURE AREA ============ */}
        <div style={{ 
          position: 'absolute', 
          bottom: '60mm', 
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <p style={{ 
            fontFamily: 'cursive', 
            fontSize: '24px',
            color: '#000',
            fontStyle: 'italic'
          }}>
            Total
          </p>
        </div>
      </div>
    </div>
  );
}

// Style constants for consistency
const tableHeaderStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '5px 6px',
  backgroundColor: '#f5f5f5',
  fontWeight: 'bold',
  textAlign: 'center',
  width: '50px'
};

const tableCellStyle: React.CSSProperties = {
  border: '1px solid #000',
  padding: '5px 6px',
  textAlign: 'left'
};

const circleStyle: React.CSSProperties = {
  display: 'inline-block',
  border: '1px solid #000',
  borderRadius: '50%',
  padding: '1px 6px',
  minWidth: '30px'
};
