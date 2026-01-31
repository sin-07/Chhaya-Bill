import axios from 'axios';

/**
 * Utility to create the first admin user
 * Run this script once to set up your admin account
 * 
 * Usage: ts-node utils/createAdmin.ts
 */

const API_URL = 'http://localhost:3001';

async function createAdmin(): Promise<void> {
  try {
    const response = await axios.post(`${API_URL}/api/auth/register`, {
      username: 'admin',
      email: 'admin@chhayaprinting.com',
      password: 'admin123', // Change this in production!
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@chhayaprinting.com');
    console.log('Password: admin123');
    console.log('\n⚠️  Please change the password after first login!');
  } catch (error: any) {
    if (error.response?.data?.message === 'User already exists') {
      console.log('ℹ️  Admin user already exists');
    } else {
      console.error('❌ Error creating admin:', error.response?.data || error.message);
    }
  }
}

createAdmin();
