const SubredditRepository = require('../repositories/SubredditRepository'); 
const { SubredditValidation } = require('../models/Subreddit'); 
const db = require('../config/database'); 

/**
 * Subreddit service - handles logic for keyword operations
 */
class SubredditService {
    constructor() {
        this.subredditRepository = new SubredditRepository(db); 
    }


    /**
     * Create a new subreddit object
     * @param {object} subredditData The data to create a subreddit from
     * @returns {Promise<Subreddit>} created subreddit
     */
    async createSubreddit(subredditData) {
        try {
            const { error, value } = SubredditValidation.create.validate(subredditData); 
            if (error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            var normalizedName = value.name.trim().toLowerCase(); 

            if(normalizedName.startsWith('r/')) {
                normalizedName = normalizedName.replace('r/', ''); 
            }

            const existingName = await this.subredditRepository.exists(normalizedName); 

            if(existingName) {
                throw new Error(`Subreddit ${normalizedName} already exists`); 
            }

            const createdSubreddit = await this.subredditRepository.create({
                ...value,
                name: normalizedName
            })

            console.log(`Created subreddit: ${createdSubreddit.name}`);
            return createdSubreddit; 
        } catch(error) {
            console.log("Error creating keyword: ", error.message);
            throw error; 
        }
    }

    /**
     * Gets all subreddits that currently exist
     * @param {Object} options - query options
     * @returns {Promise<Object>} subreddit results
     */
    async getAllSubreddits(options = {}) {
        try {
            const { error, value } = SubredditValidation.query.validate(options);
            if (error) {
                throw new Error(`Query validation error: ${error.details[0].message}`);
            }

            const result = await this.subredditRepository.findAll(value); 

            return result; 
        } catch (error) {
            console.error(`Error getting subreddits: ${error.message}`); 
            throw error;
        }
    }

    /**
     * 
     * @param {number} id The id of the subreddit to get
     * @returns {Promise<Subreddit>} the subreddit with the associated ID
     */
    async getSubredditById(id) {
        try {
            if(!id || isNaN(parseInt(id))) {
                throw new Error('Invalid subreddit ID'); 
            }

            const subreddit = await this.subredditRepository.findById(parseInt(id)); 

            if(!subreddit) {
                throw new Error(`Subreddit with ID ${id} not found`); 
            }

            return subreddit; 
        } catch(error) {
            console.error(`Error getting subreddit ${id}: `, error.message); 
            throw error; 
        }
    }

    /**
     * 
     * @param {string} name - the name of the subreddit to find
     * @returns {Promise<Subreddit>} the subreddit with associated name
     */
    async getSubredditByName(name) {
        try {
            var normalizedName = name.trim().toLowerCase(); 

            if(normalizedName.startsWith('r/')) {
                normalizedName = normalizedName.replace('r/', ''); 
            }

            if(!normalizedName) {
                throw new Error(`Invalid subreddit name`); 
            }

            const existingSubreddit = await this.subredditRepository.findByName(normalizedName);

            if(!existingSubreddit) {
                throw new Error(`Subreddit with name '${name}' not found`);
            }

            return existingSubreddit; 
        } catch(error) {
            console.error(`Error getting subreddit '${name}: `, error.message); 
            throw error; 
        }
    }

    /**
     * Updates a subreddit with the given id based on given update data
     * @param {number} id the identifier of the subreddit to update
     * @param {Object} updateData the data to update from 
     * @returns {Promise<Subreddit>} the updated subreddit reference
     */
    async updateSubreddit(id, updateData) {
        try {
            const {error, value } = SubredditValidation.update.validate({ id: parseInt(id), ...updateData });
            if(error) {
                throw new Error(`Validation error: ${error.details[0].message}`);
            }

            const existingSubreddit = await this.subredditRepository.findById(parseInt(id)); 

            if(!existingSubreddit) {
                throw new Error(`Subreddit with ID ${id} not found.`); 
            }

            if(value.name && value.name !== existingSubreddit.name) {
                const normalizedName = value.name.trim(); 
                const duplicate = await this.subredditRepository.exists(normalizedName); 
                if(duplicate) {
                    throw new Error(`Subreddit ${normalizedName} already exists`); 
                }
                value.name = normalizedName; 
            }

            const updatedSubreddit = await this.subredditRepository.update(parseInt(id), value); 

            return updatedSubreddit;
        } catch (error) {
            console.error(`Error updating subreddit: `, error.message);
            throw error; 
        }
    }

    /**
     * Deletes a subreddit with the given id
     * @param {number} id the id of the subreddit to delete
     * @returns {boolean} true if deleted else false
     */
    async deleteSubreddit(id) {
        try {
            if(!id || isNaN(parseInt(id))) {
                throw new Error('Invalid subreddit id'); 
            }

            const existingSubreddit = await this.subredditRepository.findById(parseInt(id)); 
            if(!existingSubreddit) {
                throw new Error(`Subreddit with ID ${id} not found`); 
            }

            const deleted = await this.subredditRepository.delete(parseInt(id)); 

            if(deleted) {
                console.log(`Deleted subreddit: ${existingSubreddit.name}`);
                return true;
            }
            else {
                throw new Error('Failed to delete subreddit');
            }
        } catch(error) {
            console.error(`Error deleting subreddit: ${id}`, error.message); 
            throw error; 
        }
    }

    /**
     * Searches subreddit instances for any that match the given search param
     * @param {string} searchText - the text to search for in the name of the subreddits
     * @param {int} limit - the number of results to get 
     * @returns 
     */
    async searchSubreddits(searchText, limit = 50) {
        try {
            const normalizedText = searchText.trim().toLowerCase().replace('r/', ''); 

            if(!searchText || searchText.trim().length === 0) {
                throw new Error(`Search text is required`);
            }

            const result = await this.subredditRepository.searchByName(normalizedText, limit); 
            if(!result) {
                throw new Error(`Subreddit with name '${normalizedText}' not found`); 
            }

            return result; 
        } catch(error) {
            console.error(`Error searching subreddits: `, error.message); 
            throw error; 
        }
    }

    /**
     * Get subreddit statistics
     * @returns Statistics about subreddits
     */
    async getStatistics() {
        try {
            const stats = await this.subredditRepository.getStatistics();

            return stats; 
        } catch(error) {
            console.error('Error getting statistics: ', error.message);
            throw error; 
        }
    }
}

module.exports = SubredditService; 