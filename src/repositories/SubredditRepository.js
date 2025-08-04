const { Subreddit } = require('../models/Subreddit');

/**
 * SubredditRepository - handles database operations for subreddits
 * Focused only on subreddit-related data operations
 */
class SubredditRepository {
    /**
     * @param {import('knex').Knex} db - database connection
     */
    constructor(db) {
        this.db = db;
        this.tableName = 'subreddits';
    }

    /**
     * Create a new subreddit
     * @param {Object} subredditData - the data to insert
     * @returns {Promise<Subreddit>} Created subreddit
     */
    async create(subredditData) {
        try {
            const subreddit = new Subreddit(subredditData);
            const dataToInsert = subreddit.toDatabase(); 

            // Remove id and timestamps for insert
            delete dataToInsert.id;
            delete dataToInsert.created_at;
            delete dataToInsert.updated_at;

            const [id] = await this.db(this.tableName).insert(dataToInsert); 

            // Return the created keyword
            return await this.findById(id); 
        } catch(error) {
            throw new Error(`Failed to create subreddit: ${error.message}`);
        }
    }    

    /**
     * Find subreddit by ID
     * @param {number} id - subreddit ID
     * @returns {Promise<Subreddit>|null>} Found subreddit or null
     */
    async findById(id) {
        try {
            const row = await this.db(this.tableName)
            .where({id})
            .first(); 

            return Subreddit.fromDatabase(row); 
        } catch(error) {
            throw new Error(`Failed to find subreddit by ID: ${error.message}`);
        }
    }

    /**
     * Find subreddit by name (exact match)
     * @param {string} name - Subreddit name to search for
     * @returns {Promise<Subreddit|null>} Found subreddit or null
     */
    async findByName(name) {
        try {
            const row = await this.db(this.tableName)
                .where({ name })
                .first();

            return Subreddit.fromDatabase(row);
        } catch (error) {
            throw new Error(`Failed to find subreddit by name: ${error.message}`);
        }
    }

    /**
     * Search subreddits by name pattern
     * @param {string} searchText - Text to search for in names
     * @param {number} limit - Maximum results to return
     * @returns {Promise<Subreddit[]>} Array of matching subreddits
     */
    async searchByName(searchText, limit = 50) {
        try {
            const searchPattern = `%${searchText}%`;
            
            const rows = await this.db(this.tableName)
                .where('name', 'like', searchPattern)
                .orderBy('name', 'asc')
                .limit(limit);

            return rows.map(row => Subreddit.fromDatabase(row));
        } catch (error) {
            throw new Error(`Failed to search subreddits: ${error.message}`);
        }
    }

    /**
     * Find all subreddits with pagination and filtering
     * @param {Object} options - Query options
     * @param {number} options.page - Page number (1-based)
     * @param {number} options.limit - Items per page
     * @param {string} options.search - Search term for subreddit name
     * @returns {Promise<{subreddits: Subreddit[], total: number, page: number, limit: number}>}
     */
    async findAll(options = {}) {
        try {
            const {
                page = 1,
                limit = 20,
                search = null
            } = options;

            // Build base query
            let query = this.db(this.tableName);
            let countQuery = this.db(this.tableName);

            // Apply search filter
            if (search) {
                const searchPattern = `%${search}%`;
                query = query.where('name', 'like', searchPattern);
                countQuery = countQuery.where('name', 'like', searchPattern);
            }

            // Get total count for pagination
            const [{ count }] = await countQuery.count('id as count');
            const total = parseInt(count);

            // Apply pagination and sorting
            const offset = (page - 1) * limit;
            const rows = await query
                .orderBy('name', 'asc')  // ✅ Added: Sort alphabetically
                .limit(limit)
                .offset(offset);

            // Convert to model instances
            const subreddits = rows.map(row => Subreddit.fromDatabase(row));

            return {
                subreddits,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                pages: Math.ceil(total / limit)
            };
        } catch (error) {
            throw new Error(`Failed to find subreddits: ${error.message}`);
        }
    }

    /**
     * Check if subreddit already exists by name
     * @param {string} name - Subreddit name to check
     * @returns {Promise<boolean>} True if exists
     */
    async exists(name) {
        try {
            const result = await this.db(this.tableName)
                .where({ name })
                .first();

            return !!result;
        } catch (error) {
            throw new Error(`Failed to check subreddit existence: ${error.message}`);
        }
    }

    /**
     * Update subreddit by ID
     * @param {number} id - subreddit ID
     * @param {Object} updateData - Data to updateSubreddit
     * @returns {Promise<Subreddit|null>} UPdated subreddit or null if not found
     */
    async update(id, updateData) {
        try {
            const existingSubreddit = await this.findById(id); 
            if(!existingSubreddit) {
                return null; 
            }

            const updatedSubreddit = new Subreddit({...existingSubreddit, ...updateData});
            const dataToUpdate = updatedSubreddit.toDatabase(); 

            delete dataToUpdate.id;
            delete dataToUpdate.created_at;

            dataToUpdate.updated_at = new Date();

            const updatedCount = await this.db(this.tableName)
                .where({id})
                .update(dataToUpdate); 

            if (updatedCount === 0) {
                return null;
            }

            return await this.findById(id); 
        } catch(error) {
            throw new Error(`Failed to update subreddit: ${error.message}`);
        }
    }

    /**
     * Delete subreddit by ID
     * @param {number} id - subreddit ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        try {
            const deletedCount = await this.db(this.tableName)
                .where({id})
                .del(); 

            return deletedCount > 0;

        } catch(error) {
            throw new Error(`Failed to delete subreddit: ${error.message}`); 
        }
    }
}

module.exports = SubredditRepository;