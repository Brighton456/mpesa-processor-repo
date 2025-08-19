import { mpesaService } from '../services/mpesaService.js';
import logger from '../utils/logger.js';

const initiateSTKPush = async (req, res, next) => {
  try {
    const { amount, phone, accountReference, transactionDesc } = req.body;

    if (!amount || !phone) {
      return res.status(400).json({ message: 'Amount and phone number are required.' });
    }

    const stkData = { amount, phone, accountReference, transactionDesc };
    const result = await mpesaService.initiateSTKPush(stkData);
    
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

const mpesaCallback = (req, res) => {
  const callbackData = req.body;
  logger.info('Received M-Pesa callback:', JSON.stringify(callbackData, null, 2));

  // Process the callback data here (e.g., update database, notify user)
  // For now, we just log it and send a success response

  res.status(200).json({ message: 'Callback received successfully.' });
};

const getAccessToken = async (req, res, next) => {
  try {
    const token = await mpesaService.getAccessToken();
    res.status(200).json({ accessToken: token });
  } catch (error) {
    next(error);
  }
};

export const mpesaController = {
  initiateSTKPush,
  mpesaCallback,
  getAccessToken
};
