/**
 * Migration for reddit posts
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('posts', function(table) {
    // Primary key
    table.increments('id').primary();
    
    // Post title field
    table.string('title', 500).notNullable();
    
    // Post description field
    table.text('description').nullable();
    
    // Links field
    table.text('links').nullable();
    
    // Timestamps for tracking when records are created/updated
    table.timestamps(true, true);
    
    // Index for performance on title searches
    table.index(['title']);
    
    // Index on created_at for chronological queries
    table.index(['created_at']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('posts');
};