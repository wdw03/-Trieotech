import React from 'react';
import { Link } from 'react-router-dom';
import { blogs } from '../../data/blogs';
import { Sparkles, ArrowRight, Clock, User } from 'lucide-react';

export const BlogPreview = () => {
  return (
    <section className="py-12 sm:py-16 bg-ivory-200/50 dark:bg-[#160E08]/50 border-t border-gold-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gold-500/20 pb-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-700 dark:text-gold-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" /> Artisan Dispatch
            </span>
            <h2 className="font-serif font-black text-2xl sm:text-3xl text-stone-900 dark:text-ivory-100">
              Craft Journal &amp; DIY Guides
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-400">
              Deep dives into ancient textile histories, Ayurvedic rituals, and festive styling ideas.
            </p>
          </div>

          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-maroon-700 dark:text-gold-400 hover:text-maroon-800 dark:hover:text-gold-300 uppercase tracking-wider group"
          >
            <span>Read All Articles</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {blogs.slice(0, 3).map((blog) => (
            <Link
              key={blog.id}
              to={`/blog/${blog.slug}`}
              className="ethnic-card rounded-3xl overflow-hidden group flex flex-col justify-between hover:border-gold-500/50 transition-all duration-300 transform hover:-translate-y-1.5"
            >
              {/* Blog Image */}
              <div className="aspect-[16/10] w-full overflow-hidden bg-stone-100 dark:bg-stone-900 relative">
                <img
                  src={blog.image}
                  alt={blog.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-maroon-900/90 text-gold-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-500/30">
                  {blog.category}
                </div>
              </div>

              {/* Blog Content */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-[11px] text-stone-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold-500" /> {blog.readTime}
                    </span>
                    <span>•</span>
                    <span>{blog.date}</span>
                  </div>

                  <h3 className="font-serif font-bold text-sm sm:text-base text-stone-900 dark:text-ivory-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors leading-snug line-clamp-2">
                    {blog.title}
                  </h3>

                  <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-2 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                {/* Author Info */}
                <div className="pt-3 border-t border-gold-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={blog.authorImage} alt={blog.author} className="w-6 h-6 rounded-full object-cover border border-gold-500/30" />
                    <span className="text-[11px] font-bold text-stone-700 dark:text-stone-300">{blog.author}</span>
                  </div>
                  <span className="text-xs font-bold text-maroon-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5">
                    Read →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default BlogPreview;
