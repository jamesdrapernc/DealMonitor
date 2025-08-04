 // tests/unit/services/PostServiceTest.js

const PostService = require('../../../src/services/PostService');
const { Post } = require('../../../src/models/Post');

// Mock the database and repository
jest.mock('../../../src/config/database', () => ({}));
jest.mock('../../../src/repositories/PostRepository');

describe('PostService', () => {
  let postService;
  let mockPostRepository;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a fresh service instance
    postService = new PostService();
    
    // Get the mocked repository instance
    mockPostRepository = postService.postRepository;

    // Always create all mock methods
    mockPostRepository.existsByTitle = mockPostRepository.existsByTitle || jest.fn();
    mockPostRepository.create = mockPostRepository.create || jest.fn();
    mockPostRepository.findAll = mockPostRepository.findAll || jest.fn();
    mockPostRepository.findById = mockPostRepository.findById || jest.fn();
    mockPostRepository.update = mockPostRepository.update || jest.fn();
    mockPostRepository.delete = mockPostRepository.delete || jest.fn();
    mockPostRepository.searchByText = mockPostRepository.searchByText || jest.fn();
    mockPostRepository.findPostsWithLinks = mockPostRepository.findPostsWithLinks || jest.fn();
    mockPostRepository.getStatistics = mockPostRepository.getStatistics || jest.fn();

    // Mock console methods to keep test output clean
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restore console methods
    console.log.mockRestore();
    console.error.mockRestore();
  });

  describe('createPost', () => {
    it('should create a new post successfully', async () => {
      // Arrange
      const postData = {
        title: 'Amazing Gaming Setup',
        description: 'Check out this incredible gaming setup',
        links: ['https://example.com/setup']
      };
      const expectedPost = new Post({
        id: 1,
        title: 'Amazing Gaming Setup',
        description: 'Check out this incredible gaming setup',
        links: ['https://example.com/setup'],
        createdAt: new Date(),
        updatedAt: new Date()
      });

      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(false);
      mockPostRepository.create = jest.fn().mockResolvedValue(expectedPost);

      // Act
      const result = await postService.createPost(postData);

      // Assert
      expect(mockPostRepository.existsByTitle).toHaveBeenCalledWith('Amazing Gaming Setup');
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        title: 'Amazing Gaming Setup',
        description: 'Check out this incredible gaming setup',
        links: ['https://example.com/setup']
      });
      expect(result).toEqual(expectedPost);
      expect(result.title).toBe('Amazing Gaming Setup');
    });

    it('should throw error when post title already exists', async () => {
      // Arrange
      const postData = {
        title: 'Existing Post',
        description: 'This title already exists',
        links: []
      };
      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(postService.createPost(postData))
        .rejects
        .toThrow('Duplicate post exists');

      expect(mockPostRepository.existsByTitle).toHaveBeenCalledWith('Existing Post');
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it('should throw validation error for invalid input', async () => {
      // Arrange
      const invalidData = { title: '' }; // Empty title

      // Act & Assert
      await expect(postService.createPost(invalidData))
        .rejects
        .toThrow('Validation error');

      expect(mockPostRepository.existsByTitle).not.toHaveBeenCalled();
      expect(mockPostRepository.create).not.toHaveBeenCalled();
    });

    it('should trim whitespace from title and description', async () => {
      // Arrange
      const postData = {
        title: '  Gaming Setup  ',
        description: '  Great setup!  ',
        links: []
      };
      const expectedPost = new Post({
        id: 1,
        title: 'Gaming Setup',
        description: 'Great setup!',
        links: []
      });

      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(false);
      mockPostRepository.create = jest.fn().mockResolvedValue(expectedPost);

      // Act
      const result = await postService.createPost(postData);

      // Assert
      expect(mockPostRepository.existsByTitle).toHaveBeenCalledWith('Gaming Setup');
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        title: 'Gaming Setup',
        description: 'Great setup!',
        links: []
      });
    });

    it('should handle null description gracefully', async () => {
      // Arrange
      const postData = {
        title: 'Post Without Description',
        description: null,
        links: []
      };
      const expectedPost = new Post({
        id: 1,
        title: 'Post Without Description',
        description: null,
        links: []
      });

      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(false);
      mockPostRepository.create = jest.fn().mockResolvedValue(expectedPost);

      // Act
      const result = await postService.createPost(postData);

      // Assert
      expect(mockPostRepository.create).toHaveBeenCalledWith({
        title: 'Post Without Description',
        description: null,
        links: []
      });
      expect(result.description).toBeNull();
    });
  });

  describe('getAllPosts', () => {
    it('should return paginated posts with default options', async () => {
      // Arrange
      const mockResult = {
        posts: [
          new Post({ id: 1, title: 'First Post' }),
          new Post({ id: 2, title: 'Second Post' })
        ],
        total: 2,
        page: 1,
        limit: 20,
        pages: 1
      };

      mockPostRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await postService.getAllPosts();

      // Assert
      expect(mockPostRepository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockResult);
      expect(result.posts).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it('should handle custom pagination options', async () => {
      // Arrange
      const options = { page: 2, limit: 10, search: 'gaming' };
      const mockResult = {
        posts: [],
        total: 0,
        page: 2,
        limit: 10,
        pages: 0
      };

      mockPostRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await postService.getAllPosts(options);

      // Assert
      expect(mockPostRepository.findAll).toHaveBeenCalledWith({
        page: 2,
        limit: 10,
        search: 'gaming',
        hasLinks: undefined,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
      expect(result.page).toBe(2);
      expect(result.limit).toBe(10);
    });

    it('should handle posts with links filter', async () => {
      // Arrange
      const options = { hasLinks: true };
      const mockResult = {
        posts: [new Post({ id: 1, title: 'Post with links', links: ['http://example.com'] })],
        total: 1,
        page: 1,
        limit: 20,
        pages: 1
      };

      mockPostRepository.findAll = jest.fn().mockResolvedValue(mockResult);

      // Act
      const result = await postService.getAllPosts(options);

      // Assert
      expect(mockPostRepository.findAll).toHaveBeenCalledWith({
        page: 1,
        limit: 20,
        search: undefined,
        hasLinks: true,
        sortBy: 'created_at',
        sortOrder: 'desc'
      });
    });
  });

  describe('getPostById', () => {
    it('should return post when found', async () => {
      // Arrange
      const postId = 1;
      const expectedPost = new Post({
        id: 1,
        title: 'Gaming Setup Guide',
        description: 'Complete guide to gaming setup',
        createdAt: new Date()
      });

      mockPostRepository.findById = jest.fn().mockResolvedValue(expectedPost);

      // Act
      const result = await postService.getPostById(postId);

      // Assert
      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(result).toEqual(expectedPost);
      expect(result.id).toBe(1);
    });

    it('should throw error when post not found', async () => {
      // Arrange
      const postId = 999;
      mockPostRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(postService.getPostById(postId))
        .rejects
        .toThrow('Post with ID 999 not found');

      expect(mockPostRepository.findById).toHaveBeenCalledWith(999);
    });

    it('should throw error for invalid ID', async () => {
      // Act & Assert
      await expect(postService.getPostById('invalid'))
        .rejects
        .toThrow('Invalid post ID');

      await expect(postService.getPostById(null))
        .rejects
        .toThrow('Invalid post ID');

      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });
  });

  describe('updatePost', () => {
    it('should update post successfully', async () => {
      // Arrange
      const postId = 1;
      const updateData = { title: 'Updated Gaming Setup' };
      const existingPost = new Post({
        id: 1,
        title: 'Old Gaming Setup',
        description: 'Old description',
        createdAt: new Date()
      });
      const updatedPost = new Post({
        id: 1,
        title: 'Updated Gaming Setup',
        description: 'Old description',
        createdAt: existingPost.createdAt,
        updatedAt: new Date()
      });

      mockPostRepository.findById = jest.fn().mockResolvedValue(existingPost);
      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(false);
      mockPostRepository.update = jest.fn().mockResolvedValue(updatedPost);

      // Act
      const result = await postService.updatePost(postId, updateData);

      // Assert
      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.existsByTitle).toHaveBeenCalledWith('Updated Gaming Setup');
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, {
        id: 1,
        title: 'Updated Gaming Setup'
      });
      expect(result).toEqual(updatedPost);
    });

    it('should throw error when trying to update to existing title', async () => {
      // Arrange
      const postId = 1;
      const updateData = { title: 'Existing Title' };
      const existingPost = new Post({
        id: 1,
        title: 'Original Title'
      });

      mockPostRepository.findById = jest.fn().mockResolvedValue(existingPost);
      mockPostRepository.existsByTitle = jest.fn().mockResolvedValue(true);

      // Act & Assert
      await expect(postService.updatePost(postId, updateData))
        .rejects
        .toThrow("Post 'Existing Title' already exists");

      expect(mockPostRepository.update).not.toHaveBeenCalled();
    });

    it('should throw error when post to update not found', async () => {
      // Arrange
      const postId = 999;
      const updateData = { title: 'New Title' };

      mockPostRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(postService.updatePost(postId, updateData))
        .rejects
        .toThrow('Post with ID 999 not found');

      expect(mockPostRepository.existsByTitle).not.toHaveBeenCalled();
      expect(mockPostRepository.update).not.toHaveBeenCalled();
    });

    it('should not check for duplicates when title is not being updated', async () => {
      // Arrange
      const postId = 1;
      const updateData = { description: 'New description only' };
      const existingPost = new Post({
        id: 1,
        title: 'Same Title',
        description: 'Old description'
      });
      const updatedPost = new Post({
        id: 1,
        title: 'Same Title',
        description: 'New description only'
      });

      mockPostRepository.findById = jest.fn().mockResolvedValue(existingPost);
      mockPostRepository.update = jest.fn().mockResolvedValue(updatedPost);

      // Act
      const result = await postService.updatePost(postId, updateData);

      // Assert
      expect(mockPostRepository.existsByTitle).not.toHaveBeenCalled();
      expect(mockPostRepository.update).toHaveBeenCalledWith(1, {
        id: 1,
        description: 'New description only'
      });
    });
  });

  describe('deletePost', () => {
    it('should delete post successfully', async () => {
      // Arrange
      const postId = 1;
      const existingPost = new Post({
        id: 1,
        title: 'Post to delete'
      });

      mockPostRepository.findById = jest.fn().mockResolvedValue(existingPost);
      mockPostRepository.delete = jest.fn().mockResolvedValue(true);

      // Act
      const result = await postService.deletePost(postId);

      // Assert
      expect(mockPostRepository.findById).toHaveBeenCalledWith(1);
      expect(mockPostRepository.delete).toHaveBeenCalledWith(1);
      expect(result).toBe(true);
    });

    it('should throw error when post to delete not found', async () => {
      // Arrange
      const postId = 999;
      mockPostRepository.findById = jest.fn().mockResolvedValue(null);

      // Act & Assert
      await expect(postService.deletePost(postId))
        .rejects
        .toThrow('Post with ID 999 not found');

      expect(mockPostRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw error for invalid ID', async () => {
      // Act & Assert
      await expect(postService.deletePost('invalid'))
        .rejects
        .toThrow('Invalid post ID');

      expect(mockPostRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw error when deletion fails', async () => {
      // Arrange
      const postId = 1;
      const existingPost = new Post({ id: 1, title: 'Test Post' });

      mockPostRepository.findById = jest.fn().mockResolvedValue(existingPost);
      mockPostRepository.delete = jest.fn().mockResolvedValue(false);

      // Act & Assert
      await expect(postService.deletePost(postId))
        .rejects
        .toThrow('Failed to delete post');
    });
  });

  describe('searchPosts', () => {
    it('should return matching posts', async () => {
      // Arrange
      const searchText = 'gaming';
      const expectedPosts = [
        new Post({ id: 1, title: 'Gaming Setup Guide' }),
        new Post({ id: 2, title: 'Best Gaming Chair' })
      ];

      mockPostRepository.searchByText = jest.fn().mockResolvedValue(expectedPosts);

      // Act
      const result = await postService.searchPosts(searchText);

      // Assert
      expect(mockPostRepository.searchByText).toHaveBeenCalledWith('gaming', 20);
      expect(result).toEqual(expectedPosts);
      expect(result).toHaveLength(2);
    });

    it('should handle custom limit', async () => {
      // Arrange
      const searchText = 'setup';
      const limit = 5;
      const expectedPosts = [new Post({ id: 1, title: 'Gaming Setup' })];

      mockPostRepository.searchByText = jest.fn().mockResolvedValue(expectedPosts);

      // Act
      const result = await postService.searchPosts(searchText, limit);

      // Assert
      expect(mockPostRepository.searchByText).toHaveBeenCalledWith('setup', 5);
      expect(result).toEqual(expectedPosts);
    });

    it('should throw error for empty search text', async () => {
      // Act & Assert
      await expect(postService.searchPosts(''))
        .rejects
        .toThrow('Search text is required');

      await expect(postService.searchPosts('   '))
        .rejects
        .toThrow('Search text is required');

      expect(mockPostRepository.searchByText).not.toHaveBeenCalled();
    });

    it('should trim search text', async () => {
      // Arrange
      const searchText = '  gaming setup  ';
      const expectedPosts = [];

      mockPostRepository.searchByText = jest.fn().mockResolvedValue(expectedPosts);

      // Act
      await postService.searchPosts(searchText);

      // Assert
      expect(mockPostRepository.searchByText).toHaveBeenCalledWith('gaming setup', 20);
    });
  });

  describe('getPostsWithLinks', () => {
    it('should return posts that have links', async () => {
      // Arrange
      const expectedPosts = [
        new Post({ 
          id: 1, 
          title: 'Post with links', 
          links: ['http://example.com', 'http://test.com'] 
        }),
        new Post({ 
          id: 2, 
          title: 'Another post with links', 
          links: ['http://another.com'] 
        })
      ];

      mockPostRepository.findPostsWithLinks = jest.fn().mockResolvedValue(expectedPosts);

      // Act
      const result = await postService.getPostsWithLinks();

      // Assert
      expect(mockPostRepository.findPostsWithLinks).toHaveBeenCalled();
      expect(result).toEqual(expectedPosts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no posts have links', async () => {
      // Arrange
      mockPostRepository.findPostsWithLinks = jest.fn().mockResolvedValue([]);

      // Act
      const result = await postService.getPostsWithLinks();

      // Assert
      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('getStatistics', () => {
    it('should return post statistics', async () => {
      // Arrange
      const expectedStats = {
        totalPosts: 25,
        postsWithLinks: 15,
        postsWithoutLinks: 10,
        averageDescriptionLength: 150
      };

      mockPostRepository.getStatistics = jest.fn().mockResolvedValue(expectedStats);

      // Act
      const result = await postService.getStatistics();

      // Assert
      expect(mockPostRepository.getStatistics).toHaveBeenCalled();
      expect(result).toEqual(expectedStats);
      expect(result.totalPosts).toBe(25);
      expect(result.postsWithLinks).toBe(15);
      expect(result.postsWithoutLinks).toBe(10);
    });

    it('should handle empty statistics', async () => {
      // Arrange
      const expectedStats = {
        totalPosts: 0,
        postsWithLinks: 0,
        postsWithoutLinks: 0,
        averageDescriptionLength: 0
      };

      mockPostRepository.getStatistics = jest.fn().mockResolvedValue(expectedStats);

      // Act
      const result = await postService.getStatistics();

      // Assert
      expect(result.totalPosts).toBe(0);
    });
  });
});