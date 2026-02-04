// Shared in-memory storage for login attempts

interface AttemptRecord {
  ip: string;
  failedAttempts: number;
  isPermanentlyBlocked: boolean;
  lastAttemptTime: Date;
}

const loginAttempts = new Map<string, AttemptRecord>();

// Clean up old attempts every hour
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    loginAttempts.forEach((record, ip) => {
      if (!record.isPermanentlyBlocked && record.lastAttemptTime < oneHourAgo) {
        loginAttempts.delete(ip);
      }
    });
  }, 60 * 60 * 1000);
}

export { loginAttempts };
export type { AttemptRecord };
