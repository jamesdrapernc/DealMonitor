// tests/unit/services/SubredditServiceTest.js

const SubredditService = require('../../../src/services/SubredditService');
const { Subreddit } = require('../../../src/models/Subreddit');

// Mock the database and repository
jest.mock('../../../src/config/database', () => ({}));
jest.mock('../../../src/repositories/SubredditRepository');

describe('SubredditService', () => {
  let subredditService;
  let mockSubredditRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh service instance
    subredditService = new SubredditService();
    
    // Get the mocked repository instance
    mockSubredditRepository = subredditService.subredditRepository;

    // Always create all mock methods
    mockSubredditRepository.exists = mockSubredditRepository.exists || jest.fn();
    mockSubredditRepository.create = mockSubredditRepository.create || jest.fn();
    mockSubredditRepository.findAll = mockSubredditRepository.findAll || jest.fn();
    mockSubredditRepository.findById = mockSubredditRepository.findById || jest.fn();
    mockSubredditRepository.findByName = mockSubredditRepository.findByName || jest.fn();
    mockSubredditRepository.update = mockSubredditRepository.update || jest.fn();
    mockSubredditRepository.delete = mockSubredditRepository.delete || jest.fn();
    mockSubredditRepository.searchByName = mockSubredditRepository.searchByName || jest.fn();
    mockSubredditRepository.getStatistics = mockSubredditRepository.getStatistics || jest.fn();

    // Mock console methods to keep test output clean
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('createSubreddit', () => {
    it('should create a new subreddit successfully', async () => {
      // Arrange
      const subredditData = { name: 'gaming' };
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockSubredditRepository.exists = jest.fn().mockResolvedValue(false);
      mockSubredditRepository.create = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.createSubreddit(subredditData);

      // Assert
      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('gaming');
      expect(mockSubredditRepository.create).toHaveBeenCalledWith({
        name: 'gaming'
      });
      expect(result).toEqual(expectedSubreddit);
      expect(result.name).toBe('gaming');
    });

    it('should throw error when subreddit already exists', async () => {
      // Arrange
      const subredditData = { name: 'gaming' };
      mockSubredditRepository.exists = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(subredditService.createSubreddit(subredditData))
        .rejects
        .toThrow('Subreddit gaming already exists');

      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('gaming');
      expect(mockSubredditRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid input', async () => {
      // Arrange
      const invalidData = { name: '' }; // Empty name

      // Act & Assert
      await expect(subredditService.createSubreddit(invalidData))
        .rejects
        .toThrow('Validation error');

      expect(mockSubredditRepository.exists).not.toHaveBeenCalled();
      expect(mockSubredditRepository.create).not.toHaveBeenCalled();
    });

    it('should normalize subreddit name by trimming whitespace', async () => {
      // Arrange
      const subredditData = { name: '  gaming  ' };
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.exists = jest.fn().mockResolvedValue(false);
      mockSubredditRepository.create = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.createSubreddit(subredditData);

      // Assert
      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('gaming');
      expect(mockSubredditRepository.create).toHaveBeenCalledWith({
        name: 'gaming'
      });
      expect(result.name).toBe('gaming');
    });

    it('should handle r/ prefix in subreddit name', async () => {
      // Arrange
      const subredditData = { name: 'r/gaming' };
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.exists = jest.fn().mockResolvedValue(false);
      mockSubredditRepository.create = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.createSubreddit(subredditData);

      // Assert
      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('gaming');
      expect(mockSubredditRepository.create).toHaveBeenCalledWith({
        name: 'gaming'
      });
    });

    it('should convert name to lowercase', async () => {
      // Arrange
      const subredditData = { name: 'GAMING' };
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.exists = jest.fn().mockResolvedValue(false);
      mockSubredditRepository.create = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.createSubreddit(subredditData);

      // Assert
      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('gaming');
      expect(result.name).toBe('gaming');
    });
  });

  describe('getAllSubreddits', () => {
    it('should return paginated subreddits with default options', async () => {
      // Arrange
      const mockResult = {
        subreddits: [
          new Subreddit({ id: 1, name: 'gaming' }),
          new Subreddit({ id: 2, name: 'technology' })
        ],
        total: 2,
        page: 1,
        limit: 20,
        pages: 1
      };

      mockSubredditRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await subredditService.getAllSubreddits();

      // Assert
      expect(mockSubredditRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      expect(result.subreddits).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle custom pagination options', async () => {
      // Arrange
      const options = { page: 2, limit: 10, search: 'gam' };
      const mockResult = {
        subreddits: [],
        total: 0,
        page: 2,
        limit: 10,
        pages: 0
      };

      mockSubredditRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await subredditService.getAllSubreddits(options);

      // Assert
      expect(mockSubredditRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'gam',
        sortBy: 'name',
        sortOrder: 'asc'
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('getSubredditById', () => {
    it('should return subreddit when found', async () => {
      // Arrange
      const subredditId = 1;
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.getSubredditById(subredditId);

      // Assert
      expect(mockSubredditRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedSubreddit);
      expect(result.id).toBe(1);
    });

    it('should throw error when subreddit not found', async () => {
      // Arrange
      const subredditId = 999;
      mockSubredditRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(subredditService.getSubredditById(subredditId))
        .rejects
        .toThrow('Subreddit with ID 999 not found');

      expect(mockSubredditRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw error for invalid ID', async () => {
      // Act & Assert
      await expect(subredditService.getSubredditById('invalid'))
        .rejects
        .toThrow('Invalid subreddit ID');

      await expect(subredditService.getSubredditById(null))
        .rejects
        .toThrow('Invalid subreddit ID');

      expect(mockSubredditRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('getSubredditByName', () => {
    it('should return subreddit when found by name', async () => {
      // Arrange
      const subredditName = 'gaming';
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.findByName = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.getSubredditByName(subredditName);

      // Assert
      expect(mockSubredditRepository.findByName).toHaveBeenCalledWith('gaming');
      expect(result).toEqual(expectedSubreddit);
      expect(result.name).toBe('gaming');
    });

    it('should normalize name before searching', async () => {
      // Arrange
      const subredditName = 'r/Gaming';
      const expectedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });

      mockSubredditRepository.findByName = jest.fn().mockResolvedValue(expectedSubreddit);

      // Act
      const result = await subredditService.getSubredditByName(subredditName);

      // Assert
      expect(mockSubredditRepository.findByName).toHaveBeenCalledWith('gaming');
      expect(result.name).toBe('gaming');
    });

    it('should throw error when subreddit not found by name', async () => {
      // Arrange
      const subredditName = 'nonexistent';
      mockSubredditRepository.findByName = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(subredditService.getSubredditByName(subredditName))
        .rejects
        .toThrow("Subreddit with name 'nonexistent' not found");

      expect(mockSubredditRepository.findByName).toHaveBeenCalledWith('nonexistent');
    });

    it('should throw error for invalid name', async () => {
      // Act & Assert
      await expect(subredditService.getSubredditByName(''))
        .rejects
        .toThrow('Invalid subreddit name');

      await expect(subredditService.getSubredditByName('   '))
        .rejects
        .toThrow('Invalid subreddit name');

      expect(mockSubredditRepository.findByName).not.toHaveBeenCalled();
    });
  });

  describe('updateSubreddit', () => {
    it('should update subreddit successfully', async () => {
      // Arrange
      const subredditId = 1;
      const updateData = { name: 'updated-gaming' };
      const existingSubreddit = new Subreddit({
        id: 1,
        name: 'gaming',
        createdAt: new Date()
      });
      const updatedSubreddit = new Subreddit({
        id: 1,
        name: 'updated-gaming',
        createdAt: existingSubreddit.createdAt,
        updatedAt: new Date()
      });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(existingSubreddit);
      mockSubredditRepository.exists = jest.fn().mockResolvedValue(false);
      mockSubredditRepository.update = jest.fn().mockResolvedValue(updatedSubreddit);

      // Act
      const result = await subredditService.updateSubreddit(subredditId, updateData);

      // Assert
      expect(mockSubredditRepository.findById).toHaveBeenCalledWith(1);
      expect(mockSubredditRepository.exists).toHaveBeenCalledWith('updated-gaming');
      expect(mockSubredditRepository.update).toHaveBeenCalledWith(1, {
        id: 1,
        name: 'updated-gaming'
      });
      expect(result).toEqual(updatedSubreddit);
    });

    it('should throw error when trying to update to existing subreddit name', async () => {
      // Arrange
      const subredditId = 1;
      const updateData = { name: 'existing-subreddit' };
      const existingSubreddit = new Subreddit({
        id: 1,
        name: 'gaming'
      });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(existingSubreddit);
      mockSubredditRepository.exists = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(subredditService.updateSubreddit(subredditId, updateData))
        .rejects
        .toThrow('Subreddit existing-subreddit already exists');

      expect(mockSubredditRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when subreddit to update not found', async () => {
      // Arrange
      const subredditId = 999;
      const updateData = { name: 'new-name' };

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(subredditService.updateSubreddit(subredditId, updateData))
        .rejects
        .toThrow('Subreddit with ID 999 not found');

      expect(mockSubredditRepository.exists).not.toHaveBeenCalled();
      expect(mockSubredditRepository.update).not.toHaveBeenCalled();
    });

    it('should not check for duplicates when name is not being updated', async () => {
      // Arrange - update data without name change
      const subredditId = 1;
      const updateData = {}; // No name field
      const existingSubreddit = new Subreddit({
        id: 1,
        name: 'gaming'
      });
      const updatedSubreddit = new Subreddit({
        id: 1,
        name: 'gaming'
      });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(existingSubreddit);
      mockSubredditRepository.update = jest.fn().mockResolvedValue(updatedSubreddit);

      // Act
      const result = await subredditService.updateSubreddit(subredditId, updateData);

      // Assert
      expect(mockSubredditRepository.exists).not.toHaveBeenCalled();
      expect(mockSubredditRepository.update).toHaveBeenCalledWith(1, { id: 1 });
    });
  });

  describe('deleteSubreddit', () => {
    it('should delete subreddit successfully', async () => {
      // Arrange
      const subredditId = 1;
      const existingSubreddit = new Subreddit({
        id: 1,
        name: 'gaming'
      });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(existingSubreddit);
      mockSubredditRepository.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await subredditService.deleteSubreddit(subredditId);

      // Assert
      expect(mockSubredditRepository.findById).toHaveBeenCalledWith(1);
      expect(mockSubredditRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error when subreddit to delete not found', async () => {
      // Arrange
      const subredditId = 999;
      mockSubredditRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(subredditService.deleteSubreddit(subredditId))
        .rejects
        .toThrow('Subreddit with ID 999 not found');

      expect(mockSubredditRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error for invalid ID', async () => {
      // Act & Assert
      await expect(subredditService.deleteSubreddit('invalid'))
        .rejects
        .toThrow('Invalid subreddit id');

      expect(mockSubredditRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when deletion fails', async () => {
      // Arrange
      const subredditId = 1;
      const existingSubreddit = new Subreddit({ id: 1, name: 'gaming' });

      mockSubredditRepository.findById = jest.fn().mockResolvedValue(existingSubreddit);
      mockSubredditRepository.delete = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(subredditService.deleteSubreddit(subredditId))
        .rejects
        .toThrow('Failed to delete subreddit');
    });
  });

  describe('searchSubreddits', () => {
    it('should return matching subreddits', async () => {
      // Arrange
      const searchText = 'gam';
      const expectedSubreddits = [
        new Subreddit({ id: 1, name: 'gaming' }),
        new Subreddit({ id: 2, name: 'games' })
      ];

      mockSubredditRepository.searchByName = jest.fn().mockResolvedValue(expectedSubreddits);

      // Act
      const result = await subredditService.searchSubreddits(searchText);

      // Assert
      expect(mockSubredditRepository.searchByName).toHaveBeenCalledWith('gam', 50);
      expect(result).toEqual(expectedSubreddits);
      expect(result).toHaveLength(2);
    });

    it('should handle custom limit', async () => {
      // Arrange
      const searchText = 'tech';
      const limit = 10;
      const expectedSubreddits = [new Subreddit({ id: 1, name: 'technology' })];

      mockSubredditRepository.searchByName = jest.fn().mockResolvedValue(expectedSubreddits);

      // Act
      const result = await subredditService.searchSubreddits(searchText, limit);

      // Assert
      expect(mockSubredditRepository.searchByName).toHaveBeenCalledWith('tech', 10);
      expect(result).toEqual(expectedSubreddits);
    });

    it('should normalize search text', async () => {
      // Arrange
      const searchText = 'r/Gaming';
      const expectedSubreddits = [new Subreddit({ id: 1, name: 'gaming' })];

      mockSubredditRepository.searchByName = jest.fn().mockResolvedValue(expectedSubreddits);

      // Act
      const result = await subredditService.searchSubreddits(searchText);

      // Assert
      expect(mockSubredditRepository.searchByName).toHaveBeenCalledWith('gaming', 50);
    });

    it('should throw error for empty search text', async () => {
      // Act & Assert
      await expect(subredditService.searchSubreddits(''))
        .rejects
        .toThrow('Search text is required');

      await expect(subredditService.searchSubreddits('   '))
        .rejects
        .toThrow('Search text is required');

      expect(mockSubredditRepository.searchByName).not.toHaveBeenCalled();
    });

    it('should trim search text', async () => {
      // Arrange
      const searchText = '  gaming  ';
      const expectedSubreddits = [];

      mockSubredditRepository.searchByName = jest.fn().mockResolvedValue(expectedSubreddits);

      // Act
      await subredditService.searchSubreddits(searchText);

      // Assert
      expect(mockSubredditRepository.searchByName).toHaveBeenCalledWith('gaming', 50);
    });
  });

  describe('getStatistics', () => {
    it('should return subreddit statistics', async () => {
      // Arrange
      const expectedStats = {
        totalSubreddits: 15
      };

      mockSubredditRepository.getStatistics = jest.fn().mockResolvedValue(expectedStats);

      // Act
      const result = await subredditService.getStatistics();

      // Assert
      expect(mockSubredditRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
      expect(result.totalSubreddits).toBe(15);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const expectedStats = {
        totalSubreddits: 0
      };

      mockSubredditRepository.getStatistics = jest.fn().mockResolvedValue(expectedStats);

      // Act
      const result = await subredditService.getStatistics();

      // Assert
      expect(result.totalSubreddits).toBe(0);
    });
  });
});