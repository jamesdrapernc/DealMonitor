// tests/unit/services/KeywordService.test.js

const KeywordService = require('../../../src/services/KeywordService');
const KeywordRepository = require('../../../src/repositories/KeywordRepository');
const { Keyword } = require('../../../src/models/Keyword');

// Mock the database connection
jest.mock('../../../src/config/database', () => ({
  // Mock database connection
}));

// Mock the KeywordRepository
jest.mock('../../../src/repositories/KeywordRepository');

describe('KeywordService', () => {
  let keywordService;
  let mockKeywordRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    keywordService = new KeywordService();
    mockKeywordRepository = keywordService.keywordRepository;

    // Always create all mock methods
    mockKeywordRepository.exists = mockKeywordRepository.exists || jest.fn();
    mockKeywordRepository.create = mockKeywordRepository.create || jest.fn();
    mockKeywordRepository.findAll = mockKeywordRepository.findAll || jest.fn();
    mockKeywordRepository.findById = mockKeywordRepository.findById || jest.fn();
    mockKeywordRepository.update = mockKeywordRepository.update || jest.fn();
    mockKeywordRepository.delete = mockKeywordRepository.delete || jest.fn();
    mockKeywordRepository.searchByText = mockKeywordRepository.searchByText || jest.fn();
    mockKeywordRepository.getStatistics = mockKeywordRepository.getStatistics || jest.fn();

    // Mock console methods
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  describe('createKeyword', () => {
    it('should create a new keyword successfully', async () => {
      // Arrange
      const keywordData = { keyword: 'gaming laptop' };
      const expectedKeyword = new Keyword({
        id: 1,
        keyword: 'gaming laptop',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockKeywordRepository.exists = jest.fn().mockResolvedValue(false);
      mockKeywordRepository.create = jest.fn().mockResolvedValue(expectedKeyword);

      // Act
      const result = await keywordService.createKeyword(keywordData);

      // Assert
      expect(mockKeywordRepository.exists).toHaveBeenCalledWith('gaming laptop');
      expect(mockKeywordRepository.create).toHaveBeenCalledWith({
        keyword: 'gaming laptop'
      });
      expect(result).toEqual(expectedKeyword);
      expect(result.keyword).toBe('gaming laptop');
    });

    it('should throw error when keyword already exists', async () => {
      // Arrange
      const keywordData = { keyword: 'gaming laptop' };
      mockKeywordRepository.exists = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(keywordService.createKeyword(keywordData))
        .rejects
        .toThrow("Keyword 'gaming laptop' already exists");

      expect(mockKeywordRepository.exists).toHaveBeenCalledWith('gaming laptop');
      expect(mockKeywordRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid input', async () => {
      // Arrange
      const invalidData = { keyword: '' }; // Empty keyword

      // Act & Assert
      await expect(keywordService.createKeyword(invalidData))
        .rejects
        .toThrow('Validation error');

      expect(mockKeywordRepository.exists).not.toHaveBeenCalled();
      expect(mockKeywordRepository.create).not.toHaveBeenCalled();
    });

    it('should trim whitespace from keyword', async () => {
      // Arrange
      const keywordData = { keyword: '  gaming laptop  ' };
      const expectedKeyword = new Keyword({
        id: 1,
        keyword: 'gaming laptop',
        createdAt: new Date()
      });

      mockKeywordRepository.exists = jest.fn().mockResolvedValue(false);
      mockKeywordRepository.create = jest.fn().mockResolvedValue(expectedKeyword);

      // Act
      const result = await keywordService.createKeyword(keywordData);

      // Assert
      expect(mockKeywordRepository.exists).toHaveBeenCalledWith('gaming laptop');
      expect(mockKeywordRepository.create).toHaveBeenCalledWith({
        keyword: 'gaming laptop'
      });
      expect(result.keyword).toBe('gaming laptop');
    });
  });

  describe('getAllKeywords', () => {
    it('should return paginated keywords with default options', async () => {
      // Arrange
      const mockResult = {
        keywords: [
          new Keyword({ id: 1, keyword: 'laptop' }),
          new Keyword({ id: 2, keyword: 'monitor' })
        ],
        total: 2,
        page: 1,
        limit: 20,
        pages: 1
      };

      mockKeywordRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await keywordService.getAllKeywords();

      // Assert
      expect(mockKeywordRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(result).toEqual(mockResult);
      expect(result.keywords).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle custom pagination options', async () => {
      // Arrange
      const options = { page: 2, limit: 10, search: 'gaming' };
      const mockResult = {
        keywords: [],
        total: 0,
        page: 2,
        limit: 10,
        pages: 0
      };

      mockKeywordRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await keywordService.getAllKeywords(options);

      // Assert
      expect(mockKeywordRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'gaming',
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });
  });

  describe('getKeywordById', () => {
    it('should return keyword when found', async () => {
      // Arrange
      const keywordId = 1;
      const expectedKeyword = new Keyword({
        id: 1,
        keyword: 'gaming laptop',
        createdAt: new Date()
      });

      mockKeywordRepository.findById = jest.fn().mockResolvedValue(expectedKeyword);

      // Act
      const result = await keywordService.getKeywordById(keywordId);

      // Assert
      expect(mockKeywordRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedKeyword);
      expect(result.id).toBe(1);
    });

    it('should throw error when keyword not found', async () => {
      // Arrange
      const keywordId = 999;
      mockKeywordRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(keywordService.getKeywordById(keywordId))
        .rejects
        .toThrow('Keyword with ID 999 not found');

      expect(mockKeywordRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw error for invalid ID', async () => {
      // Act & Assert
      await expect(keywordService.getKeywordById('invalid'))
        .rejects
        .toThrow('Invalid keyword ID');

      await expect(keywordService.getKeywordById(null))
        .rejects
        .toThrow('Invalid keyword ID');

      expect(mockKeywordRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('updateKeyword', () => {
    it('should update keyword successfully', async () => {
      // Arrange
      const keywordId = 1;
      const updateData = { keyword: 'updated keyword' };
      const existingKeyword = new Keyword({
        id: 1,
        keyword: 'old keyword',
        createdAt: new Date()
      });
      const updatedKeyword = new Keyword({
        id: 1,
        keyword: 'updated keyword',
        createdAt: existingKeyword.createdAt,
        updatedAt: new Date()
      });

      mockKeywordRepository.findById = jest.fn().mockResolvedValue(existingKeyword);
      mockKeywordRepository.exists = jest.fn().mockResolvedValue(false);
      mockKeywordRepository.update = jest.fn().mockResolvedValue(updatedKeyword);

      // Act
      const result = await keywordService.updateKeyword(keywordId, updateData);

      // Assert
      expect(mockKeywordRepository.findById).toHaveBeenCalledWith(1);
      expect(mockKeywordRepository.exists).toHaveBeenCalledWith('updated keyword');
      expect(mockKeywordRepository.update).toHaveBeenCalledWith(1, {
        id: 1,
        keyword: 'updated keyword'
      });
      expect(result).toEqual(updatedKeyword);
    });

    it('should throw error when trying to update to existing keyword', async () => {
      // Arrange
      const keywordId = 1;
      const updateData = { keyword: 'existing keyword' };
      const existingKeyword = new Keyword({
        id: 1,
        keyword: 'old keyword'
      });

      mockKeywordRepository.findById = jest.fn().mockResolvedValue(existingKeyword);
      mockKeywordRepository.exists = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(keywordService.updateKeyword(keywordId, updateData))
        .rejects
        .toThrow("Keyword 'existing keyword' already exists");

      expect(mockKeywordRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when keyword to update not found', async () => {
      // Arrange
      const keywordId = 999;
      const updateData = { keyword: 'new keyword' };

      mockKeywordRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(keywordService.updateKeyword(keywordId, updateData))
        .rejects
        .toThrow('Keyword with ID 999 not found');

      expect(mockKeywordRepository.exists).not.toHaveBeenCalled();
      expect(mockKeywordRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('deleteKeyword', () => {
    it('should delete keyword successfully', async () => {
      // Arrange
      const keywordId = 1;
      const existingKeyword = new Keyword({
        id: 1,
        keyword: 'keyword to delete'
      });

      mockKeywordRepository.findById = jest.fn().mockResolvedValue(existingKeyword);
      mockKeywordRepository.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await keywordService.deleteKeyword(keywordId);

      // Assert
      expect(mockKeywordRepository.findById).toHaveBeenCalledWith(1);
      expect(mockKeywordRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error when keyword to delete not found', async () => {
      // Arrange
      const keywordId = 999;
      mockKeywordRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(keywordService.deleteKeyword(keywordId))
        .rejects
        .toThrow('Keyword with ID 999 not found');

      expect(mockKeywordRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('searchKeywords', () => {
    it('should return matching keywords', async () => {
      // Arrange
      const searchText = 'gaming';
      const expectedKeywords = [
        new Keyword({ id: 1, keyword: 'gaming laptop' }),
        new Keyword({ id: 2, keyword: 'gaming mouse' })
      ];

      mockKeywordRepository.searchByText = jest.fn().mockResolvedValue(expectedKeywords);

      // Act
      const result = await keywordService.searchKeywords(searchText);

      // Assert
      expect(mockKeywordRepository.searchByText).toHaveBeenCalledWith('gaming', 20);
      expect(result).toEqual(expectedKeywords);
      expect(result).toHaveLength(2);
    });

    it('should throw error for empty search text', async () => {
      // Act & Assert
      await expect(keywordService.searchKeywords(''))
        .rejects
        .toThrow('Search text is required');

      await expect(keywordService.searchKeywords('   '))
        .rejects
        .toThrow('Search text is required');

      expect(mockKeywordRepository.searchByText).not.toHaveBeenCalled();
    });
  });

  describe('getStatistics', () => {
    it('should return keyword statistics', async () => {
      // Arrange
      const expectedStats = {
        totalKeywords: 10,
        activeKeywords: 8,
        inactiveKeywords: 2
      };

      mockKeywordRepository.getStatistics = jest.fn().mockResolvedValue(expectedStats);

      // Act
      const result = await keywordService.getStatistics();

      // Assert
      expect(mockKeywordRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
      expect(result.totalKeywords).toBe(10);
    });
  });
});