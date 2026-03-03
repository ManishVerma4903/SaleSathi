require('dotenv').config();
const app = require('./src/app');
const connectDB = require('./src/config/db');

/**
 * Server Configuration
 * Initializes database connection and starts Express server
 */

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    
    const server = app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   Shop Management System API                               ║
║   ─────────────────────────────────────────                ║
║                                                            ║
║   Environment: ${process.env.NODE_ENV || 'development'}                             ║
║   Port: ${PORT}                                               ║
║   URL: http://localhost:${PORT}                              ║
║                                                            ║
║   API Endpoints:                                           ║
║   • Auth:     /api/auth                                    ║
║   • Products: /api/products                                ║
║   • Sales:    /api/sales                                   ║
║   • Expenses: /api/expenses                                ║
║   • Reports:  /api/reports                                 ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
      `);
    });
    
    process.on('unhandledRejection', (err) => {
      console.error('UNHANDLED REJECTION! Shutting down...');
      console.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });
    
    process.on('uncaughtException', (err) => {
      console.error('UNCAUGHT EXCEPTION! Shutting down...');
      console.error(err.name, err.message);
      process.exit(1);
    });
    
    process.on('SIGTERM', () => {
      console.log('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        console.log('Process terminated.');
      });
    });
    
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
