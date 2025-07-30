// Import Express Framework
const express = require('express');

// Import cors framework for frontend API interactions
const cors = require('cors'); 

// Import helmet framework for basic security helpers
const helmet = require('helmet'); 

// Load env variables
require('dotenv').config(); 



/**
 * Application Setup
 * 
 * 
 */

// Initialize express
const app = express(); 

// Set prcoess port
const PORT = process.env.PORT || 3000; 



/**
 * Middleware Setup
 * 
 * 
 */

// Initialize basic security middleware to set HTTP headers
app.use(helmet());

// Enable CORS
app.use(cors()); 

// JSON parsing
app.use(express.json()); 

// Allow URL encoding of objects and arrays
app.use(express.urlencoded({ extended: true }));



/**
 * Route Handlers
 * 
 * 
 */

// Home Route
app.get('/', (req, res) => {
    res.json({
        message: "Deal Monitor API",
        version: '1.0.0',
        endpoints: {
            api: '/api/'
        }
    })
});

// Health Check Route
app.get('/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});



/**
 * Error Handling
 * 
 * 
 */
app.use((err, req, res, next) => {
  // Log error details to console for debugging
  console.error(err.stack);
  
  // Send error response to client
  res.status(500).json({
    error: 'Something went wrong!',
    // Only show detailed error messages in development for security
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});



/**
 * Server Startup
 * 
 * 
 */
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});



/**
 * Exports
 * 
 * 
 */
module.exports = app; 