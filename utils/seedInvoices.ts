import axios from 'axios';

/**
 * Seed script to create sample invoices for testing
 * Run: ts-node utils/seedInvoices.ts
 */

const API_URL = 'http://localhost:3001';

interface Product {
  name: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface SampleInvoice {
  invoiceNumber: string;
  clientName: string;
  clientAddress: string;
  dateOfIssue: Date;
  previousDues: number;
  products: Product[];
}

const sampleInvoices: SampleInvoice[] = [
  {
    invoiceNumber: '2925',
    clientName: 'Medipoint Hospital',
    clientAddress: 'Kankarbagh',
    dateOfIssue: new Date('2025-12-29'),
    previousDues: -3272,
    products: [
      {
        name: 'Visiting card',
        quantity: 400,
        unitCost: 1,
        total: 400
      }
    ]
  },
  {
    invoiceNumber: '2926',
    clientName: 'ABC Corporation',
    clientAddress: 'Boring Road, Patna',
    dateOfIssue: new Date('2026-01-05'),
    previousDues: 0,
    products: [
      {
        name: 'Business Cards',
        quantity: 500,
        unitCost: 2,
        total: 1000
      },
      {
        name: 'Letterheads',
        quantity: 200,
        unitCost: 3,
        total: 600
      }
    ]
  },
  {
    invoiceNumber: '2927',
    clientName: 'XYZ Enterprises',
    clientAddress: 'Fraser Road, Patna',
    dateOfIssue: new Date('2026-01-10'),
    previousDues: -500,
    products: [
      {
        name: 'Brochures',
        quantity: 1000,
        unitCost: 5,
        total: 5000
      },
      {
        name: 'Flyers',
        quantity: 2000,
        unitCost: 2,
        total: 4000
      },
      {
        name: 'Posters',
        quantity: 50,
        unitCost: 10,
        total: 500
      }
    ]
  }
];

async function seedInvoices(): Promise<void> {
  console.log('🌱 Starting invoice seeding...\n');

  try {
    // First, login to get token
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@chhayaprinting.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Logged in successfully\n');

    // Create each invoice
    for (const invoice of sampleInvoices) {
      try {
        await axios.post(`${API_URL}/api/invoices`, invoice, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log(`✅ Created invoice #${invoice.invoiceNumber} for ${invoice.clientName}`);
      } catch (error: any) {
        if (error.response?.status === 500 && error.response?.data?.error?.includes('duplicate')) {
          console.log(`⚠️  Invoice #${invoice.invoiceNumber} already exists, skipping...`);
        } else {
          console.error(`❌ Failed to create invoice #${invoice.invoiceNumber}:`, error.response?.data || error.message);
        }
      }
    }

    console.log('\n✅ Seeding completed!');
    console.log(`\n📊 Created ${sampleInvoices.length} sample invoices`);
    console.log('🌐 View them at: http://localhost:3000/dashboard');

  } catch (error: any) {
    console.error('❌ Seeding failed:', error.response?.data || error.message);
    console.log('\n💡 Make sure:');
    console.log('   1. MongoDB is running');
    console.log('   2. Express server is running (npm run dev:server)');
    console.log('   3. Admin user exists (ts-node utils/createAdmin.ts)');
  }
}

seedInvoices();
