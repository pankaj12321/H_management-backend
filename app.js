require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const redisClient = require('./src/config/redis');

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = [
      'http://localhost:4200',
      'https://blpoonamhotelandrestaurant.netlify.app',
    ];

    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log('❌ Blocked by CORS:', origin);
    return callback(new Error('CORS not allowed'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

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
