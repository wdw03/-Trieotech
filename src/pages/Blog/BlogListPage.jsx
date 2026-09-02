import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import SEO from '../../components/common/SEO';
import Breadcrumb from '../../components/common/Breadcrumb';
import { blogs } from '../../data/blogs';
import { Sparkles, Clock, ArrowRight, BookOpen, Tag } from 'lucide-react';

export const BlogListPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Artisan Heritage', 'Wellness & Tradition', 'Devotion & Rituals'];

  const filteredBlogs = selectedCategory === 'All'
    ? blogs
    : blogs.filter(b => b.category === selectedCategory);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      <SEO
        title="Artisan Craft Journal & DIY Guides | Trio Ecart"
        description="Explore the cultural heritage of Indian Zardosi embroidery, Ayurvedic benefits of copper bottles, and sacred home mandir decoration guides."
      />

      <Breadcrumb items={[{ name: 'Craft Journal', url: '/blog' }]} />

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-gradient-to-r from-maroon-950 via-maroon-900 to-[#1F0C0C] text-white border border-gold-500/30 shadow-xl">
        <div className="relative z-10 max-w-2xl space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Artisan Journal &amp; Stories
          </span>
          <h1 className="font-serif font-black text-2xl sm:text-4xl text-ivory-100">
            Chronicles of Indian Craftsmanship
          </h1>
          <p className="text-xs sm:text-sm text-stone-300 font-normal">
            Immerse yourself in authentic stories of royal needlework, ancient Vedic wellness, and festive decor guides.
          </p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-maroon-700 text-white shadow-maroon-sm'
                : 'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-300 border border-gold-500/20 hover:border-gold-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Blog Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {filteredBlogs.map((blog) => (
          <Link
            key={blog.id}
            to={`/blog/${blog.slug}`}
            className="ethnic-card rounded-3xl overflow-hidden group flex flex-col justify-between hover:border-gold-500/50 transition-all duration-300 transform hover:-translate-y-1.5"
          >
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

            <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2.5">
                <div className="flex items-center gap-3 text-[11px] text-stone-400">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-gold-500" /> {blog.readTime}
                  </span>
                  <span>•</span>
                  <span>{blog.date}</span>
                </div>

                <h2 className="font-serif font-bold text-base sm:text-lg text-stone-900 dark:text-ivory-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors leading-snug">
                  {blog.title}
                </h2>

                <p className="text-xs text-stone-600 dark:text-stone-300 line-clamp-3 leading-relaxed">
                  {blog.excerpt}
                </p>
              </div>

              <div className="pt-4 border-t border-gold-500/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={blog.authorImage} alt={blog.author} className="w-7 h-7 rounded-full object-cover border border-gold-500/30" />
                  <div>
                    <span className="text-xs font-bold text-stone-900 dark:text-ivory-100 block leading-none">{blog.author}</span>
                    <span className="text-[10px] text-stone-400">{blog.authorRole}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-maroon-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Read Article →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default BlogListPage;
