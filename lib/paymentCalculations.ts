/**
 * Payment Calculation Utilities
 * 
 * This module provides a single source of truth for all payment-related calculations.
 * It ensures consistency across UI, API, and PDF generation.
 * 
 * IMPORTANT: All payment calculations should use these functions to maintain
 * data consistency throughout the application.
 */

/**
 * Payment calculation result interface
 */
export interface PaymentCalculation {
  /** The total bill amount (sum of all products + previous dues) */
  billTotal: number;
  /** The amount paid in advance by the client */
  advancePaid: number;
  /** The remaining amount to be paid (dues) */
  dues: number;
  /** Whether the calculation is valid */
  isValid: boolean;
  /** Error message if validation fails */
  errorMessage?: string;
}

/**
 * Validates and calculates payment details
 * 
 * Business Rules:
 * - Dues = Bill Total - Advance Paid
 * - Advance Paid cannot be greater than Bill Total
 * - Advance Paid cannot be negative
 * - If Advance Paid = Bill Total, Dues = 0
 * - If Advance Paid < Bill Total, Dues = remaining amount
 * 
 * @param billTotal - The total bill amount
 * @param advancePaid - The amount paid in advance
 * @returns PaymentCalculation object with calculated values and validation status
 * 
 * @example
 * // Example 1: Partial payment
 * const result = calculatePayment(200, 180);
 * // result: { billTotal: 200, advancePaid: 180, dues: 20, isValid: true }
 * 
 * @example
 * // Example 2: Full payment
 * const result = calculatePayment(200, 200);
 * // result: { billTotal: 200, advancePaid: 200, dues: 0, isValid: true }
 * 
 * @example
 * // Example 3: Invalid - advance exceeds total
 * const result = calculatePayment(200, 250);
 * // result: { billTotal: 200, advancePaid: 250, dues: -50, isValid: false, errorMessage: '...' }
 */
export function calculatePayment(billTotal: number, advancePaid: number): PaymentCalculation {
  // Ensure values are numbers and handle NaN
  const safeBillTotal = Number(billTotal) || 0;
  const safeAdvancePaid = Number(advancePaid) || 0;
  
  // Round to 2 decimal places to avoid floating point issues
  const roundedBillTotal = Math.round(safeBillTotal * 100) / 100;
  const roundedAdvancePaid = Math.round(safeAdvancePaid * 100) / 100;
  
  // Calculate dues: Bill Total - Advance Paid
  const dues = Math.round((roundedBillTotal - roundedAdvancePaid) * 100) / 100;
  
  // Validation checks
  if (roundedAdvancePaid < 0) {
    return {
      billTotal: roundedBillTotal,
      advancePaid: roundedAdvancePaid,
      dues: dues,
      isValid: false,
      errorMessage: 'Advance payment cannot be negative'
    };
  }
  
  if (roundedAdvancePaid > roundedBillTotal) {
    return {
      billTotal: roundedBillTotal,
      advancePaid: roundedAdvancePaid,
      dues: dues,
      isValid: false,
      errorMessage: 'Advance payment cannot be greater than the total bill amount'
    };
  }
  
  // Valid calculation
  return {
    billTotal: roundedBillTotal,
    advancePaid: roundedAdvancePaid,
    dues: dues,
    isValid: true
  };
}

/**
 * Validates advance payment input before submission
 * 
 * @param billTotal - The total bill amount
 * @param advancePaid - The advance payment amount to validate
 * @returns Object with validation status and error message
 */
export function validateAdvancePayment(billTotal: number, advancePaid: number): {
  isValid: boolean;
  errorMessage?: string;
} {
  const calculation = calculatePayment(billTotal, advancePaid);
  
  if (!calculation.isValid) {
    return {
      isValid: false,
      errorMessage: calculation.errorMessage
    };
  }
  
  return { isValid: true };
}

/**
 * Formats currency amount for display
 * 
 * @param amount - The amount to format
 * @param currency - The currency symbol (default: ₹)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = '₹'): string {
  const safeAmount = Number(amount) || 0;
  return `${currency}${safeAmount.toFixed(2)}`;
}

/**
 * Calculates the total amount from products array
 * 
 * @param products - Array of products with total property
 * @returns Sum of all product totals
 */
export function calculateProductsTotal(products: Array<{ total: number }>): number {
  const total = products.reduce((sum, product) => sum + (Number(product.total) || 0), 0);
  return Math.round(total * 100) / 100;
}

/**
 * Calculates the complete bill including products and previous dues
 * Then calculates the final dues after advance payment
 * 
 * @param products - Array of products
 * @param previousDues - Any previous outstanding dues
 * @param advancePaid - Advance payment made
 * @returns Complete calculation with all values
 */
export function calculateCompleteInvoice(
  products: Array<{ total: number }>,
  previousDues: number = 0,
  advancePaid: number = 0
): {
  productsTotal: number;
  previousDues: number;
  billTotal: number;
  advancePaid: number;
  dues: number;
  isValid: boolean;
  errorMessage?: string;
} {
  // Calculate products total
  const productsTotal = calculateProductsTotal(products);
  
  // Calculate bill total (products + previous dues)
  const safePreviousDues = Number(previousDues) || 0;
  const billTotal = Math.round((productsTotal + safePreviousDues) * 100) / 100;
  
  // Calculate payment details
  const paymentResult = calculatePayment(billTotal, advancePaid);
  
  return {
    productsTotal,
    previousDues: safePreviousDues,
    billTotal: paymentResult.billTotal,
    advancePaid: paymentResult.advancePaid,
    dues: paymentResult.dues,
    isValid: paymentResult.isValid,
    errorMessage: paymentResult.errorMessage
  };
}

/**
 * Payment status based on dues
 */
export type PaymentStatus = 'paid' | 'partial' | 'unpaid';

/**
 * Gets the payment status based on dues
 * 
 * @param dues - The remaining dues amount
 * @param billTotal - The total bill amount
 * @returns Payment status string
 */
export function getPaymentStatus(dues: number, billTotal: number): PaymentStatus {
  if (dues <= 0) return 'paid';
  if (dues < billTotal) return 'partial';
  return 'unpaid';
}

/**
 * Gets display color class based on payment status
 * 
 * @param status - The payment status
 * @returns Tailwind CSS color class
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'text-neutral-700';
    case 'partial':
      return 'text-neutral-500';
    case 'unpaid':
      return 'text-neutral-900';
    default:
      return 'text-gray-600';
  }
}

/**
 * Gets badge color class based on payment status
 * 
 * @param status - The payment status
 * @returns Tailwind CSS classes for badge styling
 */
export function getPaymentStatusBadge(status: PaymentStatus): string {
  switch (status) {
    case 'paid':
      return 'bg-neutral-200 text-neutral-800';
    case 'partial':
      return 'bg-neutral-100 text-neutral-600';
    case 'unpaid':
      return 'bg-neutral-900 text-white';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
