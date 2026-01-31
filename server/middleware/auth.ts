import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  userId: string;
  username: string;
  email: string;
}

export interface AuthRequest extends Request {
  user?: JwtPayload;
}

const authMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    // Get token from cookie or Authorization header
    const token = req.cookies.token || 
                  (req.headers.authorization && req.headers.authorization.split(' ')[1]);

    if (!token) {
      res.status(401).json({ message: 'No token, authorization denied' });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

export default authMiddleware;
