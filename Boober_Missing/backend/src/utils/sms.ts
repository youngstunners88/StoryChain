import twilio from 'twilio';
import { config } from '../config';
import { logger } from './logger';

// Create Twilio client
const createTwilioClient = () => {
  if (!config.twilio.accountSid || !config.twilio.authToken) {
    logger.warn('Twilio credentials not configured. SMS will be logged only.');
    return null;
  }
  return twilio(config.twilio.accountSid, config.twilio.authToken);
};

export const sendSMS = async (to: string, message: string): Promise<boolean> => {
  try {
    const client = createTwilioClient();

    // Format phone number for South Africa
    let formattedNumber = to.replace(/\s+/g, '');
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '+27' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('+')) {
      formattedNumber = '+' + formattedNumber;
    }

    if (!client) {
      // Development mode - just log the SMS
      logger.info(`[DEV SMS] To: ${formattedNumber}, Message: ${message}`);
      return true;
    }

    const result = await client.messages.create({
      body: message,
      from: config.twilio.phoneNumber,
      to: formattedNumber,
    });

    logger.info(`SMS sent to ${formattedNumber}: ${result.sid}`);
    return true;
  } catch (error) {
    logger.error(`Failed to send SMS to ${to}: ${error}`);
    return false;
  }
};

export const sendOTP = async (phone: string, otp: string): Promise<boolean> => {
  const message = `Your Boober verification code is: ${otp}. Valid for ${config.otp.expiryMinutes} minutes.`;
  return sendSMS(phone, message);
};

export const sendRideNotification = async (
  phone: string,
  data: {
    driverName: string;
    pickup: string;
    eta: number;
  }
): Promise<boolean> => {
  const message = `Your Boober taxi is on the way! Driver: ${data.driverName}, ETA: ${data.eta} minutes. Pickup: ${data.pickup}`;
  return sendSMS(phone, message);
};

export const sendEmergencyAlert = async (
  phone: string,
  data: {
    userName: string;
    location: string;
    rideId: string;
  }
): Promise<boolean> => {
  const message = `EMERGENCY ALERT: ${data.userName} has triggered an emergency alert on Boober. Location: ${data.location}. Ride ID: ${data.rideId}. Please contact them immediately or authorities.`;
  return sendSMS(phone, message);
};

export default {
  sendSMS,
  sendOTP,
  sendRideNotification,
  sendEmergencyAlert,
};
