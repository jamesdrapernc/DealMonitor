const { Keyword } = require('../models/Keyword');

/**
 * KeywordRepository - handles database operations for keywords
 * Focused only on keyword-related data operations
 */
class KeywordRepository {
    /**
     * @param {import('knex').Knex} db - database connection
     */
    constructor(db) {
        this.db = db;
        this.tableName = 'keywords';
    }

    /**
     * Create a new keyword
     * @param {Object} keywordData - the data to insert
     * @returns {Promise<Keyword>} Created keyword
     */
    async create(keywordData) {
        try {
            const keyword = new Keyword(keywordData);
            const dataToInsert = keyword.toDatabase(); 

            // Remove id and timestamps for insert
            delete dataToInsert.id;
            delete dataToInsert.created_at;
            delete dataToInsert.updated_at;

            const [id] = await this.db(this.tableName).insert(dataToInsert); 

            // Return the created keyword
            return await this.findById(id); 
        } catch(error) {
            throw new Error(`Failed to create keyword: ${error.message}`);
        }
    }    

    /**
     * Find keyword by ID
     * @param {number} id - keyword ID
     * @returns {Promise<Keyword|null>} Found keyword or null
     */
    async findById(id) {
        try {
            const row = await this.db(this.tableName)
            .where({id})
            .first(); 

            return Keyword.fromDatabase(row); 
        } catch(error) {
            throw new Error(`Failed to find keyword by ID: ${error.message}`);
        }
    }

    /**
     * Update keyword by ID
     * @param {number} id - Keyword ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Keyword|null>} UPdated keyword or null if not found
     */
    async update(id, updateData) {
        try {
            const existingKeyword = await this.findById(id); 
            if(!existingKeyword) {
                return null; 
            }

            const updatedKeyword = new Keyword({...existingKeyword, ...updateData});
            const dataToUpdate = updatedKeyword.toDatabase(); 

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
            throw new Error(`Failed to update keyword: ${error.message}`);
        }
    }

    /**
     * Delete keyword by ID
     * @param {number} id - Keyword ID
     * @returns {Promise<boolean>} True if deleted, false if not found
     */
    async delete(id) {
        try {
            const deletedCount = await this.db(this.tableName)
                .where({id})
                .del(); 

            return deletedCount > 0;

        } catch(error) {
            throw new Error(`Failed to delete keyword: ${error.message}`); 
        }
    }
}

module.exports = KeywordRepository;