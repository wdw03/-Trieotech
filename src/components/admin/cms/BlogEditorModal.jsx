'use client';
import React, { useState, useRef, useCallback } from 'react';
import { adminApi } from '../../../services/adminApi.js';
import {
  FileText,
  User,
  Image as ImageIcon,
  Tag,
  Search,
  Save,
  X,
  Sparkles,
  Globe,
  Clock,
  Bold,
  Italic,
  Heading2,
  Heading3,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Upload,
  Trash2,
  AlertCircle,
  ImagePlus,
  Type,
  Eye,
  Check,
  CheckCircle2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

const CATEGORY_OPTIONS = [
  'Artisan Heritage',
  'Wellness & Tradition',
  'Devotion & Rituals',
  'Bridal Fashion Guides',
  'DIY Craft Tutorials',
  'Festive Decor',
  'Indian Textiles',
  'Copper Wellness',
  'Gift Guides'
];

export const BlogEditorModal = ({
  blog = null,
  isOpen,
  onSave,
  onClose
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('content');
  const [tagInput, setTagInput] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingAuthor, setUploadingAuthor] = useState(false);
  const [uploadingInline, setUploadingInline] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAdvancedUrl, setShowAdvancedUrl] = useState(false);

  // In-line Insert Image Modal State
  const [insertImageModalOpen, setInsertImageModalOpen] = useState(false);
  const [inlineFile, setInlineFile] = useState(null);
  const [inlineFilePreview, setInlineFilePreview] = useState('');
  const [inlineAltText, setInlineAltText] = useState('');
  const [inlineCaption, setInlineCaption] = useState('');

  const contentRef = useRef(null);
  const coverFileRef = useRef(null);
  const authorFileRef = useRef(null);
  const inlineDialogFileRef = useRef(null);

  const [formData, setFormData] = useState({
    title: blog?.title || '',
    slug: blog?.slug || '',
    excerpt: blog?.excerpt || '',
    content: blog?.content || '',
    category: blog?.category || 'Artisan Heritage',
    readTime: blog?.readTime || blog?.read_time || '5 min read',
    date: blog?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    author: blog?.author || 'Trio Enterprises Editorial',
    authorRole: blog?.authorRole || blog?.author_role || 'Heritage Crafts Curator',
    authorImage: blog?.authorImage || blog?.author_image || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80',
    image: blog?.image || '/products/peacock-real-feathers-pair-1.jpg',
    imageAlt: blog?.imageAlt || blog?.image_alt || '',
    tags: blog?.tags || ['Handmade', 'Indian Craft', 'Heritage'],
    status: blog?.status || 'Published',
    seoTitle: blog?.seoTitle || blog?.seo_title || blog?.title || '',
    seoDescription: blog?.seoDescription || blog?.seo_description || blog?.excerpt || ''
  });

  const handleTitleChange = (e) => {
    const val = e.target.value;
    const autoSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    setFormData((prev) => ({
      ...prev,
      title: val,
      slug: prev.slug ? prev.slug : autoSlug,
      seoTitle: prev.seoTitle ? prev.seoTitle : val
    }));
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    if (!formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tagToRemove) });
  };

  // =================== COVER IMAGE UPLOAD ===================
  const handleCoverUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const alt = formData.imageAlt || formData.title || 'Featured Blog Cover';
      const result = await adminApi.uploadBlogImage(file, alt);
      if (result?.url) {
        setFormData(prev => ({
          ...prev,
          image: result.url,
          imageAlt: prev.imageAlt || file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
        }));
      }
    } catch (err) {
      console.error('Cover upload error:', err);
      alert('Failed to upload cover image: ' + err.message);
    } finally {
      setUploadingCover(false);
      if (coverFileRef.current) coverFileRef.current.value = '';
    }
  }, [formData.imageAlt, formData.title]);

  const handleCoverDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const dt = new DataTransfer();
    dt.items.add(file);
    if (coverFileRef.current) {
      coverFileRef.current.files = dt.files;
      coverFileRef.current.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, []);

  // =================== AUTHOR AVATAR UPLOAD ===================
  const handleAuthorPhotoUpload = useCallback(async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAuthor(true);
    try {
      const result = await adminApi.uploadBlogImage(file, (formData.author || 'Author') + ' photo');
      if (result?.url) {
        setFormData(prev => ({ ...prev, authorImage: result.url }));
      }
    } catch (err) {
      console.error('Author photo upload error:', err);
      alert('Failed to upload author photo: ' + err.message);
    } finally {
      setUploadingAuthor(false);
      if (authorFileRef.current) authorFileRef.current.value = '';
    }
  }, [formData.author]);

  // =================== INLINE IMAGE MODAL UPLOAD ===================
  const handleInlineFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setInlineFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setInlineFilePreview(ev.target.result);
    };
    reader.readAsDataURL(file);

    // Auto suggest alt text from filename if empty
    if (!inlineAltText) {
      const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setInlineAltText(suggested);
    }
  };

  const handleInsertInlineImageSubmit = async (e) => {
    e.preventDefault();
    if (!inlineFile) {
      alert('Please select an image file to upload.');
      return;
    }
    if (!inlineAltText.trim()) {
      alert('Please enter an Alt Tag for the image (important for SEO).');
      return;
    }

    setUploadingInline(true);
    try {
      const result = await adminApi.uploadBlogImage(inlineFile, inlineAltText.trim());
      if (result?.url) {
        const alt = inlineAltText.trim();
        const caption = inlineCaption.trim();
        const figureHtml = `\n<figure class="my-6 block text-center">\n  <img src="${result.url}" alt="${alt}" class="w-full max-w-2xl mx-auto rounded-2xl shadow-md border border-stone-200 dark:border-stone-800" loading="lazy" />${
          caption ? `\n  <figcaption class="text-xs text-stone-500 mt-2 italic">${caption}</figcaption>` : ''
        }\n</figure>\n`;

        insertAtCursor(figureHtml);
        setInsertImageModalOpen(false);
        setInlineFile(null);
        setInlineFilePreview('');
        setInlineAltText('');
        setInlineCaption('');
      }
    } catch (err) {
      console.error('Inline image upload error:', err);
      alert('Failed to upload image to Supabase: ' + err.message);
    } finally {
      setUploadingInline(false);
    }
  };

  // =================== FORMATTING TOOLBAR ===================
  const insertAtCursor = (text) => {
    const textarea = contentRef.current;
    if (!textarea) {
      setFormData(prev => ({ ...prev, content: prev.content + text }));
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    const newContent = before + text + after;
    setFormData(prev => ({ ...prev, content: newContent }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 10);
  };

  const wrapSelection = (openTag, closeTag) => {
    const textarea = contentRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = formData.content.substring(start, end);
    const wrapped = openTag + (selected || 'text here') + closeTag;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: before + wrapped + after }));
    setTimeout(() => {
      textarea.focus();
      if (selected) {
        textarea.setSelectionRange(start, start + wrapped.length);
      } else {
        textarea.setSelectionRange(start + openTag.length, start + openTag.length + 9);
      }
    }, 10);
  };

  const insertHeading = (level) => {
    const tag = level === 2 ? 'h2' : 'h3';
    wrapSelection(`<${tag}>`, `</${tag}>`);
  };

  const insertLink = () => {
    const url = prompt('Enter the destination URL:');
    if (!url) return;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart || 0;
    const end = textarea?.selectionEnd || 0;
    const selectedText = formData.content.substring(start, end) || 'Click Here';
    const linkTag = `<a href="${url}" target="_blank" rel="noopener">${selectedText}</a>`;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: before + linkTag + after }));
  };

  const insertBacklink = () => {
    const slug = prompt('Enter blog slug for internal backlink (e.g. sacred-art-of-zardosi):');
    if (!slug) return;
    const textarea = contentRef.current;
    const start = textarea?.selectionStart || 0;
    const end = textarea?.selectionEnd || 0;
    const selectedText = formData.content.substring(start, end) || 'Read More';
    const linkTag = `<a href="/blog/${slug}">${selectedText}</a>`;
    const before = formData.content.substring(0, start);
    const after = formData.content.substring(end);
    setFormData(prev => ({ ...prev, content: before + linkTag + after }));
  };

  const formatActions = [
    { icon: Bold, label: 'Bold', action: () => wrapSelection('<strong>', '</strong>') },
    { icon: Italic, label: 'Italic', action: () => wrapSelection('<em>', '</em>') },
    { icon: Heading2, label: 'H2 Heading', action: () => insertHeading(2) },
    { icon: Heading3, label: 'H3 Heading', action: () => insertHeading(3) },
    { icon: Quote, label: 'Blockquote', action: () => wrapSelection('<blockquote>', '</blockquote>') },
    { icon: List, label: 'Bullet List', action: () => insertAtCursor('\n<ul>\n  <li>Point 1</li>\n  <li>Point 2</li>\n</ul>\n') },
    { icon: ListOrdered, label: 'Numbered List', action: () => insertAtCursor('\n<ol>\n  <li>Step 1</li>\n  <li>Step 2</li>\n</ol>\n') },
    { icon: LinkIcon, label: 'External Link', action: insertLink },
    { icon: FileText, label: 'Internal Link', action: insertBacklink },
    {
      icon: ImagePlus,
      label: 'Upload & Insert Image',
      action: () => {
        setInsertImageModalOpen(true);
        setInlineFile(null);
        setInlineFilePreview('');
        setInlineAltText('');
        setInlineCaption('');
      },
      highlight: true
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Article Title is required!');
      return;
    }

    onSave({
      ...blog,
      ...formData,
      imageAlt: formData.imageAlt || formData.title,
      image_alt: formData.imageAlt || formData.title
    });
    onClose();
  };

  return (
    <div
      className="admin-portal dark fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fadeIn"
      style={{ colorScheme: 'dark' }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto">
        
        {/* MODAL HEADER */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shadow-inner">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                {blog ? 'Edit Blog Article' : 'Write New Journal Article'}
                <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 font-normal border border-indigo-500/20">
                  WordPress-Style CMS
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Direct image uploads to database CDN, image alt tags, rich formatting & SEO rank controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* TABS NAVIGATION */}
        <div className="flex border-b border-slate-800 px-4 sm:px-6 bg-slate-950/30 overflow-x-auto scrollbar-none shrink-0">
          {[
            { id: 'content', label: 'Article & Media', icon: FileText },
            { id: 'author_media', label: 'Cover Image & Author', icon: ImageIcon, badge: formData.image ? 'Uploaded' : 'Required' },
            { id: 'tags', label: 'Category & Tags', icon: Tag },
            { id: 'seo', label: 'SEO & Google SERP', icon: Globe }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                    formData.image
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* TAB 1: ARTICLE & MEDIA */}
          {activeTab === 'content' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Article Headline / Title *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={handleTitleChange}
                  placeholder="e.g. The Sacred Art of Zardosi: From Mughal Ateliers to Modern Couture"
                  className="admin-input w-full text-sm font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">URL Slug (Auto-generated)</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-slate-500 font-mono">/blog/</span>
                    <input
                      type="text"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      className="admin-input w-full text-xs font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Publication Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="admin-input w-full text-xs font-bold"
                  >
                    <option value="Published">🟢 Published (Live on Website)</option>
                    <option value="Draft">🟡 Draft (Hidden from Customers)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Summary / Excerpt (Lead Paragraph) *</label>
                <textarea
                  rows={2}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="A compelling 1-2 sentence overview of what the reader will discover..."
                  className="admin-input w-full text-xs leading-relaxed"
                  required
                />
              </div>

              {/* RICH TEXT FORMATTING TOOLBAR */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5 text-indigo-400" />
                    Article Body & In-Line Media (HTML Supported)
                  </label>
                  <button
                    type="button"
                    onClick={() => setInsertImageModalOpen(true)}
                    className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                  >
                    <ImagePlus className="w-3.5 h-3.5" /> Upload Image with Alt Tag
                  </button>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-t-xl p-2 flex items-center gap-1 flex-wrap">
                  {formatActions.map((act, i) => {
                    const Icon = act.icon;
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={act.action}
                        className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] ${
                          act.highlight
                            ? 'bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-sm'
                            : 'text-slate-300 hover:text-white hover:bg-slate-800'
                        }`}
                        title={act.label}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{act.label}</span>
                      </button>
                    );
                  })}

                  <div className="w-px h-5 bg-slate-700 mx-1" />
                  
                  <button
                    type="button"
                    onClick={() => setPreviewMode(!previewMode)}
                    className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-bold ${
                      previewMode ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                    title="Toggle HTML Live Preview"
                  >
                    <Eye className="w-3.5 h-3.5" /> {previewMode ? 'Edit Raw' : 'Preview'}
                  </button>
                </div>

                {previewMode ? (
                  <div
                    className="bg-slate-950 border border-t-0 border-slate-800 rounded-b-xl p-4 min-h-[260px] prose prose-invert prose-sm max-w-none text-xs leading-relaxed overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: formData.content || '<p class="text-slate-500">No content written yet...</p>' }}
                  />
                ) : (
                  <textarea
                    ref={contentRef}
                    rows={12}
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="<h2>Heading 2</h2><p>Article narrative goes here...</p>"
                    className="admin-input w-full text-xs font-mono leading-relaxed border-t-0 rounded-t-none"
                  />
                )}

                <div className="flex items-center justify-between mt-1 text-[10px] text-slate-500">
                  <span>Supports &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;blockquote&gt;, &lt;figure&gt;, &lt;img alt="..."&gt;, &lt;a&gt;</span>
                  <span>{formData.content.length} characters</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: COVER IMAGE & AUTHOR */}
          {activeTab === 'author_media' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* FEATURED COVER IMAGE CARD */}
              <div className="admin-card p-5 space-y-4 border-indigo-500/30">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-400" />
                    <h4 className="font-bold text-white text-sm">Featured Cover Image & Alt Tag</h4>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
                    Saved in Supabase Storage
                  </span>
                </div>

                {/* Upload Zone or Current Image Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-start">
                  
                  {/* Image Preview Box */}
                  <div className="sm:col-span-5">
                    <div className="relative aspect-[16/10] rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-800 shadow-lg group">
                      {formData.image ? (
                        <>
                          <img
                            src={formData.image}
                            alt={formData.imageAlt || 'Cover Preview'}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-2">
                            <button
                              type="button"
                              onClick={() => coverFileRef.current?.click()}
                              className="btn-primary py-1 px-2.5 text-[11px] font-bold flex items-center gap-1 shadow-lg"
                            >
                              <Upload className="w-3 h-3" /> Change File
                            </button>
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, image: '' })}
                              className="p-1 rounded-lg bg-rose-600/80 text-white hover:bg-rose-600 transition-colors"
                              title="Remove Image"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/80 backdrop-blur-md text-emerald-400 text-[9px] font-bold border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> CDN Active
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center text-slate-500">
                          <ImageIcon className="w-8 h-8 mb-1 text-slate-600" />
                          <span className="text-xs">No cover image uploaded</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Upload Controls & Alt Tag Input */}
                  <div className="sm:col-span-7 space-y-3.5">
                    
                    {/* Upload Drag & Drop Trigger */}
                    <div>
                      <input
                        ref={coverFileRef}
                        type="file"
                        accept="image/*"
                        onChange={handleCoverUpload}
                        className="hidden"
                      />

                      <div
                        onDrop={handleCoverDrop}
                        onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={() => !uploadingCover && coverFileRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all ${
                          uploadingCover
                            ? 'border-indigo-500 bg-indigo-500/10'
                            : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/40'
                        }`}
                      >
                        {uploadingCover ? (
                          <div className="flex items-center justify-center gap-2 text-indigo-400 py-3">
                            <div className="w-5 h-5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs font-bold">Uploading to Supabase Storage CDN...</span>
                          </div>
                        ) : (
                          <div className="space-y-1 py-1">
                            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mx-auto mb-1">
                              <Upload className="w-4 h-4" />
                            </div>
                            <p className="text-xs font-bold text-white">
                              {formData.image ? 'Click or drag to replace image' : 'Click or drag & drop cover image file'}
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Uploads directly to Supabase CDN • PNG, JPG, WebP supported
                            </p>
                            <button
                              type="button"
                              className="btn-secondary py-1 px-3 text-[11px] font-bold mt-1 inline-flex items-center gap-1.5 pointer-events-none"
                            >
                              <Upload className="w-3 h-3" /> Browse Computer / Device
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* MANDATORY IMAGE ALT TAG */}
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                      <label className="font-bold text-xs text-slate-200 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        Cover Image Alt Tag (for Google SEO & Accessibility) *
                      </label>
                      <input
                        type="text"
                        value={formData.imageAlt}
                        onChange={(e) => setFormData({ ...formData, imageAlt: e.target.value })}
                        placeholder="Describe what is in the image (e.g. Handcrafted peacock zardosi applique patch on deep green velvet)"
                        className="admin-input w-full text-xs"
                        required
                      />
                      {!formData.imageAlt ? (
                        <p className="text-[10px] text-amber-400 flex items-center gap-1 mt-1 font-medium">
                          <AlertCircle className="w-3 h-3 shrink-0" />
                          Alt tag is required for Google Image search ranking and screen readers.
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-400 flex items-center gap-1 mt-1 font-medium">
                          <Check className="w-3 h-3 shrink-0" />
                          Alt tag configured and will be saved in the database blogs table.
                        </p>
                      )}
                    </div>

                    {/* Optional URL Toggle (Collapsible for advanced use) */}
                    <div>
                      <button
                        type="button"
                        onClick={() => setShowAdvancedUrl(!showAdvancedUrl)}
                        className="text-[10px] text-slate-500 hover:text-slate-400 flex items-center gap-1 underline"
                      >
                        {showAdvancedUrl ? 'Hide manual image URL' : 'Advanced: View or override image URL manually'}
                      </button>
                      {showAdvancedUrl && (
                        <div className="mt-1.5 space-y-1 animate-fadeIn">
                          <input
                            type="text"
                            value={formData.image}
                            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            placeholder="https://gkskeljvgphslkzctjfp.supabase.co/..."
                            className="admin-input w-full text-xs font-mono"
                          />
                        </div>
                      )}
                    </div>

                  </div>
                </div>
              </div>

              {/* AUTHOR INFORMATION & AVATAR UPLOAD */}
              <div className="admin-card p-5 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <User className="w-4 h-4 text-indigo-400" />
                  <h4 className="font-bold text-white text-sm">Author Profile & Credentials</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  
                  {/* Author Avatar with Upload */}
                  <div className="sm:col-span-4 flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                    <input
                      ref={authorFileRef}
                      type="file"
                      accept="image/*"
                      onChange={handleAuthorPhotoUpload}
                      className="hidden"
                    />
                    
                    <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-indigo-500/40 bg-slate-900 shrink-0">
                      <img
                        src={formData.authorImage}
                        alt={formData.author}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-1">
                      <button
                        type="button"
                        onClick={() => authorFileRef.current?.click()}
                        disabled={uploadingAuthor}
                        className="btn-secondary py-1 px-2.5 text-[10px] font-bold flex items-center gap-1"
                      >
                        <Upload className="w-3 h-3" />
                        <span>{uploadingAuthor ? 'Uploading...' : 'Upload Photo'}</span>
                      </button>
                      <span className="text-[9px] text-slate-500 block">Avatar CDN upload</span>
                    </div>
                  </div>

                  <div className="sm:col-span-4">
                    <label className="font-semibold text-slate-300 block mb-1 text-xs">Author Full Name</label>
                    <input
                      type="text"
                      value={formData.author}
                      onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                      placeholder="e.g. Meera Sen"
                      className="admin-input w-full text-xs font-semibold"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="font-semibold text-slate-300 block mb-1 text-xs">Author Designation / Role</label>
                    <input
                      type="text"
                      value={formData.authorRole}
                      onChange={(e) => setFormData({ ...formData, authorRole: e.target.value })}
                      placeholder="e.g. Heritage Textile Curator"
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1 text-xs">Publication Date</label>
                    <input
                      type="text"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="e.g. August 28, 2026"
                      className="admin-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1 text-xs">Estimated Reading Time</label>
                    <input
                      type="text"
                      value={formData.readTime}
                      onChange={(e) => setFormData({ ...formData, readTime: e.target.value })}
                      placeholder="e.g. 5 min read"
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: CATEGORY & TAGS */}
          {activeTab === 'tags' && (
            <div className="space-y-4 animate-fadeIn">
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Article Category *</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="admin-input w-full text-xs font-bold"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customCategory.trim()) {
                          e.preventDefault();
                          setFormData({ ...formData, category: customCategory.trim() });
                          setCustomCategory('');
                        }
                      }}
                      placeholder="Or type a custom category & press Enter..."
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-300 block mb-1">Article Tags (Topics & Themes)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                    placeholder="Type tag (e.g. Zardosi, Bridal Wear, DIY) and press Enter"
                    className="admin-input flex-1 text-xs"
                  />
                  <button type="button" onClick={handleAddTag} className="btn-secondary py-1.5 px-3 text-xs">
                    Add Tag
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {formData.tags.map((t, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-medium"
                    >
                      #{t}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(t)}
                        className="hover:text-white p-0.5 rounded-full hover:bg-slate-800"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: SEO & GOOGLE SERP PREVIEW */}
          {activeTab === 'seo' && (
            <div className="space-y-4 animate-fadeIn">
              {/* GOOGLE SEARCH SNIPPET PREVIEW */}
              <div className="admin-card p-4 space-y-2 border-indigo-500/30 bg-slate-950">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-indigo-400" /> Google Search SERP Preview
                </span>
                <div className="space-y-1 p-3 bg-white dark:bg-[#1a1a1a] rounded-xl border border-slate-300 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-stone-400">
                    <span>https://trioenterprises.in</span>
                    <span>›</span>
                    <span>blog</span>
                    <span>›</span>
                    <span className="font-mono">{formData.slug || 'article-slug'}</span>
                  </div>
                  <h4 className="text-sm font-medium text-[#1a0dab] dark:text-[#8ab4f8] hover:underline cursor-pointer truncate">
                    {formData.seoTitle || formData.title || 'Your Article Title Goes Here'} | Trio Enterprises
                  </h4>
                  <p className="text-xs text-[#4d5156] dark:text-[#bdc1c6] line-clamp-2 leading-relaxed">
                    {formData.seoDescription || formData.excerpt || 'Write a compelling excerpt or meta description to encourage Google searchers to click through...'}
                  </p>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-300 text-xs">SEO Meta Title (Title Tag)</label>
                  <span className={`text-[10px] ${formData.seoTitle.length > 60 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                    {formData.seoTitle.length} / 60 characters
                  </span>
                </div>
                <input
                  type="text"
                  value={formData.seoTitle}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder="Title shown in browser tab and search engines..."
                  className="admin-input w-full text-xs font-medium"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="font-semibold text-slate-300 text-xs">SEO Meta Description</label>
                  <span className={`text-[10px] ${formData.seoDescription.length > 160 ? 'text-amber-400 font-bold' : 'text-slate-500'}`}>
                    {formData.seoDescription.length} / 160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={formData.seoDescription}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Summary displayed below title in search results..."
                  className="admin-input w-full text-xs leading-relaxed"
                />
              </div>

              {/* SEO Checklist */}
              <div className="p-3.5 bg-slate-950/70 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                <span className="font-bold text-slate-300 block mb-1">Search Engine Optimization Checklist:</span>
                {[
                  { label: 'Featured Cover Image uploaded to CDN', ok: !!formData.image },
                  { label: 'Cover Image Alt Tag specified for Google Images', ok: !!formData.imageAlt },
                  { label: 'Article Title present', ok: !!formData.title },
                  { label: 'Clean URL slug defined', ok: !!formData.slug },
                  { label: 'Summary / Excerpt defined', ok: !!formData.excerpt },
                  { label: 'Tags assigned for internal linking', ok: formData.tags.length > 0 },
                  { label: 'SEO Title within 60 characters', ok: formData.seoTitle.length > 0 && formData.seoTitle.length <= 60 }
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    {item.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    )}
                    <span className={item.ok ? 'text-slate-300' : 'text-slate-500'}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MODAL FOOTER */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary py-2 px-4 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary py-2 px-5 text-xs font-bold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{blog ? 'Save & Update Article' : 'Publish Article to Database'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* ============================================================ */}
      {/* POPUP MODAL: UPLOAD & INSERT INLINE IMAGE WITH ALT TAG */}
      {/* ============================================================ */}
      {insertImageModalOpen && (
        <div
          className="admin-portal dark fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
          style={{ colorScheme: 'dark' }}
        >
          <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <ImagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Insert Image into Article</h4>
                  <p className="text-[10px] text-slate-400">Upload to Supabase CDN with custom Alt Tag</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInsertImageModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleInsertInlineImageSubmit} className="space-y-3.5 text-xs">
              <input
                ref={inlineDialogFileRef}
                type="file"
                accept="image/*"
                onChange={handleInlineFileSelect}
                className="hidden"
              />

              {/* File Selector */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Choose Image File *</label>
                {inlineFilePreview ? (
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-700 group">
                    <img src={inlineFilePreview} alt="Selected preview" className="w-full h-full object-contain" />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => inlineDialogFileRef.current?.click()}
                        className="btn-primary py-1 px-3 text-xs"
                      >
                        Choose Different File
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => inlineDialogFileRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-950/40"
                  >
                    <Upload className="w-6 h-6 text-indigo-400 mx-auto mb-1" />
                    <span className="font-bold text-white block text-xs">Click to Browse Image</span>
                    <span className="text-[10px] text-slate-400">Supports PNG, JPG, WebP</span>
                  </div>
                )}
              </div>

              {/* ALT TAG INPUT (MANDATORY) */}
              <div>
                <label className="font-bold text-slate-200 block mb-1 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-indigo-400" />
                  Image Alt Tag (for Google SEO & Accessibility) *
                </label>
                <input
                  type="text"
                  value={inlineAltText}
                  onChange={(e) => setInlineAltText(e.target.value)}
                  placeholder="Describe this image (e.g. Close up of metallic bullion threadwork)"
                  className="admin-input w-full text-xs font-medium"
                  required
                />
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Mandatory: Google index and screen readers use this text.
                </span>
              </div>

              {/* CAPTION (OPTIONAL) */}
              <div>
                <label className="font-semibold text-slate-300 block mb-1">Caption Text (Optional)</label>
                <input
                  type="text"
                  value={inlineCaption}
                  onChange={(e) => setInlineCaption(e.target.value)}
                  placeholder="e.g. Master Karigar at the wooden frame (Jaipur workshop)"
                  className="admin-input w-full text-xs"
                />
              </div>

              {/* ACTION BUTTONS */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setInsertImageModalOpen(false)}
                  className="btn-secondary py-1.5 px-3 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingInline || !inlineFile || !inlineAltText.trim()}
                  className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {uploadingInline ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading to Supabase CDN...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload & Insert into Blog</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
