import express, { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

const router = express.Router();

// Register (for initial setup - remove in production)
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    // Create new user
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'User created successfully' });
  } catch (error: any) {
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET as string,
      { expiresIn: '7d' }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      message: 'Login successful',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Error logging in', error: error.message });
  }
});

// Logout
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ message: 'Logged out successfully' });
});

// Verify token
router.get('/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
    const user = await User.findById(decoded.userId).select('-password');

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Token invalid' });
  }
});

export default router;
