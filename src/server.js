const app = require('./app');
const config = require('./config/env');
const connectDB = require('./config/db');
const { seedInitialData } = require('./utils/seeder');

const startServer = async () => {
  try {
    // Attempt Database Connection
    await connectDB();
    await seedInitialData();

    app.listen(config.PORT, () => {
      console.log(`=======================================================`);
      console.log(`🚀 PE LP Reporting Agent Backend API running on port ${config.PORT}`);
      console.log(`⚙️  Environment: ${config.NODE_ENV}`);
      console.log(`📡 Healthcheck: http://localhost:${config.PORT}/api/health`);
      console.log(`=======================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Startup Error:', error);
    process.exit(1);
  }
};

startServer();

