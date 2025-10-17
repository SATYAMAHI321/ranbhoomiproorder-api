import { nanoid } from 'nanoid';

/**
 * Generate a unique tracking ID
 * Format: TRK-XXXXXXXXXX (TRK prefix + 10 random characters)
 */
export const generateTrackingId = (): string => {
  const prefix = 'TRK';
  const uniqueId = nanoid(10).toUpperCase();
  return `${prefix}-${uniqueId}`;
};

/**
 * Validate tracking ID format
 */
export const isValidTrackingId = (trackingId: string): boolean => {
  const pattern = /^TRK-[A-Z0-9]{10}$/;
  return pattern.test(trackingId);
};

/**
 * Generate activation code
 * Format: XXXX-XXXX-XXXX-XXXX
 */
export const generateActivationCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 4; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 3) code += '-';
  }
  
  return code;
};

/**
 * Calculate expiry date based on validity days
 */
export const calculateExpiryDate = (validityDays: number, fromDate?: Date): Date => {
  const startDate = fromDate || new Date();
  const expiryDate = new Date(startDate);
  expiryDate.setDate(expiryDate.getDate() + validityDays);
  return expiryDate;
};
