import axios from 'axios';
import logger from '../utils/logger.js';

const getMpesaEnvironment = (env) => {
  return env === 'production' 
    ? 'https://api.safaricom.co.ke' 
    : 'https://sandbox.safaricom.co.ke';
};

const MPESA_API_BASE_URL = getMpesaEnvironment(process.env.NODE_ENV);

/**
 * @description Get M-Pesa API access token
 * @returns {Promise<string>} Access token
 */
const getAccessToken = async () => {
  const consumerKey = process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = process.env.MPESA_CONSUMER_SECRET;
  
  if (!consumerKey || !consumerSecret) {
    logger.error('M-Pesa consumer key or secret is not defined in environment variables.');
    throw new Error('M-Pesa credentials not configured.');
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  
  try {
    const response = await axios.get(`${MPESA_API_BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    });
    return response.data.access_token;
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    logger.error(`Failed to get M-Pesa access token: ${errorMessage}`);
    throw new Error('Could not retrieve M-Pesa access token.');
  }
};

/**
 * @description Initiate an STK push request
 * @param {object} stkData - The STK push data
 * @returns {Promise<object>} M-Pesa API response
 */
const initiateSTKPush = async (stkData) => {
  const accessToken = await getAccessToken();
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, -3);
  const passkey = process.env.MPESA_PASSKEY;
  const shortCode = process.env.MPESA_SHORTCODE;

  if (!passkey || !shortCode) {
    logger.error('M-Pesa passkey or shortcode is not defined.');
    throw new Error('M-Pesa passkey or shortcode not configured.');
  }

  const password = Buffer.from(`${shortCode}${passkey}${timestamp}`).toString('base64');

  const payload = {
    BusinessShortCode: shortCode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: stkData.amount,
    PartyA: stkData.phone,
    PartyB: shortCode,
    PhoneNumber: stkData.phone,
    CallBackURL: process.env.MPESA_CALLBACK_URL,
    AccountReference: stkData.accountReference || 'Test',
    TransactionDesc: stkData.transactionDesc || 'Payment for service'
  };

  try {
    const response = await axios.post(`${MPESA_API_BASE_URL}/mpesa/stkpush/v1/processrequest`, payload, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });
    logger.info('STK Push initiated successfully:', response.data);
    return response.data;
  } catch (error) {
    const errorMessage = error.response ? JSON.stringify(error.response.data) : error.message;
    logger.error(`STK Push failed: ${errorMessage}`);
    throw new Error('Failed to initiate STK Push.');
  }
};

export const mpesaService = {
  getAccessToken,
  initiateSTKPush
};
