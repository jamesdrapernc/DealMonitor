// src/config/database.js - Database connection setup
const knex = require('knex');
const knexConfig = require('../../knexfile');

// Get the current environment or default to 'development'
const environment = process.env.NODE_ENV || 'development';

// Create and export the database connection
const db = knex(knexConfig[environment]);

module.exports = db;