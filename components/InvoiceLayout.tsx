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
  // New payment tracking fields
  billTotal?: number;      // Total bill amount (products total + previous dues)
  advancePaid?: number;    // Amount paid in advance by client
  dues?: number;           // Remaining amount = billTotal - advancePaid
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
    
    // High-quality canvas capture with increased scale for logo clarity
    const canvas = await html2canvas(element, {
      scale: 4, // Increased from 3 to 4 for better logo quality
      useCORS: true,
      allowTaint: true,
      logging: false,
      backgroundColor: '#ffffff',
      imageTimeout: 0,
      removeContainer: true,
    } as any);

    const imgData = canvas.toDataURL('image/jpeg', 1.0); // Use JPEG with max quality
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
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
    <div className="min-h-screen bg-gray-200 py-4 sm:py-8">
      {/* Action Buttons - Hidden on print */}
      <div className="no-print max-w-[210mm] mx-auto mb-4 flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end px-2 sm:px-4">
        <button
          onClick={handlePrint}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-900 text-white rounded hover:bg-neutral-800 text-sm sm:text-base w-full sm:w-auto"
        >
          <Printer size={18} />
          Print Invoice
        </button>
        <button
          onClick={handleDownloadPDF}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-neutral-700 text-white rounded hover:bg-neutral-600 text-sm sm:text-base w-full sm:w-auto"
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', gap: '20px' }}>
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
              <span style={{ color: '#cc0000' }}>SOLUTION</span>
            </h1>
            <p style={{ fontSize: '13px', margin: '2px 0', color: '#0C0950', fontWeight: 'bold' }}>
              (Your Perfect Printing Partner)
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>
              Bajrangpuri,Opposite to Power Grid Patna 800007
            </p>
            <p style={{ fontSize: '12px', margin: '2px 0' }}>
              Mob:- 8507217478, 7739694140
            </p>
          </div>

          {/* Right Side - Logo Image */}
          <div style={{ 
            width: '120px', 
            height: '120px', 
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '80px'
          }}>
            <img 
              src="/logoC.jpeg" 
              alt="Chhaya Printing Solution Logo" 
              style={{ 
                width: '120px', 
                height: '120px', 
                objectFit: 'contain',
                WebkitBackfaceVisibility: 'hidden',
                backfaceVisibility: 'hidden',
                transform: 'translateZ(0)',
                maxWidth: '100%',
                display: 'block'
              } as React.CSSProperties}
              crossOrigin="anonymous"
              loading="eager"
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
                  <th style={{ ...tableHeaderStyle, width: '60px' }}>Qty.</th>
                  <th style={{ ...tableHeaderStyle, width: '80px' }}>Unit/cost</th>
                  <th style={{ ...tableHeaderStyle, width: '80px' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {invoice.products.map((product, index) => {
                  const width = Number(product.width) || 0;
                  const height = Number(product.height) || 0;
                  const sqft = Number(product.sqft) || (width * height);
                  const hasDimensions = width > 0 && height > 0;
                  
                  return (
                  <tr key={index}>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {index + 1}
                    </td>
                    <td style={{ ...tableCellStyle, fontWeight: '500' }}>
                      {product.name}
                      {hasDimensions && (
                        <span style={{ fontSize: '9px', color: '#555', display: 'block', marginTop: '2px', fontWeight: 'normal' }}>
                          {width} × {height} = {sqft.toFixed(2)} sq.ft
                        </span>
                      )}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.quantity}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.unitCost}
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center' }}>
                      {product.total}
                    </td>
                  </tr>
                  );
                })}
                {/* Total Row */}
                <tr>
                  <td style={{ border: 'none' }} colSpan={3}></td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#FFFF00', textAlign: 'center' }}>
                    Total
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#FFFF00' }}>
                    {invoice.totalAmount}
                  </td>
                </tr>
                {/* Previous Dues Row (if any) */}
                {invoice.previousDues > 0 && (
                  <tr>
                    <td style={{ border: 'none' }} colSpan={3}></td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#FFB6C1', textAlign: 'center' }}>
                      Prev. Dues
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#FFB6C1' }}>
                      {invoice.previousDues}
                    </td>
                  </tr>
                )}
                {/* ADVANCE PAID Row */}
                {(invoice.advancePaid ?? 0) > 0 && (
                  <tr>
                    <td style={{ border: 'none' }} colSpan={3}></td>
                    <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#90EE90', textAlign: 'center' }}>
                      Adv. Paid
                    </td>
                    <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#90EE90' }}>
                      {invoice.advancePaid ?? 0}
                    </td>
                  </tr>
                )}
                {/* Bill Total Row */}
                <tr>
                  <td style={{ border: 'none' }} colSpan={3}></td>
                  <td style={{ ...tableCellStyle, fontWeight: 'bold', backgroundColor: '#E0E0E0', textAlign: 'center' }}>
                    Grand Total
                  </td>
                  <td style={{ ...tableCellStyle, textAlign: 'center', fontWeight: 'bold', backgroundColor: '#E0E0E0' }}>
                    {(invoice.billTotal ?? invoice.grandTotal) - (invoice.advancePaid ?? 0)}
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
            {/* Total */}
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
