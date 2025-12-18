require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./src/config/db');
const routes = require('./src/routes');
const redisClient = require('./src/config/redis')

const app = express();
const PORT = process.env.PORT || 5000;

connectDB();

// CORS configuration
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:5174',
  'http://localhost:5000',
  "https://blpoonmhotelandrestorent.netlify.app",
  'http://35.247.198.237:5000/'
];

app.use((req, res, next) => {
  const origin = req.headers.origin;
  const requestMethod = req.method;
  const requestHeaders = req.headers['access-control-request-headers'];

  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With'
    );
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Length, X-Foo, X-Bar');
    res.setHeader('Access-Control-Max-Age', '86400');

    if (requestMethod === 'OPTIONS') {
      if (requestHeaders) {
        res.setHeader('Access-Control-Allow-Headers', requestHeaders);
      }
      return res.status(200).end();
    }
  }

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set('trust proxy', true);

app.use((req, res, next) => {
  const start = Date.now();
  const { method, originalUrl } = req;
  console.log(`\n➡️ HIT: ${method} ${originalUrl}`);
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`✅ DONE: ${method} ${originalUrl} -> ${res.statusCode} (${duration}ms)\n`);
  });
  next();
});


const apiRouter = express.Router();
app.use('/api', routes);

apiRouter.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

apiRouter.get('/welcome', (req, res) => {
  res.status(200).send('Welcome to the h_management API server!');
});

app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.status(200).send('Welcome to the h_management API server!');
});

app.use('/uploads', express.static('uploads'));

app.use((req, res) => {
  const notFoundMessage = `Route not found: ${req.method} ${req.originalUrl}`;
  console.error(`\n🔎 404 NOT FOUND`);
  console.error(`📍 URL: ${req.method} ${req.originalUrl}`);
  console.error(`📦 Headers:`, req.headers);
  console.error(`🔎 404 END\n`);
  return res.status(404).json({
    title: 'Not Found',
    message: notFoundMessage,
  });
});



app.listen(PORT, '0.0.0.0/0', () => {
  console.log(`✅ Server running on PORT: ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
