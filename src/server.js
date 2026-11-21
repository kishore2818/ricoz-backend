const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { seedInitialData } = require('./utils/seeder');

let server;

const startServer = async () => {
  try {
    // Attempt Database Connection
    await connectDB();
    await seedInitialData();

    server = app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 PE LP Reporting Agent Backend API running on port ${config.PORT}`);
      console.log(`⚙️  Environment: ${config.NODE_ENV}`);
      console.log(`📡 Healthcheck: http://localhost:${config.PORT}/api/health`);
      console.log(`📚 API Docs:    http://localhost:${config.PORT}/api/docs`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

// Graceful Shutdown for zero-downtime deployments
const handleGracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
  if (server) {
    server.close(async () => {
      console.log('✅ HTTP server closed.');
      try {
        await mongoose.connection.close(false);
        console.log('✅ MongoDB connection closed.');
        process.exit(0);
      } catch (err) {
        console.error('Error during MongoDB disconnect:', err);
        process.exit(1);
      }
    });

    // Force close if graceful termination hangs
    setTimeout(() => {
      console.error('⚠️ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  } else {
    process.exit(0);
  }
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

startServer();

