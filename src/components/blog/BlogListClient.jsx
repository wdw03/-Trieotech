'use client';
import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Breadcrumb from '../../components/common/Breadcrumb';
import { blogs as fallbackBlogs } from '../../data/blogs';
import { fetchLiveBlogs } from '../../lib/api/store';
import { Sparkles, Clock, ArrowRight, BookOpen, Tag, TrendingUp, Search } from 'lucide-react';

export default function BlogListClient({ initialBlogs }) {
  const [blogList, setBlogList] = useState(initialBlogs || fallbackBlogs);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let isMounted = true;
    fetchLiveBlogs()
      .then((data) => {
        if (isMounted && Array.isArray(data) && data.length > 0) {
          setBlogList(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    return ['All', ...Array.from(new Set(blogList.map(b => b.category).filter(Boolean)))];
  }, [blogList]);

  const allTags = useMemo(() => {
    const tagSet = new Set();
    blogList.forEach(b => b.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).slice(0, 12);
  }, [blogList]);

  const filteredBlogs = useMemo(() => {
    let list = blogList;
    if (selectedCategory !== 'All') {
      list = list.filter(b => b.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(b =>
        b.title?.toLowerCase().includes(q) ||
        b.excerpt?.toLowerCase().includes(q) ||
        b.tags?.some(t => t.toLowerCase().includes(q))
      );
    }
    return list;
  }, [blogList, selectedCategory, searchQuery]);

  const featuredBlog = filteredBlogs[0];
  const restBlogs = filteredBlogs.slice(1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8 font-inter">
      
      <Breadcrumb items={[{ name: 'Craft Journal', url: '/blog' }]} />

      {/* Header Banner */}
      <div className="relative rounded-3xl overflow-hidden p-8 sm:p-12 bg-gradient-to-r from-maroon-950 via-maroon-900 to-[#1F0C0C] text-white border border-gold-500/30 shadow-xl font-inter">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(212,175,55,0.08),transparent_70%)]" />
        <div className="relative z-10 max-w-2xl space-y-3">
          <span className="text-[11px] font-bold uppercase tracking-[0.25em] text-gold-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Artisan Journal &amp; Stories
          </span>
          <h1 className="font-inter font-extrabold text-2xl sm:text-4xl text-slate-100 tracking-tight">
            Chronicles of Indian Craftsmanship
          </h1>
          <p className="font-inter font-medium text-xs sm:text-sm text-slate-300 max-w-lg leading-relaxed">
            Immerse yourself in authentic stories of royal needlework, ancient Vedic wellness, and festive decor guides curated by our heritage experts.
          </p>
          {/* Search */}
          <div className="relative max-w-sm pt-2">
            <Search className="w-4 h-4 text-gold-400/50 absolute left-3 top-1/2 -translate-y-1/2 mt-1" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search articles, topics, tags..."
              className="w-full pl-9 pr-4 py-2.5 bg-white/5 border border-gold-500/20 rounded-xl text-xs text-ivory-100 placeholder:text-stone-500 outline-none focus:border-gold-400/50 backdrop-blur-sm font-inter"
            />
          </div>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar font-inter">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-maroon-700 text-white shadow-maroon-sm'
                : 'bg-white dark:bg-stone-900 text-slate-700 dark:text-slate-300 border border-gold-500/20 hover:border-gold-500'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Featured Blog Card (First Post) */}
      {featuredBlog && (
        <Link
          href={`/blog/${featuredBlog.slug}`}
          className="block ethnic-card rounded-3xl overflow-hidden group hover:border-gold-500/50 transition-all duration-300 transform hover:-translate-y-1 font-inter"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0">
            <div className="aspect-[16/10] md:aspect-auto overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
              <img
                src={featuredBlog.image}
                alt={featuredBlog.imageAlt || featuredBlog.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
              />
              <div className="absolute top-3 left-3 flex items-center gap-2">
                <span className="bg-maroon-900/90 text-gold-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-500/30">
                  {featuredBlog.category}
                </span>
                <span className="bg-gold-500/90 text-maroon-950 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Featured
                </span>
              </div>
            </div>
            <div className="p-6 sm:p-8 flex flex-col justify-center space-y-4 font-inter">
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gold-500" /> {featuredBlog.readTime || featuredBlog.read_time}
                </span>
                <span>•</span>
                <span>{featuredBlog.date}</span>
              </div>
              <h2 className="font-inter font-bold text-lg sm:text-2xl text-slate-900 dark:text-slate-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors leading-snug">
                {featuredBlog.title}
              </h2>
              <p className="font-inter font-medium text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                {featuredBlog.excerpt}
              </p>
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <img src={featuredBlog.authorImage || featuredBlog.author_image} alt={featuredBlog.author} className="w-8 h-8 rounded-full object-cover border border-gold-500/30" />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block leading-none">{featuredBlog.author}</span>
                    <span className="text-[10px] text-slate-400">{featuredBlog.authorRole || featuredBlog.author_role}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-maroon-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Read Full Article <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* Blog Cards Grid */}
      {restBlogs.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 font-inter">
          {restBlogs.map((blog) => (
            <Link
              key={blog.id}
              href={`/blog/${blog.slug}`}
              className="ethnic-card rounded-3xl overflow-hidden group flex flex-col justify-between hover:border-gold-500/50 transition-all duration-300 transform hover:-translate-y-1.5"
            >
              <div className="aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-900 relative">
                <img
                  src={blog.image}
                  alt={blog.imageAlt || blog.title}
                  className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-700 ease-out"
                />
                <div className="absolute top-3 left-3 bg-maroon-900/90 text-gold-300 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border border-gold-500/30">
                  {blog.category}
                </div>
              </div>

              <div className="p-6 flex-1 flex flex-col justify-between space-y-4 font-inter">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gold-500" /> {blog.readTime || blog.read_time}
                    </span>
                    <span>•</span>
                    <span>{blog.date}</span>
                  </div>

                  <h2 className="font-inter font-bold text-base sm:text-lg text-slate-900 dark:text-slate-100 group-hover:text-maroon-700 dark:group-hover:text-gold-400 transition-colors leading-snug">
                    {blog.title}
                  </h2>

                  <p className="font-inter font-medium text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
                    {blog.excerpt}
                  </p>
                </div>

                <div className="pt-4 border-t border-gold-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <img src={blog.authorImage || blog.author_image} alt={blog.author} className="w-7 h-7 rounded-full object-cover border border-gold-500/30" />
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100">{blog.author}</span>
                  </div>
                  <span className="text-xs font-bold text-maroon-700 dark:text-gold-400 group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Read <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Tag Cloud */}
      {allTags.length > 0 && (
        <div className="pt-4 border-t border-gold-500/10">
          <h3 className="font-serif font-bold text-sm text-stone-800 dark:text-gold-300 flex items-center gap-1.5 mb-3">
            <Tag className="w-4 h-4 text-gold-500" /> Popular Topics
          </h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full bg-gold-500/5 text-gold-800 dark:text-gold-300 border border-gold-500/15 text-xs font-semibold hover:bg-gold-500/10 transition-colors cursor-default"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredBlogs.length === 0 && (
        <div className="text-center py-16 space-y-3">
          <BookOpen className="w-12 h-12 text-gold-400/30 mx-auto" />
          <h3 className="font-serif font-bold text-lg text-stone-700 dark:text-stone-300">No articles found</h3>
          <p className="text-xs text-stone-500">Try adjusting your search or category filter.</p>
          <button
            onClick={() => { setSelectedCategory('All'); setSearchQuery(''); }}
            className="btn-outline-maroon py-2 px-5 text-xs font-bold mt-2"
          >
            View All Articles
          </button>
        </div>
      )}
    </div>
  );
}
