const Joi = require('joi'); 

class Subreddit {
    constructor(data) {
        this.id = data.id || null; 
        this.name = data.name || null; 
        this.createdAt = data.created_at || data.createdAt || null;
        this.updatedAt = data.updated_at || data.updatedAt || null;
    }

    /**
     * Convert model to database format
     */
    toDatabase() {
        return {
            id: this.id,
            name: this.name,
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
            name: this.name,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt,
        };
    }

    /**
     * Create from database row
     */
    static fromDatabase(row) {
        if (!row) return null;
        return new Subreddit(row); 
    }

    /**
     * Validate if the name is acceptable
     */
    static isValidName(name) {
        return name && typeof name === 'string' && 
        name.trim().length > 0 && 
        name.length < 500;
    } 
}

/**
 * Validation schemas for Subreddits
 */
const SubredditValidation = {
    // Schema for creating new subreddits
    create: Joi.object({
        name: Joi.string().min(1).max(500).required()
        .messages({
            'string.empty': 'name cannot be empty',
            'string.max': 'name must be less than 500 characters'
        }),
    }),

    // Schema for updating subreddits
    update: Joi.object({
        id: Joi.number().integer().required(),
        name: Joi.string().min(1).max(500).optional()
    }),

    // Schema for query parameters
    query: Joi.object({
        page: Joi.number().integer().min(1).default(1),
        limit: Joi.number().integer().min(1).max(100).default(20),
        search: Joi.string().max(50).optional(),
        sortBy: Joi.string().valid('name', 'created_at', 'updated_at').default('name'),
        sortOrder: Joi.string().valid('asc', 'desc').default('asc')
    })
};

module.exports = {
    Subreddit,
    SubredditValidation
}