import express from 'express';
import { mpesaController } from '../controllers/mpesaController.js';

const router = express.Router();

// Route to initiate STK Push
router.post('/stk-push', mpesaController.initiateSTKPush);

// Route to handle M-Pesa callback
router.post('/callback', mpesaController.mpesaCallback);

// Route to get access token (for testing/admin purposes)
router.get('/token', mpesaController.getAccessToken);

export default router;
