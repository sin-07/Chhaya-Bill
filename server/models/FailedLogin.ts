import mongoose, { Document, Schema } from 'mongoose';

export interface IFailedLogin extends Document {
  ipAddress: string;
  failedAttempts: number;
  isPermanentlyBlocked: boolean;
  blockedAt?: Date;
  lastAttemptAt: Date;
}

const failedLoginSchema = new Schema<IFailedLogin>({
  ipAddress: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  failedAttempts: {
    type: Number,
    required: true,
    default: 0,
  },
  isPermanentlyBlocked: {
    type: Boolean,
    default: false,
  },
  blockedAt: {
    type: Date,
  },
  lastAttemptAt: {
    type: Date,
    default: Date.now,
  },
});

export const FailedLogin = mongoose.models.FailedLogin || mongoose.model<IFailedLogin>('FailedLogin', failedLoginSchema);
