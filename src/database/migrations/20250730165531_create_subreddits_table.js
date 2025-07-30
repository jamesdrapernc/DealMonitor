/**
 * Subreddits table migration
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('subreddits', function(table) {
    // Primary key
    table.increments('id').primary();
    
    // Subreddit name field
    table.string('name', 50).notNullable();
    
    // Timestamps for tracking when records are created/updated
    table.timestamps(true, true);
    
    // Index for performance on name searches
    table.index(['name']);
    
    // Unique constraint to prevent duplicate subreddit names
    table.unique(['name']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('subreddits');
};