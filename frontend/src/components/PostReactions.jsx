import React, { useState } from 'react';
import { useReactions, REACTION_TYPES } from '../hooks/useReactions';
import './PostReactions.css';

/**
 * PostReactions Component
 * Displays reaction buttons with counts for blog posts
 */
const PostReactions = ({
  postSlug,
  initialSummary,
  initialUserReactions,
  showLabels = true,
  showTotal = true,
  variant = 'default',
  compact = false,
  onReactionUpdate,
  className = ''
}) => {
  const {
    summary,
    userReactions,
    loading,
    toggleReaction,
    hasReaction,
    getCount,
    fetchReactions
  } = useReactions(postSlug, initialSummary, initialUserReactions);

  const [animatingReaction, setAnimatingReaction] = useState(null);

  const handleReactionClick = async (reactionType) => {
    setAnimatingReaction(reactionType);
    
    try {
      await toggleReaction(reactionType);
      
      // Call update callback if provided
      if (onReactionUpdate) {
        onReactionUpdate({
          summary,
          userReactions,
          reactionType,
          action: hasReaction(reactionType) ? 'removed' : 'added'
        });
      }
    } catch (error) {
      console.error('Reaction error:', error);
    } finally {
      setTimeout(() => setAnimatingReaction(null), 300);
    }
  };

  const totalReactions = Object.values(summary).reduce((sum, val) => {
    return typeof val === 'number' ? sum + val : sum;
  }, 0);

  if (variant === 'minimal') {
    return (
      <div className={`post-reactions minimal ${className}`}>
        <div className="reaction-buttons">
          {REACTION_TYPES.map((reaction) => {
            const count = getCount(reaction.type);
            const isReacted = hasReaction(reaction.type);
            
            return (
              <button
                key={reaction.type}
                className={`reaction-btn minimal-btn ${isReacted ? 'reacted' : ''} ${animatingReaction === reaction.type ? 'animating' : ''}`}
                onClick={() => handleReactionClick(reaction.type)}
                disabled={loading}
                title={reaction.label}
              >
                <span className="reaction-emoji">{reaction.emoji}</span>
                {count > 0 && <span className="reaction-count">{count}</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`post-reactions compact ${className}`}>
        <div className="reaction-buttons">
          {REACTION_TYPES.map((reaction) => {
            const count = getCount(reaction.type);
            const isReacted = hasReaction(reaction.type);
            
            return (
              <button
                key={reaction.type}
                className={`reaction-btn compact-btn ${isReacted ? 'reacted' : ''} ${animatingReaction === reaction.type ? 'animating' : ''}`}
                onClick={() => handleReactionClick(reaction.type)}
                disabled={loading}
                title={reaction.label}
              >
                <span className="reaction-emoji">{reaction.emoji}</span>
                <span className="reaction-label">{reaction.label}</span>
                {count > 0 && <span className="reaction-count">{count}</span>}
              </button>
            );
          })}
        </div>
        {showTotal && totalReactions > 0 && (
          <span className="total-reactions">
            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`post-reactions ${className}`}>
      {showTotal && totalReactions > 0 && (
        <div className="reactions-summary">
          <span className="summary-emoji">
            {REACTION_TYPES
              .filter(r => summary[r.type] > 0)
              .slice(0, 3)
              .map(r => r.emoji)
              .join(' ')}
          </span>
          <span className="summary-text">
            {totalReactions} reaction{totalReactions !== 1 ? 's' : ''}
          </span>
        </div>
      )}
      
      <div className="reaction-buttons">
        {REACTION_TYPES.map((reaction) => {
          const count = getCount(reaction.type);
          const isReacted = hasReaction(reaction.type);
          
          return (
            <button
              key={reaction.type}
              className={`reaction-btn ${isReacted ? 'reacted' : ''} ${animatingReaction === reaction.type ? 'animating' : ''}`}
              onClick={() => handleReactionClick(reaction.type)}
              disabled={loading}
              style={{
                '--reaction-color': reaction.color,
                '--reaction-bg': isReacted ? `${reaction.color}20` : 'transparent'
              }}
            >
              <span className="reaction-emoji">{reaction.emoji}</span>
              {showLabels && <span className="reaction-label">{reaction.label}</span>}
              {count > 0 && <span className="reaction-count">{count}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

/**
 * ReactionButton Component
 * Single reaction button with count
 */
export const ReactionButton = ({
  reactionType,
  count = 0,
  isReacted = false,
  onClick,
  loading = false,
  showLabel = true,
  className = ''
}) => {
  const reaction = REACTION_TYPES.find(r => r.type === reactionType);
  
  if (!reaction) return null;
  
  return (
    <button
      className={`reaction-button-single ${isReacted ? 'reacted' : ''} ${className}`}
      onClick={onClick}
      disabled={loading}
      style={{
        '--reaction-color': reaction.color
      }}
    >
      <span className="reaction-emoji">{reaction.emoji}</span>
      {showLabel && <span className="reaction-label">{reaction.label}</span>}
      {count > 0 && <span className="reaction-count">{count}</span>}
    </button>
  );
};

/**
 * ReactionStats Component
 * Display reaction statistics
 */
export const ReactionStats = ({
  summary,
  className = ''
}) => {
  if (!summary) return null;
  
  const total = Object.values(summary).reduce((sum, val) => {
    return typeof val === 'number' ? sum + val : sum;
  }, 0);
  
  if (total === 0) return null;
  
  return (
    <div className={`reaction-stats ${className}`}>
      <h4 className="stats-title">Reaction Distribution</h4>
      <div className="stats-bars">
        {REACTION_TYPES.map((reaction) => {
          const count = summary[reaction.type] || 0;
          const percentage = total > 0 ? (count / total) * 100 : 0;
          
          return (
            <div key={reaction.type} className="stat-item">
              <div className="stat-header">
                <span className="stat-emoji">{reaction.emoji}</span>
                <span className="stat-label">{reaction.label}</span>
                <span className="stat-count">{count}</span>
              </div>
              <div className="stat-bar-bg">
                <div
                  className="stat-bar-fill"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: reaction.color
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
      <div className="stats-total">
        Total: {total} reaction{total !== 1 ? 's' : ''}
      </div>
    </div>
  );
};

export default PostReactions;

