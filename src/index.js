require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth');
const itemRoutes = require('./routes/items');
const userRoutes = require('./routes/users');
const storeRoutes = require('./routes/stores');
const therapistRoutes = require('./routes/therapists');
const appointmentRoutes = require('./routes/appointments-public');
const appointmentFunctions = require('./routes/appointment-functions');

const app = express();
const PORT = process.env.PORT || 3000;

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});

app.use(helmet());
app.use(cors());
app.use(express.json());
app.set('trust proxy', true);
app.use(limiter);

app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/users', userRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/therapists', therapistRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/functions', appointmentFunctions);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

app.listen(PORT, '127.0.0.1', () => {
  console.log(`🚀 API服务器已启动在端口 ${PORT}`);
  console.log(`📍 服务器地址: http://127.0.0.1:${PORT}`);
  console.log(`🌐 网络接口: IPv4 (127.0.0.1)`);
  console.log(`🔧 解决了IPv6兼容性问题`);
});