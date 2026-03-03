import bcrypt from 'bcryptjs';
import { config } from '../config';

// In production, store OTPs in Redis with expiry
// This is a simple in-memory store for development
const otpStore = new Map<string, { hash: string; expires: number }>();

export const generateOTP = (): string => {
  const length = config.otp.length;
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
};

export const hashOTP = async (otp: string): Promise<string> => {
  return bcrypt.hash(otp, 10);
};

export const storeOTP = async (phone: string, otp: string): Promise<void> => {
  const hash = await hashOTP(otp);
  const expires = Date.now() + config.otp.expiryMinutes * 60 * 1000;
  otpStore.set(phone, { hash, expires });
};

export const verifyOTP = async (phone: string, otp: string): Promise<boolean> => {
  const stored = otpStore.get(phone);
  
  if (!stored) {
    return false;
  }
  
  if (Date.now() > stored.expires) {
    otpStore.delete(phone);
    return false;
  }
  
  const isValid = await bcrypt.compare(otp, stored.hash);
  
  if (isValid) {
    otpStore.delete(phone);
  }
  
  return isValid;
};

export const deleteOTP = (phone: string): void => {
  otpStore.delete(phone);
};

export default {
  generateOTP,
  hashOTP,
  storeOTP,
  verifyOTP,
  deleteOTP,
};
