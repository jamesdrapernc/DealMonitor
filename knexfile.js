require('dotenv').config();

module.exports = {
  // Development environment configuration
  development: {
    client: 'sqlite3',
    connection: {
      filename: './data/app.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  // Test environment configuration
  test: {
    client: 'sqlite3',
    connection: {
      filename: ':memory:'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    }
  },

  // Production environment configuration
  production: {
    client: 'sqlite3',
    connection: {
      filename: process.env.DATABASE_PATH || './data/app.db'
    },
    useNullAsDefault: true,
    migrations: {
      directory: './src/database/migrations'
    },
    seeds: {
      directory: './src/database/seeds'
    },
    pool: {
      min: 2,
      max: 10
    }
  }
};