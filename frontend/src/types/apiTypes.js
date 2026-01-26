/**
 * API Response Type Definitions and JSDoc types
 * Provides type checking and documentation for API responses
 */

/**
 * @typedef {Object} ApiResponse
 * @property {any} data - The response data
 * @property {number} status - HTTP status code
 * @property {string} message - Response message
 */

/**
 * @typedef {Object} PaginatedResponse
 * @property {Array} results - Array of items
 * @property {number} count - Total count of items
 * @property {string|null} next - URL to next page
 * @property {string|null} previous - URL to previous page
 */

/**
 * @typedef {Object} User
 * @property {number} id - User ID
 * @property {string} username - Username
 * @property {string} email - Email address
 * @property {string} firstName - First name
 * @property {string} lastName - Last name
 * @property {string} avatar - Avatar URL
 * @property {string} bio - User biography
 * @property {string} createdAt - Creation date
 * @property {string} updatedAt - Last update date
 * @property {boolean} isVerified - Email verification status
 */

/**
 * @typedef {Object} BlogPost
 * @property {number} id - Post ID
 * @property {string} slug - URL slug
 * @property {string} title - Post title
 * @property {string} excerpt - Post excerpt
 * @property {string} content - Post content (HTML)
 * @property {string} featuredImage - Featured image URL
 * @property {string} category - Category name
 * @property {Array<string>} tags - Post tags
 * @property {number} viewCount - Number of views
 * @property {number} likeCount - Number of likes
 * @property {boolean} isPublic - Public status
 * @property {boolean} isRestricted - Restricted status
 * @property {string} author - Author name
 * @property {string} createdAt - Creation date
 * @property {string} updatedAt - Last update date
 */

/**
 * @typedef {Object} Note
 * @property {number} id - Note ID
 * @property {string} title - Note title
 * @property {string} content - Note content
 * @property {Array<string>} tags - Note tags
 * @property {boolean} isPublic - Public status
 * @property {string} owner - Owner username
 * @property {string} createdAt - Creation date
 * @property {string} updatedAt - Last update date
 */

/**
 * @typedef {Object} HealthStatus
 * @property {string} status - Overall status (healthy, degraded, unhealthy)
 * @property {string} database - Database status
 * @property {boolean} debug - Debug mode status
 * @property {string} timestamp - Check timestamp
 */

/**
 * @typedef {Object} ApiError
 * @property {string} message - Error message
 * @property {number} status - HTTP status code
 * @property {Object} data - Error details
 * @property {Object} errors - Field-specific errors (form validation)
 */

/**
 * Response schemas for common endpoints
 */
export const ResponseSchemas = {
  // Auth endpoints
  AUTH: {
    LOGIN: {
      access: 'string',
      refresh: 'string',
      user: 'User',
    },
    REGISTER: {
      id: 'number',
      username: 'string',
      email: 'string',
    },
  },

  // Blog endpoints
  BLOG: {
    POST_LIST: {
      results: 'BlogPost[]',
      count: 'number',
      next: 'string|null',
      previous: 'string|null',
    },
    POST_DETAIL: 'BlogPost',
    CATEGORY_LIST: {
      id: 'number',
      name: 'string',
      postCount: 'number',
    },
  },

  // Notes endpoints
  NOTES: {
    LIST: {
      results: 'Note[]',
      count: 'number',
      next: 'string|null',
      previous: 'string|null',
    },
    DETAIL: 'Note',
    CREATE: 'Note',
  },

  // Health endpoints
  HEALTH: 'HealthStatus',
  VERSION: {
    version: 'string',
    api: 'string',
    environment: 'string',
  },

  // Contact endpoint
  CONTACT: {
    status: 'string',
    message: 'string',
  },
};

/**
 * Error codes and messages
 */
export const ErrorCodes = {
  // Client errors
  BAD_REQUEST: { code: 400, message: 'Bad request' },
  UNAUTHORIZED: { code: 401, message: 'Unauthorized' },
  FORBIDDEN: { code: 403, message: 'Forbidden' },
  NOT_FOUND: { code: 404, message: 'Not found' },
  CONFLICT: { code: 409, message: 'Conflict' },
  VALIDATION_ERROR: { code: 422, message: 'Validation error' },
  RATE_LIMIT: { code: 429, message: 'Too many requests' },

  // Server errors
  INTERNAL_ERROR: { code: 500, message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { code: 503, message: 'Service unavailable' },
};

/**
 * HTTP Status categories
 */
export const HttpStatus = {
  // Success
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  // Redirect
  MOVED_PERMANENTLY: 301,
  FOUND: 302,
  NOT_MODIFIED: 304,

  // Client Error
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,

  // Server Error
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  SERVICE_UNAVAILABLE: 503,
};

/**
 * Utility function to check if response is successful
 */
export const isSuccessStatus = (status) => {
  return status >= 200 && status < 300;
};

/**
 * Utility function to check if response is a client error
 */
export const isClientError = (status) => {
  return status >= 400 && status < 500;
};

/**
 * Utility function to check if response is a server error
 */
export const isServerError = (status) => {
  return status >= 500 && status < 600;
};

/**
 * Map status code to error message
 */
export const getErrorMessage = (statusCode) => {
  const errorMap = {
    [ErrorCodes.BAD_REQUEST.code]: ErrorCodes.BAD_REQUEST.message,
    [ErrorCodes.UNAUTHORIZED.code]: ErrorCodes.UNAUTHORIZED.message,
    [ErrorCodes.FORBIDDEN.code]: ErrorCodes.FORBIDDEN.message,
    [ErrorCodes.NOT_FOUND.code]: ErrorCodes.NOT_FOUND.message,
    [ErrorCodes.CONFLICT.code]: ErrorCodes.CONFLICT.message,
    [ErrorCodes.VALIDATION_ERROR.code]: ErrorCodes.VALIDATION_ERROR.message,
    [ErrorCodes.RATE_LIMIT.code]: ErrorCodes.RATE_LIMIT.message,
    [ErrorCodes.INTERNAL_ERROR.code]: ErrorCodes.INTERNAL_ERROR.message,
    [ErrorCodes.SERVICE_UNAVAILABLE.code]: ErrorCodes.SERVICE_UNAVAILABLE.message,
  };

  return errorMap[statusCode] || 'Unknown error';
};
