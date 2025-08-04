const PostRepository = require('../repositories/PostRepository');
const { PostValidation } = require('../models/Post'); 
const db = require('../config/database'); 

/**
 * PostService - Handles logic for post operations
 */
class PostService {
    constructor() {
        this.postRepository = new PostRepository(db); 
    }


    /**
     * Create a new post object
     * @param {Object} postData - Post data from request
     * @returns {Promise<Post>} Created Post
     */
    async createPost(postData) {
        try {
            const { error, value } = PostValidation.create.validate(postData);
            if(error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            const normalizedTitle = value.title.trim(); 
            const duplicateExists = await this.postRepository.existsByTitle(normalizedTitle); 
            if(duplicateExists) {
                throw new Error(`Duplicate post exists`);
            }

            const createdPost = await this.postRepository.create({
                ...value,
                title: value.title.trim(),
                description: value.description?.trim() || value.description,
                links: value.links
            })

            console.log(`Created Post: ${createdPost.id}`);
            return createdPost; 
        } catch (error) {
            console.log("Error creating post: ", error.message);
            throw error; 
        }
    }

    /**
     * Gets all of the posts based on options list
     * @param {Object} options - Query options
     * @returns Post results
     */
    async getAllPosts(options = {}) {
        try {
            const {error, value} = PostValidation.query.validate(options); 
            if(error) {
                throw new Error(`Query validation error: ${error.details[0].message}`);
            }

            const result = await this.postRepository.findAll(value); 
            console.log(`Retrieved ${result.posts.length} posts`); 

            return result; 
        } catch(error) {
            console.error('Error getting posts: ', error.message); 
            throw error; 
        }
    }

    /**
     * Gets a post based on the provided ID
     * @param {number} id - the numerical id of the psot
     */
    async  Id(id) {
        try {
            if(!id || isNaN(parseInt(id))) {
                throw new Error('Invalid post ID'); 
            }

            const post = await this.postRepository.findById(parseInt(id)); 

            if(!post) {
                throw new Error(`Post with ID ${id} not found`); 
            }

            return post; 
        } catch(error) {
            console.error(`Error getting post ${id}: `, error.message); 
            throw error; 
        }
    }

    /**
     * 
     * @param {number} id - the numerical identifier of the post
     * @param {Object} updateData - the data to update
     * @returns {Promise<post>} updated post
     */
    async updatePost(id, updateData) {
        try {
            const { error, value } = PostValidation.update.validate({ id: parseInt(id), ...updateData }); 
            if(error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            const existingPost = await this.postRepository.findById(parseInt(id)); 

            if(!existingPost) {
                throw new Error(`Post with ID ${id} not found.`);
            }

            if (value.title && value.title !== existingPost.title) {
                const normalizedTitle = value.title.trim();
                const duplicateExists = await this.postRepository.existsByTitle(normalizedTitle); 
                if(duplicateExists) {
                    throw new Error(`Post '${normalizedTitle}' already exists`); 
                }
                value.title = normalizedTitle; 
            }

            const updatedPost = await this.postRepository.update(parseInt(id), value); 

            return updatedPost; 
        } catch(error) {
            console.error(`Error updating post ${id}: `, error.message); 
            throw error; 
        }
    }

    /**
     * Deletes a post based on a provided id
     * @param {number} id - the numerical identifier of the post to delete 
     * @returns {boolean} represents if the post was deleted successfully or not
     */
    async deletePost(id) {
        try {
            if(!id || isNaN(parseInt(id))) {
                throw new Error('Invalid post ID'); 
            }

            const existingPost = await this.postRepository.findById(parseInt(id)); 

            if(!existingPost) {
                throw new Error(`Post with ID ${id} not found`); 
            }

            const deleted = await this.postRepository.delete(parseInt(id)); 

            if(deleted) {
                return true;
            } else {
                throw new Error('Failed to delete post'); 
            }
        } catch(error) {
            console.log(`Error deleting post: ${id}: `, error.message);
            throw error; 
        }
    }

    /**
     * Gets matching posts based on a provided query parameter
     * @param {string} searchText query to search for among posts
     * @param {number} limit the limit on the number of results to return
     * @returns posts matching the search query text
     */
    async searchPosts(searchText, limit=20) {
        if(!searchText || searchText.trim().length <= 0) {
            throw new Error('Search text is required'); 
        }

        try {
            searchText = searchText.trim(); 

            const results = await this.postRepository.searchByText(searchText, limit); 

            return results; 
        } catch(error) {
            console.error('Error searching posts: ', error.message); 
            throw error; 
        }
    }

    /**
     * Gets list of posts that have links
     * @returns a list of posts with links
     */
    async getPostsWithLinks() {
        try {
            const results = await this.postRepository.findPostsWithLinks();

            console.log(`Found ${results.length} post results`);

            return results; 
        } catch(error) {
            console.error('Error gettings posts with links: ', error.message); 
            throw error; 
        }
    }

    async getPostById(id) {
    try {
        if(!id || isNaN(parseInt(id))) {
            throw new Error('Invalid post ID'); 
        }

        const post = await this.postRepository.findById(parseInt(id)); 

        if(!post) {
            throw new Error(`Post with ID ${id} not found`);
        }

        return post; 
    } catch(error) {
        console.error(`Error getting post ${id}: `, error.message); 
        throw error; 
    }
}

    /**
     * Gets the statistics of the posts in the system
     * @returns statistics about posts
     */
    async getStatistics() {
        try {
            const results = await this.postRepository.getStatistics();

            console.log(`Returning statistics`);

            return results; 
        } catch(error) {
            console.error('Error getting statistics: ', error.message); 
            throw error; 
        }
    }
}

module.exports = PostService; 