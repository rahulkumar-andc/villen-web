import { z } from 'zod';

/**
 * Reusable Zod validation schemas for forms
 */

// Common field schemas
export const emailSchema = z
  .string('Email is required')
  .email('Invalid email address')
  .min(5, 'Email is too short')
  .max(255, 'Email is too long');

export const passwordSchema = z
  .string('Password is required')
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+=\-\[\]{};:,.<>?]/, 'Password must contain at least one special character');

export const usernameSchema = z
  .string('Username is required')
  .min(3, 'Username must be at least 3 characters')
  .max(50, 'Username is too long')
  .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores, and hyphens');

export const nameSchema = z
  .string('Name is required')
  .min(2, 'Name must be at least 2 characters')
  .max(100, 'Name is too long');

export const urlSchema = z
  .string()
  .url('Invalid URL')
  .optional()
  .or(z.literal(''));

// Auth Schemas
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string('Password is required'),
});

export const registerSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string('Confirm password is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string('Confirm password is required'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile Schemas
export const profileSchema = z.object({
  username: usernameSchema,
  email: emailSchema,
  firstName: nameSchema.optional(),
  lastName: nameSchema.optional(),
  bio: z.string().max(500, 'Bio is too long').optional(),
  avatar: urlSchema,
});

// Blog Schemas
export const blogPostSchema = z.object({
  title: z.string('Title is required').min(5, 'Title is too short').max(200, 'Title is too long'),
  slug: z.string('Slug is required').regex(/^[a-z0-9-]+$/, 'Invalid slug format'),
  excerpt: z.string().max(500, 'Excerpt is too long').optional(),
  content: z.string('Content is required').min(10, 'Content is too short'),
  category: z.string('Category is required'),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
  featuredImage: urlSchema,
});

// Contact Form Schema
export const contactFormSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  subject: z.string('Subject is required').min(5, 'Subject is too short').max(200, 'Subject is too long'),
  message: z.string('Message is required').min(10, 'Message is too short').max(5000, 'Message is too long'),
});

// Notes Schema
export const noteSchema = z.object({
  title: z.string('Title is required').min(1, 'Title is required').max(200, 'Title is too long'),
  content: z.string('Content is required').min(1, 'Content is required'),
  tags: z.array(z.string()).optional(),
  isPublic: z.boolean().default(false),
});

// Comment Schema
export const commentSchema = z.object({
  author: nameSchema,
  email: emailSchema,
  content: z.string('Comment is required').min(5, 'Comment is too short').max(1000, 'Comment is too long'),
});

/**
 * Utility function to parse and format validation errors
 */
export const formatValidationError = (error) => {
  if (error.errors) {
    return error.errors.reduce((acc, err) => {
      const path = err.path.join('.');
      acc[path] = err.message;
      return acc;
    }, {});
  }
  return { form: error.message };
};

/**
 * Utility function to validate data against schema
 */
export const validateData = (schema, data) => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated, errors: {} };
  } catch (error) {
    const errors = formatValidationError(error);
    return { success: false, data: null, errors };
  }
};
