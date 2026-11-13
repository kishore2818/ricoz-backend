const mongoose = require('mongoose');
const config = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true
    });
    console.log(`[MongoDB] Connected to external MongoDB instance: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.log(`[MongoDB] External MongoDB on ${config.MONGODB_URI} not detected (${error.message}).`);
    console.log(`[MongoDB] Launching embedded development MongoDB engine...`);

    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'pe_reporting_agent'
        }
      });
      const uri = mongodInstance.getUri();
      const conn = await mongoose.connect(uri, {
        autoIndex: true
      });
      console.log(`[MongoDB] Connected to embedded development MongoDB engine at ${uri}`);
      return conn;
    } catch (memErr) {
      console.error(`[MongoDB Error] Failed to start embedded MongoDB: ${memErr.message}`);
      throw memErr;
    }
  }
};

module.exports = connectDB;
