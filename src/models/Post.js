const Joi = require('joi');

/**
 * Post model class - handles only post-specific data
 */
class Post {
  constructor(data) {
    this.id = data.id || null;
    this.title = data.title || '';
    this.description = data.description || null;
    this.links = Array.isArray(data.links) ? data.links : this.parseLinks(data.links);
    this.createdAt = data.created_at || data.createdAt || null;
    this.updatedAt = data.updated_at || data.updatedAt || null;
  }

  /**
   * Convert model to database format (snake_case)
   */
  toDatabase() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      links: JSON.stringify(this.links),
      created_at: this.createdAt,
      updated_at: this.updatedAt
    };
  }

  /**
   * Convert model to API format (camelCase)
   */
  toJSON() {
    return {
      id: this.id,
      title: this.title,
      description: this.description,
      links: this.links,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // Computed properties
      hasLinks: this.links.length > 0,
      linkCount: this.links.length,
      previewText: this.getPreviewText()
    };
  }

  /**
   * Create from database row
   */
  static fromDatabase(row) {
    if (!row) return null;
    return new Post(row);
  }

  /**
   * Get preview text for display
   */
  getPreviewText(maxLength = 150) {
    const text = this.description || this.title;
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
  }

    /**
   * Parse links from database string format to array
   */
  parseLinks(linksData) {
    if (!linksData) return [];
    if (typeof linksData === 'string') {
      try {
        return JSON.parse(linksData);
      } catch (error) {
        // If not JSON, treat as single link or comma-separated
        return linksData.split(',').map(link => link.trim()).filter(link => link);
      }
    }
    return [];
  }

  /**
   * Validate if title is acceptable
   */
  static isValidTitle(title) {
    return title && 
           typeof title === 'string' && 
           title.trim().length > 0 && 
           title.length <= 500;
  }

  /**
   * Validate if link is a valid URL
   */
  static isValidLink(link) {
    try {
      new URL(link);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Add a link to the post
   */
  addLink(link) {
    if (Post.isValidLink(link) && !this.links.includes(link)) {
      this.links.push(link);
    }
  }

  /**
   * Remove a link from the post
   */
  removeLink(link) {
    this.links = this.links.filter(l => l !== link);
  }
}

/**
 * Validation schemas for posts
 */
const PostValidation = {
  // Schema for creating new posts
  create: Joi.object({
    title: Joi.string().min(1).max(500).required()
      .messages({
        'string.empty': 'Title cannot be empty',
        'string.max': 'Title must be less than 500 characters'
      }),
    
    description: Joi.string().max(10000).optional().allow(null, ''),
    
    links: Joi.array().items(
      Joi.string().uri()
    ).optional().default([])
      .messages({
        'string.uri': 'Invalid URL format for link'
      })
  }),

  // Schema for updating posts
  update: Joi.object({
    id: Joi.number().integer().required(),
    title: Joi.string().min(1).max(500).optional(),
    description: Joi.string().max(10000).optional().allow(null, ''),
    links: Joi.array().items(
      Joi.string().uri()
    ).optional()
  }),

  // Schema for query parameters
  query: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    search: Joi.string().max(255).optional(),
    hasLinks: Joi.boolean().optional()
  })
};

module.exports = {
  Post,
  PostValidation
};