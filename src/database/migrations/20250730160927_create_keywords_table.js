/**
 * Keyword migration field
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('keywords', function(table) {
    // Primary key
    table.increments('id').primary();
    
    // Keyword field
    table.string('keyword', 255).notNullable();
    
    // Timestamps
    table.timestamps(true, true);
    
    // Index for performance on keyword searches
    table.index(['keyword']);
    
    // Unique constraint to prevent duplicate keywords
    table.unique(['keyword']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('keywords');
};