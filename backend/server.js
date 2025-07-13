require('dotenv').config();
const express = require('express');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

// Import models and routes
const { sequelize } = require('./models');
const proxyRoutes = require('./routes/proxy');
const profileRoutes = require('./routes/profile');
const browserRoutes = require('./routes/browser');
const scriptRoutes = require('./routes/script');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files from frontend build
app.use(express.static(path.join(__dirname, '../frontend/build')));

// API Routes
app.use('/api/proxy', proxyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/browser', browserRoutes);
app.use('/api/script', scriptRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// WebSocket connection handling
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  clients.add(ws);
  
  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection',
    message: 'Connected to automation server',
    timestamp: new Date().toISOString(),
  }));
  
  ws.on('close', () => {
    console.log('WebSocket client disconnected');
    clients.delete(ws);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast to all connected clients
function broadcast(data) {
  const message = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
  });
  
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Make broadcast function available globally
global.broadcast = broadcast;

// Serve frontend for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
  });
});

// Database initialization and server startup
async function startServer() {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('Database models synchronized.');
    
    // Create user-data directory if it doesn't exist
    const fs = require('fs').promises;
    const userDataDir = path.join(__dirname, '../user-data');
    try {
      await fs.access(userDataDir);
    } catch {
      await fs.mkdir(userDataDir, { recursive: true });
      console.log('Created user-data directory.');
    }
    
    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Dashboard: http://localhost:${PORT}`);
      console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      
      // Broadcast server start
      setTimeout(() => {
        broadcast({
          type: 'server_status',
          status: 'started',
          message: 'Automation server started successfully',
        });
      }, 1000);
    });
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  
  // Broadcast shutdown
  broadcast({
    type: 'server_status',
    status: 'shutting_down',
    message: 'Server is shutting down',
  });
  
  // Close WebSocket server
  wss.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  
  // Broadcast shutdown
  broadcast({
    type: 'server_status',
    status: 'shutting_down',
    message: 'Server is shutting down',
  });
  
  // Close WebSocket server
  wss.close();
  
  // Close HTTP server
  server.close(() => {
    console.log('HTTP server closed');
    
    // Close database connection
    sequelize.close().then(() => {
      console.log('Database connection closed');
      process.exit(0);
    });
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // Broadcast error
  broadcast({
    type: 'server_error',
    error: error.message,
    message: 'Server encountered an uncaught exception',
  });
  
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  
  // Broadcast error
  broadcast({
    type: 'server_error',
    error: reason.toString(),
    message: 'Server encountered an unhandled promise rejection',
  });
});

// Start the server
startServer();

