const Joi = require('joi'); 

class Keyword {
    constructor(data) {
        this.id = data.id || null; 
        this.keyword = data.keyword || ''; 
        this.createdAt = data.created_at || data.createdAt || null;
        this.updatedAt = data.updated_at || data.updatedAt || null;
    }

    /**
     * Convert model to database format
     */
    toDatabase() {
        return {
            id: this.id,
            keyword: this.keyword,
            created_at: this.createdAt,
            updated_at: this.updatedAt
        };
    }

    /**
     * Convert model to API format
     */
    toJSON() {
        return {
            id: this.id,
            keyword: this.keyword,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Create from database row
     */
    static fromDatabase(row) {
        if (!row) return null;
        return new Keyword(row); 
    }

    /**
     * Validate if the keyword is acceptable
     */
    static isValidKeyword(keyword) {
        return keyword && typeof keyword === 'string' && 
        keyword.trim().length > 0 && 
        keyword.length < 500;
    } 
}

/**
 * Validation schemas for keywords
 */
const KeywordValidation = {
    // Schema for creating new keywords
    create: Joi.object({
        keyword: Joi.string().min(1).max(500).required()
        .messages({
            'string.empty': 'Keyword cannot be empty',
            'string.max': 'Keyword must be less than 500 characters'
        }),
    }),

    // Schema for updating keywords
    update: Joi.object({
        id: Joi.number().integer().required(),
        keyword: Joi.string().min(1).max(500).optional()
    }),

    // Schema for query parameters
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().max(255).optional(),
        sortBy: Joi.string().valid('keyword', 'created_at', 'updated_at').default('created_at'),
        sortOrder: Joi.string().valid('asc', 'desc').default('desc')
    })
};

module.exports = {
    Keyword,
    KeywordValidation
}