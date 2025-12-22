require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const redisClient = require('./src/config/redis');

const app = express();
const PORT = process.env.PORT || 5000;

/* =========================
   DATABASE
========================= */
connectDB();

/* =========================
   CORS CONFIGURATION
========================= */
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:5174',
  'http://localhost:5000',
  'https://blpoonamhotelandrestaurant.netlify.app',
  'http://35.247.198.237:5000',
  'http://35.198.28.86:5000',
  'https://hotel-api.duckdns.org'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow Postman / curl (no origin)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      console.error('❌ CORS blocked for origin:', origin);
      return callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

// IMPORTANT: Handle preflight
app.options('*', cors());

/* =========================
   MIDDLEWARES
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

/* =========================
   REQUEST LOGGER
========================= */
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`➡️  ${req.method} ${req.originalUrl}`);

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });

  next();
});

/* =========================
   ROUTES
========================= */
app.use('/api', routes);

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

app.get('/api/welcome', (req, res) => {
  res.status(200).send('Welcome to the h_management API server!');
});

app.get('/', (req, res) => {
  res.status(200).send('Welcome to the h_management API server!');
});

/* =========================
   STATIC FILES
========================= */
app.use('/uploads', express.static('uploads'));

/* =========================
   404 HANDLER
========================= */
app.use((req, res) => {
  console.error('🔎 404 NOT FOUND:', req.method, req.originalUrl);
  return res.status(404).json({
    title: 'Not Found',
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

/* =========================
   SERVER START
========================= */
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
