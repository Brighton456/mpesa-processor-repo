import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import 'dotenv/config';
import logger from './utils/logger.js';

// Initialize Express app
const app = express();

// Environment configuration
const PORT = process.env.PORT || 5000;
const isProduction = process.env.NODE_ENV === 'production';

// --- Security & Middleware ---

// 1. Helmet for security headers
app.use(helmet());

// 2. CORS configuration
const corsOptions = {
  origin: isProduction ? process.env.ALLOWED_ORIGIN : '*', // Restrict to frontend URL in production
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

// 3. Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 4. HTTP request logging
const morganFormat = isProduction ? 'combined' : 'dev';
app.use(morgan(morganFormat, { stream: logger.stream }));

// 5. Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use(limiter);

// --- API Routes ---

// Health check endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    status: 'UP',
    message: 'M-Pesa Processor is running.',
    timestamp: new Date().toISOString()
  });
});

// M-Pesa routes
import mpesaRoutes from './routes/mpesaRoutes.js';
app.use('/api/mpesa', mpesaRoutes);

// --- Error Handling ---

// 404 Not Found handler
app.use((req, res, next) => {
  const error = new Error('Not Found - The requested resource does not exist');
  error.status = 404;
  next(error);
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  logger.error(err.stack);

  res.status(err.status || 500).json({
    error: {
      message: err.message || 'Internal Server Error',
      ...(isProduction ? {} : { stack: err.stack }), // Only show stack in development
    },
  });
});

// --- Server Activation ---

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT} in ${process.env.NODE_ENV} mode`);
});

export default app; // For testing purposes
