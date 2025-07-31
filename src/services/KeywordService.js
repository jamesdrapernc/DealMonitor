const KeywordRepository = require('../repositories/KeywordRepository'); 
const { KeywordValidation } = require('../models/Keyword'); 
const db = require('../config/database'); 

/**
 * KeywordService - Handles logic for keyword operations
 */
class KeywordService {
    constructor() {
        this.keywordRepository = new KeywordRepository(); 
    }
    
    /**
     * Create a new keyword 
     * @param {Object} keywordData - Keyword data from request
     * @returns {Promise<Keyword>} Created keyword
     */
    async createKeyword(keywordData) {
        try {
            const { error, value } = KeywordValidation.create.validate(keywordData); 
            if (error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            const normalizedKeyword = value.keyword.trim(); 

            const existingKeyword = await this.keywordRepository.exists(normalizedKeyword); 

            if(existingKeyword) {
                throw new Error(`Keyword '${normalizedKeyword}' already exists`);
            }

            const createdKeyword = await this.keywordRepository.create({
                ...value,
                keyword: normalizedKeyword
            });

            console.log("Created keyword: ${createdKeyword.keyword}"); 
            return createdKeyword;
        } catch(error) {
            console.log("Error creating keyword: ", error.message); 
            throw error; 
        }
    }

    /**
     * 
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Keyword results
     */
    async getAllKeywords(options = {}) {
        try {
            const {error, value} = KeywordValidation.query.validate(options); 
            if (error) {
                throw new Error(`Query validation error: ${error.details[0].message}`);
            }

            const result = await this.keywordRepository.findAll(value); 

            return result; 
        } catch(error) {
            console.error('Error getting keywords: ', error.message); 
            throw error; 
        }
    }

    /**
     * 
     * @param {number} id - Keyword ID
     * @returns {Promise<Keyword>} Found keyword
     */
    async getKeywordById(id) {
        try {
            if(!id || isNaN(parseInt(id))) {
                throw new Error('Invalid keyword ID'); 
            }

            const keyword = await this.keywordRepository.findById(parseInt(id)); 

            if(!keyword) {
                throw new Error(`Keyword with ID ${id} not found`);
            }

            return keyword; 
        } catch(error) {
            console.error(`Error getting keyword ${id}: `, error.message); 
            throw error; 
        } 
    }

    /**
     * Update a keyword by ID
     * @param {number} id - keyword id
     * @param {Object} updateData - data to update
     * @returns {Promise<Keyword>} Updated keyword
     */
    async updateKeyword(id, updateData) {
        try {
            const { error, value } = KeywordValidation.update.validate({ id: parseInt(id), ...updateData }); 
            if(error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            const existingKeyword = await this.keywordRepository.findById(parseInt(id)); 
            
            if(!existingKeyword) {
                throw new Error(`Keyword with ID ${id} not found.`); 
            }

            if (value.keyword && value.keyword !== existingKeyword.keyword) {
                const normalizedKeyword = value.keyword.trim(); 
                const duplicateExists = await this.keywordRepository.exists(normalizedKeyword); 
                if(duplicateExists) {
                    throw new Error(`Keyword '${normalizedKeyword}' already exists`); 
                }
                value.keyword = normalizedKeyword;
            }

            const updatedKeyword = await this.keywordRepository.update(parseInt(id), value); 

            return updatedKeyword;
        } catch (error) {
            console.error(`Error updating keyword ${id}: `, error.message); 
            throw error; 
        }
    }

    /**
     * Delete a keyword by id
     * @param {number} id - Keyword ID
     * @returns {Promise<boolean>} status of deletion
     */
    async deleteKeyword(id) {
        try {
            if (!id || isNaN(parseInt(id))) {
                throw new Error('Invalid keyword ID'); 
            }

            const existingKeyword = await this.keywordRepository.findById(parseInt(id)); 

            if(!existingKeyword) {
                throw new Error(`Keyword with ID ${id} not found`);
            }

            const deleted = await this.keywordRepository.delete(parseInt(id)); 

            if(deleted) {
                return true; 
            }
            else {
                throw new Error('Failed to delete keyword'): 
            }
        } catch(error) {
            console.log(`Error deleting keyword: ${id}: `, error.message); 
            throw error; 
        }
    }
    
    /**
     * Search keywords by text
     * @param {string} searchText - text to search for
     * @param {number} limit - the max number of results
     * @returns 
     */
    async searchKeywords(searchText, limit=20) {
        try {
            if (!searchText || searchText.trim().length === 0) {
                throw new Error('Search text is required'); 
            }

            const keywords = await this.keywordRepository.searchByText(searchText.trim(), limit); 
            return keywords; 
        } catch(error) {
            console.error('Error getting keywords: ', error.message); 
            throw error; 
        }
    }

    /**
     * Get keyword statistics
     * @returns {Promise<Object>} Statistics object
     */
    async getStatistics() {
        try {
            const stats = await this.keywordRepository.getStatistics();

            return stats;

        } catch(error) {
            console.error('Error getting statistics: ', error.message);
            throw error; 
        }
    }
}

module.exports = KeywordService; 