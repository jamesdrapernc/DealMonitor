// src/repositories/PostRepository.js - Data access layer for posts

const { Post } = require('../models/Post');

/**
 * PostRepository - Handles database operations for posts
 * Focused only on post-related data operations
 */
class PostRepository {
  /**
   * @param {import('knex').Knex} db - Database connection
   */
  constructor(db) {
    this.db = db;
    this.tableName = 'posts';
  }

  /**
   * Create a new post
   * @param {Object} postData - Post data to insert
   * @returns {Promise<Post>} Created post with ID
   */
  async create(postData) {
    try {
      const post = new Post(postData);
      const dataToInsert = post.toDatabase();
      
      // Remove id and timestamps for insert
      delete dataToInsert.id;
      delete dataToInsert.created_at;
      delete dataToInsert.updated_at;

      const [id] = await this.db(this.tableName).insert(dataToInsert);
      
      // Return the created post
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  /**
   * Find post by ID
   * @param {number} id - Post ID
   * @returns {Promise<Post|null>} Found post or null
   */
  async findById(id) {
    try {
      const row = await this.db(this.tableName)
        .where({ id })
        .first();

      return Post.fromDatabase(row);
    } catch (error) {
      throw new Error(`Failed to find post by ID: ${error.message}`);
    }
  }

  /**
   * Find posts by title (exact match)
   * @param {string} title - Post title to search for
   * @returns {Promise<Post[]>} Array of matching posts
   */
  async findByTitle(title) {
    try {
      const rows = await this.db(this.tableName)
        .where({ title })
        .orderBy('created_at', 'desc');

      return rows.map(row => Post.fromDatabase(row));
    } catch (error) {
      throw new Error(`Failed to find posts by title: ${error.message}`);
    }
  }

  /**
   * Find all posts with pagination and filtering
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (1-based)
   * @param {number} options.limit - Items per page
   * @param {string} options.search - Search term for title/description
   * @param {boolean} options.hasLinks - Filter by posts with/without links
   * @returns {Promise<{posts: Post[], total: number, page: number, limit: number}>}
   */
  async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = null,
        hasLinks = null
      } = options;

      // Build base query
      let query = this.db(this.tableName);
      let countQuery = this.db(this.tableName);

      // Apply search filter (search in title and description)
      if (search) {
        const searchPattern = `%${search}%`;
        const searchCondition = function() {
          this.where('title', 'like', searchPattern)
              .orWhere('description', 'like', searchPattern);
        };
        
        query = query.where(searchCondition);
        countQuery = countQuery.where(searchCondition);
      }

      // Apply hasLinks filter
      if (hasLinks === true) {
        // Posts with links (not empty JSON array)
        query = query.whereNot('links', '[]').whereNotNull('links');
        countQuery = countQuery.whereNot('links', '[]').whereNotNull('links');
      } else if (hasLinks === false) {
        // Posts without links (empty JSON array or null)
        query = query.where(function() {
          this.where('links', '[]').orWhereNull('links');
        });
        countQuery = countQuery.where(function() {
          this.where('links', '[]').orWhereNull('links');
        });
      }

      // Get total count for pagination
      const [{ count }] = await countQuery.count('id as count');
      const total = parseInt(count);

      // Apply pagination and sorting
      const offset = (page - 1) * limit;
      const rows = await query
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset);

      // Convert to model instances
      const posts = rows.map(row => Post.fromDatabase(row));

      return {
        posts,
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit)
      };
    } catch (error) {
      throw new Error(`Failed to find posts: ${error.message}`);
    }
  }

  /**
   * Update post by ID
   * @param {number} id - Post ID
   * @param {Object} updateData - Data to update
   * @returns {Promise<Post|null>} Updated post or null if not found
   */
  async update(id, updateData) {
    try {
      const existingPost = await this.findById(id);
      if (!existingPost) {
        return null;
      }

      // Create updated post instance
      const updatedPost = new Post({ ...existingPost, ...updateData });
      const dataToUpdate = updatedPost.toDatabase();
      
      // Remove fields that shouldn't be updated
      delete dataToUpdate.id;
      delete dataToUpdate.created_at;

      // Update timestamp
      dataToUpdate.updated_at = new Date();

      const updatedCount = await this.db(this.tableName)
        .where({ id })
        .update(dataToUpdate);

      if (updatedCount === 0) {
        return null;
      }

      // Return updated post
      return await this.findById(id);
    } catch (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  /**
   * Delete post by ID
   * @param {number} id - Post ID
   * @returns {Promise<boolean>} True if deleted, false if not found
   */
  async delete(id) {
    try {
      const deletedCount = await this.db(this.tableName)
        .where({ id })
        .del();

      return deletedCount > 0;
    } catch (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  /**
   * Find posts with links
   * @returns {Promise<Post[]>} Array of posts that have links
   */
  async findPostsWithLinks() {
    try {
      const rows = await this.db(this.tableName)
        .whereNot('links', '[]')
        .whereNotNull('links')
        .orderBy('created_at', 'desc');

      return rows.map(row => Post.fromDatabase(row));
    } catch (error) {
      throw new Error(`Failed to find posts with links: ${error.message}`);
    }
  }

  /**
   * Search posts by text (title and description)
   * @param {string} searchText - Text to search for
   * @param {number} limit - Maximum results to return
   * @returns {Promise<Post[]>} Array of matching posts
   */
  async searchByText(searchText, limit = 50) {
    try {
      const searchPattern = `%${searchText}%`;
      
      const rows = await this.db(this.tableName)
        .where(function() {
          this.where('title', 'like', searchPattern)
              .orWhere('description', 'like', searchPattern);
        })
        .orderBy('created_at', 'desc')
        .limit(limit);

      return rows.map(row => Post.fromDatabase(row));
    } catch (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }
  }

  /**
   * Get basic post statistics
   * @returns {Promise<Object>} Statistics object
   */
  async getStatistics() {
    try {
      const [stats] = await this.db(this.tableName)
        .select(
          this.db.raw('COUNT(*) as total'),
          this.db.raw('COUNT(CASE WHEN links != "[]" AND links IS NOT NULL THEN 1 END) as with_links'),
          this.db.raw('AVG(LENGTH(description)) as avg_description_length')
        );

      return {
        totalPosts: parseInt(stats.total),
        postsWithLinks: parseInt(stats.with_links || 0),
        postsWithoutLinks: parseInt(stats.total) - parseInt(stats.with_links || 0),
        averageDescriptionLength: Math.round(parseFloat(stats.avg_description_length || 0))
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }

  /**
   * Check if post with title already exists
   * @param {string} title - Post title to check
   * @returns {Promise<boolean>} True if exists
   */
  async existsByTitle(title) {
    try {
      const result = await this.db(this.tableName)
        .where({ title })
        .first();

      return !!result;
    } catch (error) {
      throw new Error(`Failed to check post existence: ${error.message}`);
    }
  }
}

module.exports = PostRepository;