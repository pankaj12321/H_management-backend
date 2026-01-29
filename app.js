require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:5000',
  'https://blpoonamhotelandrestaurant.netlify.app',
  'https://hotel-api.duckdns.org',
  'https://myhotel-api.duckdns.org',
  'http://localhost:3000'
];

if (process.env.ALLOWED_ORIGINS) {
  const envOrigins = process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
  allowedOrigins.push(...envOrigins);
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes(origin.replace(/\/$/, ""))) {
      return callback(null, true);
    } else {
      console.log('❌ Blocked by CORS:', origin);
      return callback(new Error('CORS not allowed by Policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Headers',
    'Access-Control-Allow-Origin'
  ],
};

const dynamicCorsMiddleware = (req, res, next) => {
  if (process.env.DISABLE_CORS === 'true') {
    return next();
  }

  const host = req.get('host');

  if (host && host.includes('hotel-api.duckdns.org')) {
    return next();
  }

  return cors(corsOptions)(req, res, next);
};

console.log('✅ Dynamic CORS initialized. Production host skips Node CORS; Localhost uses Node CORS.');
app.use(dynamicCorsMiddleware);
app.options(/.*/, dynamicCorsMiddleware);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

app.use((req, res, next) => {
  const start = Date.now();
  console.log(`➡️  ${req.method} ${req.originalUrl}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ ${req.method} ${req.originalUrl} → ${res.statusCode} (${duration}ms)`);
  });
  next();
});

app.use('/api', routes);

app.get('/api/health', (req, res) => res.status(200).json({ status: 'OK' }));
app.get('/api/welcome', (req, res) => res.status(200).send('Welcome to the h_management API server!'));
app.get('/', (req, res) => res.status(200).send('Welcome to the h_management API server!'));

app.use('/uploads', express.static('uploads'));

app.use((req, res) => {
  console.error('🔎 404 NOT FOUND:', req.method, req.originalUrl);
  res.status(404).json({
    title: 'Not Found',
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});