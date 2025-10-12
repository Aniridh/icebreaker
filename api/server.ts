/**
 * local server entry file, for local development
 */
import dotenv from 'dotenv';

// Load environment variables before importing app
dotenv.config();

import app from './app.js';

/**
 * start server with port
 */
const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  console.log(`🚀 Server ready on port ${PORT} with enhanced RAG-based icebreakers`);
});

/**
 * close server
 */
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('HTTP server closed');
  });
});

export default app;