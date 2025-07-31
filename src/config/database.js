const knex = require('knex'); 
const knexConfig = require('../../knexfile'); 

const environment = process.env.NODE_ENV || 'development';

// Open db connection
const db = knex(knexConfig[environment]); 

// Shutdown logic
process.on('SIGINT', async () => {
    console.log('Closing db connection...'); 
    await db.destroy();
    process.exit(0); 
});

// Startup logic
process.on('SIGTERM', async () => {
    console.log('Opening db connection...'); 
    await db.destroy();
    process.exit(0); 
});

module.exports = db; 