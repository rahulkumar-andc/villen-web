import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './RelatedPosts.css';

const RelatedPosts = ({ currentPost, allPosts }) => {
  // Filter posts in same category, exclude current
  const relatedPosts = allPosts
    .filter(post => 
      post.id !== currentPost.id && 
      (post.category === currentPost.category || post.author === currentPost.author)
    )
    .slice(0, 3);

  if (relatedPosts.length === 0) {
    return null;
  }

  return (
    <section className="related-posts-section">
      <h3 className="section-title">
        <span className="glitch" data-text="Related Intel">Related Intel</span>
      </h3>
      <div className="related-posts-grid">
        {relatedPosts.map((post, index) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={`/blog/post/${post.slug}`} className="related-post-card">
              <div className="related-post-image">
                {post.featured_image ? (
                  <img src={post.featured_image} alt={post.title} />
                ) : (
                  <div className="placeholder-image">
                    <span className="category-badge">{post.category}</span>
                  </div>
                )}
              </div>
              <div className="related-post-content">
                <span className="related-category">{post.category}</span>
                <h4>{post.title}</h4>
                <p className="related-excerpt">{post.excerpt}</p>
                <span className="read-more">
                  Access File <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

export default RelatedPosts;

