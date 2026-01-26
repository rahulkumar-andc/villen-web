import { useState, useCallback, useEffect } from 'react';
import api from '../api/client';

/**
 * Hook for managing blog post reactions
 */
export const useReactions = (postSlug, initialSummary = null, initialUserReactions = []) => {
  const [summary, setSummary] = useState(initialSummary || {
    like: 0,
    insightful: 0,
    helpful: 0,
    interesting: 0,
    confusing: 0,
    total: 0
  });
  const [userReactions, setUserReactions] = useState(initialUserReactions);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch reactions for a post
  const fetchReactions = useCallback(async () => {
    if (!postSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/blog/posts/${postSlug}/reactions/get/`);
      setSummary(response.data.summary || summary);
      setUserReactions(response.data.user_reactions || []);
    } catch (err) {
      console.error('Failed to fetch reactions:', err);
      setError(err.response?.data?.error || 'Failed to load reactions');
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  // Load initial data
  useEffect(() => {
    if (initialSummary === null || initialUserReactions.length === 0) {
      fetchReactions();
    }
  }, [postSlug]);

  // Toggle a reaction (add if not present, remove if present)
  const toggleReaction = useCallback(async (reactionType) => {
    if (!postSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/blog/posts/${postSlug}/reactions/`, {
        reaction: reactionType
      });
      
      // Update summary
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
      
      // Update user reactions
      if (response.data.action === 'added') {
        setUserReactions(prev => [...prev, reactionType]);
      } else if (response.data.action === 'removed') {
        setUserReactions(prev => prev.filter(r => r !== reactionType));
      }
      
      return response.data;
    } catch (err) {
      console.error('Failed to toggle reaction:', err);
      setError(err.response?.data?.error || 'Failed to update reaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  // Add a reaction
  const addReaction = useCallback(async (reactionType) => {
    if (!postSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post(`/blog/posts/${postSlug}/reactions/`, {
        reaction: reactionType
      });
      
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
      
      if (response.data.action === 'added' && !userReactions.includes(reactionType)) {
        setUserReactions(prev => [...prev, reactionType]);
      }
      
      return response.data;
    } catch (err) {
      console.error('Failed to add reaction:', err);
      setError(err.response?.data?.error || 'Failed to add reaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postSlug, userReactions]);

  // Remove a reaction
  const removeReaction = useCallback(async (reactionType) => {
    if (!postSlug) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.delete(`/blog/posts/${postSlug}/reactions/remove/`, {
        data: { reaction: reactionType }
      });
      
      if (response.data.summary) {
        setSummary(response.data.summary);
      }
      
      setUserReactions(prev => prev.filter(r => r !== reactionType));
      
      return response.data;
    } catch (err) {
      console.error('Failed to remove reaction:', err);
      setError(err.response?.data?.error || 'Failed to remove reaction');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [postSlug]);

  // Check if user has reacted with a specific type
  const hasReaction = useCallback((reactionType) => {
    return userReactions.includes(reactionType);
  }, [userReactions]);

  // Get count for a specific reaction
  const getCount = useCallback((reactionType) => {
    return summary[reactionType] || 0;
  }, [summary]);

  // Reset reactions
  const reset = useCallback(() => {
    setSummary({
      like: 0,
      insightful: 0,
      helpful: 0,
      interesting: 0,
      confusing: 0,
      total: 0
    });
    setUserReactions([]);
    setError(null);
  }, []);

  return {
    summary,
    userReactions,
    loading,
    error,
    toggleReaction,
    addReaction,
    removeReaction,
    fetchReactions,
    hasReaction,
    getCount,
    reset,
    isReacted: hasReaction,
    totalReactions: summary.total || 0
  };
};

// Reaction types configuration
export const REACTION_TYPES = [
  { type: 'like', emoji: '👍', label: 'Like', color: '#4CAF50' },
  { type: 'insightful', emoji: '💡', label: 'Insightful', color: '#FFC107' },
  { type: 'helpful', emoji: '📚', label: 'Helpful', color: '#2196F3' },
  { type: 'interesting', emoji: '🎯', label: 'Interesting', color: '#9C27B0' },
  { type: 'confusing', emoji: '❓', label: 'Confusing', color: '#FF9800' },
];

export default useReactions;

