'use client';
import React, { useState, useMemo, useRef } from 'react';
import { useAdmin } from '../../../context/AdminContext.jsx';
import { adminApi } from '../../../services/adminApi.js';
import { ProductImage } from '../ui/ProductImage.jsx';
import { ProductGalleryPreview } from '../ui/ProductGalleryPreview.jsx';
import { ImageLightbox } from '../ui/ImageLightbox.jsx';
import { usePageLoading } from '../../../hooks/usePageLoading.js';
import { ProductsTableSkeleton, Skeleton } from '../ui/Skeleton.jsx';
import {
  Plus,
  Search,
  Filter,
  Sparkles,
  Edit2,
  Trash2,
  Copy,
  Eye, EyeOff,
  CheckCircle2,
  XCircle,
  Tag,
  Layers,
  ArrowUpDown,
  X,
  Save,
  Image as ImageIcon,
  Camera,
  ZoomIn,
  Star,
  Truck,
  Upload,
  Loader2
} from 'lucide-react';

const FILTER_BADGES = [
  'All',
  'Best Seller',
  'Festival Special',
  'Wedding Special',
  'Trending',
  'Handmade',
  'Sale',
  'In Stock',
  'Out of Stock'
];

export const Products = () => {
  const {
    products,
    categories,
    addProduct,
    updateProduct,
    deleteProduct,
    duplicateProduct,
    showToast
  } = useAdmin();
  const isPageLoading = usePageLoading(450);

  const [activeBadgeFilter, setActiveBadgeFilter] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingProduct, setEditingProduct] = useState(null); // modal state for Add/Edit
  const [activeEditorTab, setActiveEditorTab] = useState('basic'); // 'basic'|'media'|'pricing'|'variants'|'details'|'flags'
  const [newImageUrl, setNewImageUrl] = useState('');
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const fileInputRef = useRef(null);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;

      // Badge/Flag Filter
      if (activeBadgeFilter === 'Best Seller' && !p.isBestSeller && p.badge !== 'Best Seller') return false;
      if (activeBadgeFilter === 'Festival Special' && !p.isFestivalSpecial && p.badge !== 'Festival Special') return false;
      if (activeBadgeFilter === 'Wedding Special' && !p.isWeddingSpecial && p.badge !== 'Wedding Special') return false;
      if (activeBadgeFilter === 'Trending' && !p.isTrending && p.badge !== 'Trending') return false;
      if (activeBadgeFilter === 'Handmade' && !p.isHandmade && p.badge !== 'Handmade') return false;
      if (activeBadgeFilter === 'Sale' && p.badge !== 'Sale') return false;
      if (activeBadgeFilter === 'In Stock' && !p.inStock) return false;
      if (activeBadgeFilter === 'Out of Stock' && p.inStock) return false;

      // Search (Name, Category, Subcategory, Material, Color)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCat = p.category.toLowerCase().includes(q);
        const matchesSubcat = p.subcategory?.toLowerCase().includes(q);
        const matchesMaterial = p.material?.toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesSubcat && !matchesMaterial) return false;
      }

      return true;
    });
  }, [products, activeBadgeFilter, selectedCategory, searchTerm]);

  // Open editor for brand new product
  const handleOpenNewProduct = () => {
    setEditingProduct({
      name: '',
      slug: '',
      category: 'Patches',
      subcategory: 'Lotus Flower Patches',
      brand: 'Trio Ecart',
      price: 299,
      originalPrice: 699,
      discount: 57,
      weight: '',
      length: '',
      breadth: '',
      height: '',
      dimensions: { length: '', breadth: '', height: '' },
      material: 'Fabric, Zari, Glass Beads',
      color: 'Gold and Pink',
      occasion: 'Sarees, Lehengas, Dupattas & Festive DIY',
      packageQuantity: 'Set of 2 Pieces',
      countryOfOrigin: 'India',
      badge: 'New',
      shortDescription: '',
      fullDescription: '',
      description: '',
      stock: 50,
      inStock: true,
      is_visible: true,
      isVisible: true,
      sold_quantity: 0,
      low_stock_threshold: 15,
      isNew: true,
      isFeatured: false,
      isBestSeller: false,
      isTrending: false,
      isWeddingSpecial: true,
      isFestivalSpecial: false,
      isHandmade: true,
      images: ['/products/pearl-zardosi-patch-1.jpg'],
      colors: [{ name: 'Default Multi', hex: '#D4AF37', price: 299, originalPrice: 699, stock: 50, image: '/products/pearl-zardosi-patch-1.jpg' }],
      sizes: ['Standard Pack'],
      features: ['Handcrafted with traditional zari work', 'Easy sew-on application', 'Lustrous festive finish'],
      specifications: { 'Brand': 'Trio Ecart', 'Origin': 'India', 'Care': 'Dry Clean / Spot Clean' }
    });
    setActiveEditorTab('basic');
  };

  // Save product from editor
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!editingProduct.name.trim()) {
      setActiveEditorTab('basic');
      showToast('Product name is required!', 'error');
      return;
    }

    const weightVal = parseFloat(editingProduct.weight);
    const lengthVal = parseFloat(editingProduct.length !== undefined && editingProduct.length !== null && editingProduct.length !== '' ? editingProduct.length : (editingProduct.dimensions?.length));
    const breadthVal = parseFloat(editingProduct.breadth !== undefined && editingProduct.breadth !== null && editingProduct.breadth !== '' ? editingProduct.breadth : (editingProduct.dimensions?.breadth));
    const heightVal = parseFloat(editingProduct.height !== undefined && editingProduct.height !== null && editingProduct.height !== '' ? editingProduct.height : (editingProduct.dimensions?.height));

    if (editingProduct.weight === undefined || editingProduct.weight === null || editingProduct.weight === '' || isNaN(weightVal) || weightVal <= 0) {
      setActiveEditorTab('pricing');
      showToast('Product Weight (kg) is mandatory! Please enter weight greater than 0 kg (e.g. 0.25 kg).', 'error');
      return;
    }

    if (isNaN(lengthVal) || lengthVal <= 0) {
      setActiveEditorTab('pricing');
      showToast('Package Length (cm) is mandatory! Please enter box length greater than 0 cm.', 'error');
      return;
    }

    if (isNaN(breadthVal) || breadthVal <= 0) {
      setActiveEditorTab('pricing');
      showToast('Package Breadth (cm) is mandatory! Please enter box breadth greater than 0 cm.', 'error');
      return;
    }

    if (isNaN(heightVal) || heightVal <= 0) {
      setActiveEditorTab('pricing');
      showToast('Package Height (cm) is mandatory! Please enter box height greater than 0 cm.', 'error');
      return;
    }

    const rawStock = Number(editingProduct.stock !== undefined ? editingProduct.stock : 50);
    const rawInStock = editingProduct.inStock !== undefined 
      ? Boolean(editingProduct.inStock) 
      : (editingProduct.in_stock !== undefined ? Boolean(editingProduct.in_stock) : rawStock > 0);
    const isEffectiveInStock = rawInStock && rawStock > 0;
    const stockVal = isEffectiveInStock ? rawStock : 0;
    const inStockVal = isEffectiveInStock;
    const isVisibleVal = editingProduct.is_visible !== undefined 
      ? Boolean(editingProduct.is_visible) 
      : (editingProduct.isVisible !== undefined ? Boolean(editingProduct.isVisible) : true);

    const basePrice = Number(editingProduct.price) || 0;
    const baseOriginalPrice = Number(editingProduct.originalPrice ?? editingProduct.original_price) || basePrice;

    const cleanImgs = Array.isArray(editingProduct.images)
      ? editingProduct.images.filter(img => typeof img === 'string' && img.trim())
      : [];
    const finalImages = cleanImgs.length > 1 && cleanImgs.includes('/products/pearl-zardosi-patch-1.jpg')
      ? cleanImgs.filter(img => img !== '/products/pearl-zardosi-patch-1.jpg')
      : (cleanImgs.length > 0 ? cleanImgs : ['/products/pearl-zardosi-patch-1.jpg']);
    const primaryImg = finalImages[0] || '/products/pearl-zardosi-patch-1.jpg';

    const colorsVal = Array.isArray(editingProduct.colors)
      ? editingProduct.colors.map(c => {
          const isSingle = editingProduct.colors.length <= 1;
          const vPrice = (isSingle || c.price === undefined || c.price === null || c.price === '')
            ? basePrice
            : Number(c.price);
          const vOrigPrice = (isSingle || c.originalPrice === undefined || c.originalPrice === null || c.originalPrice === '')
            ? baseOriginalPrice
            : Number(c.originalPrice);

          const cImg = (c.image && c.image !== '/products/pearl-zardosi-patch-1.jpg')
            ? c.image
            : primaryImg;

          return {
            ...c,
            price: vPrice,
            originalPrice: vOrigPrice,
            image: cImg,
            stock: isEffectiveInStock
              ? (c.stock !== undefined && Number(c.stock) > 0 ? Number(c.stock) : Math.max(1, Math.floor(stockVal / (editingProduct.colors.length || 1))))
              : 0,
          };
        })
      : [];

    const payload = {
      ...editingProduct,
      images: finalImages,
      image: primaryImg,
      colors: colorsVal,
      price: basePrice,
      originalPrice: baseOriginalPrice,
      original_price: baseOriginalPrice,
      stock: stockVal,
      inStock: inStockVal,
      in_stock: inStockVal,
      is_visible: isVisibleVal,
      isVisible: isVisibleVal,
      sold_quantity: Number(editingProduct.sold_quantity ?? editingProduct.soldQuantity ?? 0),
      low_stock_threshold: Number(editingProduct.low_stock_threshold ?? editingProduct.lowStockThreshold ?? 15),
      weight: weightVal,
      length: lengthVal,
      breadth: breadthVal,
      height: heightVal,
      dimensions: {
        length: lengthVal,
        breadth: breadthVal,
        height: heightVal,
      }
    };

    if (editingProduct.id) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setEditingProduct(null);
  };

  // Set primary photo in editor
  const handleSetPrimaryImage = (index) => {
    if (!editingProduct.images || index === 0) return;
    const reordered = [...editingProduct.images];
    const [selected] = reordered.splice(index, 1);
    reordered.unshift(selected);
    const primary = reordered[0];
    setEditingProduct({
      ...editingProduct,
      images: reordered,
      colors: Array.isArray(editingProduct.colors)
        ? editingProduct.colors.map((c, idx) => (idx === 0 || !c.image || c.image === '/products/pearl-zardosi-patch-1.jpg' ? { ...c, image: primary } : c))
        : editingProduct.colors
    });
    showToast('Primary cover image updated');
  };

  // Remove photo from editor
  const handleRemoveImage = (index) => {
    if (editingProduct.images.length <= 1) {
      showToast('Product must have at least 1 image', 'error');
      return;
    }
    const filtered = editingProduct.images.filter((_, i) => i !== index);
    const primary = filtered[0];
    setEditingProduct({
      ...editingProduct,
      images: filtered,
      colors: Array.isArray(editingProduct.colors)
        ? editingProduct.colors.map((c, idx) => (idx === 0 || !c.image || c.image === '/products/pearl-zardosi-patch-1.jpg' ? { ...c, image: primary } : c))
        : editingProduct.colors
    });
  };

  // Direct file upload handler (single or multi-file from device to Supabase CDN)
  const handleImageUpload = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploadingImage(true);
    showToast(`Uploading ${files.length} photo(s) to Supabase Storage...`, 'info');

    const newUrls = [];
    let uploadErrors = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const res = await adminApi.uploadProductImage(file);
        if (res && res.url) {
          newUrls.push(res.url);
        } else {
          uploadErrors++;
        }
      } catch (err) {
        console.error('Image upload failed:', err);
        uploadErrors++;
      }
    }

    if (newUrls.length > 0) {
      setEditingProduct(prev => {
        const existingImages = (prev?.images || []).filter(img => img !== '/products/pearl-zardosi-patch-1.jpg');
        const updatedImages = [...existingImages, ...newUrls];
        const primary = updatedImages[0];
        return {
          ...prev,
          images: updatedImages,
          colors: Array.isArray(prev?.colors)
            ? prev.colors.map((c, idx) => (idx === 0 || !c.image || c.image === '/products/pearl-zardosi-patch-1.jpg' ? { ...c, image: primary } : c))
            : prev?.colors
        };
      });
      showToast(`${newUrls.length} photo(s) successfully uploaded and added!`, 'success');
    }

    if (uploadErrors > 0) {
      showToast(`${uploadErrors} photo(s) failed to upload. Check network or storage.`, 'error');
    }

    setIsUploadingImage(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add new image URL in editor or open file picker if empty
  const handleAddImage = () => {
    if (!newImageUrl.trim()) {
      fileInputRef.current?.click();
      return;
    }
    const cleanExisting = (editingProduct.images || []).filter(img => img !== '/products/pearl-zardosi-patch-1.jpg');
    const updatedImages = [...cleanExisting, newImageUrl.trim()];
    const primary = updatedImages[0];
    setEditingProduct({
      ...editingProduct,
      images: updatedImages,
      colors: Array.isArray(editingProduct.colors)
        ? editingProduct.colors.map((c, idx) => (idx === 0 || !c.image || c.image === '/products/pearl-zardosi-patch-1.jpg' ? { ...c, image: primary } : c))
        : editingProduct.colors
    });
    setNewImageUrl('');
    showToast('Photo added to product gallery');
  };

  return (
    <div className="space-y-3 sm:space-y-4 w-full max-w-full min-w-0 flex flex-col lg:h-[calc(100vh-7.5rem)] lg:max-h-[calc(100vh-7.5rem)]">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black tracking-tight text-white">Product Catalog & Gallery</h1>
            <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              {products.length} Products • 164 Authentic High-Res Photos Loaded
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Browse genuine Trio Ecart photos: multi-angle views, color variants, zoom inspection & catalog fields.
          </p>
        </div>

        <button onClick={handleOpenNewProduct} className="btn-primary py-2 px-4 text-xs font-bold shrink-0">
          <Plus className="w-4 h-4" /> Add New Craft Product
        </button>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800 text-xs no-scrollbar shrink-0">
        {FILTER_BADGES.map((tab) => {
          const isActive = activeBadgeFilter === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveBadgeFilter(tab)}
              className={`
                px-3 py-2 rounded-xl font-medium whitespace-nowrap transition-all duration-150
                ${isActive
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }
              `}
            >
              {tab}
            </button>
          );
        })}
      </div>

      {/* SEARCH AND CATEGORY FILTER */}
      <div className="admin-card p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shrink-0">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search product name, material, color..."
            className="admin-input pl-9 py-1.5 text-xs w-full"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="admin-select py-1.5 text-xs"
          >
            <option value="All">All Categories (9)</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* PRODUCTS TABLE WITH INTEGRATED MULTI-IMAGE PREVIEW */}
      <div className="admin-card overflow-hidden w-full max-w-full min-w-0 border border-slate-800/80 rounded-2xl shadow-xl flex flex-col flex-1 min-h-0">
        <div className="overflow-x-auto overflow-y-auto flex-1 min-h-[320px] max-h-[62vh] lg:max-h-none w-full max-w-full min-w-0 touch-pan-x overscroll-contain relative border-b border-slate-800/60">
          <table className="w-full text-left border-separate border-spacing-0">
            <thead className="sticky top-0 z-20 shadow-md">
              <tr className="bg-[#0F172A] text-slate-300">
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] w-44 border-b border-slate-800 shadow-sm">Product Photos & Angles</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Product Name & Category</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Material & Occasion</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Price</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Stock & Units</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] border-b border-slate-800 shadow-sm">Badge / Flags</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-center border-b border-slate-800 shadow-sm">Storefront Visibility</th>
                <th className="table-th sticky top-0 z-20 bg-[#0F172A] text-right border-b border-slate-800 shadow-sm">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isPageLoading ? (
                <ProductsTableSkeleton rows={7} />
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-12 text-slate-500 text-sm">
                    No products found matching your filter criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                return (
                  <tr key={p.id} className="table-tr">
                    {/* Interactive Photo Gallery Strip */}
                    <td className="table-td">
                      <ProductGalleryPreview product={p} compact={true} />
                    </td>

                    {/* Name, Slug, Category */}
                    <td className="table-td max-w-xs">
                      <p className="font-bold text-slate-100 text-xs truncate leading-snug">{p.name}</p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1">
                        <span className="text-indigo-400 font-semibold">{p.category}</span>
                        <span>•</span>
                        <span className="truncate">{p.subcategory || 'Craft Decor'}</span>
                      </div>
                    </td>

                    {/* Material & Occasion */}
                    <td className="table-td max-w-[200px]">
                      <p className="text-xs text-slate-300 truncate">{p.material || 'Handcrafted Fabric & Zari'}</p>
                      <p className="text-[10px] text-slate-500 truncate">{p.occasion || 'Festival, Wedding & Craft'}</p>
                      <div className="flex items-center gap-1 mt-1 text-[10px] font-mono text-indigo-300 bg-indigo-950/40 px-1.5 py-0.5 rounded border border-indigo-500/20 w-fit" title="Shipping Weight & Dimensions">
                        <Truck className="w-2.5 h-2.5 text-indigo-400 shrink-0" />
                        <span>{p.weight !== undefined ? p.weight : 0.5}kg • {p.length || 15}×{p.breadth || 10}×{p.height || 5}cm</span>
                      </div>
                    </td>

                    {/* Price & Discount */}
                    <td className="table-td text-right">
                      <span className="text-sm font-black text-white block">₹{p.price}</span>
                      {p.originalPrice && (
                        <span className="text-[10px] text-slate-500 line-through">₹{p.originalPrice}</span>
                      )}
                      {p.discount && (
                        <span className="text-[10px] text-emerald-400 block font-bold">{p.discount}% OFF</span>
                      )}
                    </td>

                    {/* Stock Units & Quick In/Out of Stock Toggle */}
                    <td className="table-td text-center">
                      {(() => {
                        const isCurrentlyIn = Boolean(p.inStock ?? p.in_stock ?? true) && Number(p.stock ?? 0) > 0;
                        const displayUnits = isCurrentlyIn ? Number(p.stock || 0) : 0;
                        return (
                          <div className="flex flex-col items-center gap-1">
                            <span className={`font-black text-xs ${!isCurrentlyIn ? 'text-rose-400' : (displayUnits <= (p.low_stock_threshold || 15) ? 'text-amber-400' : 'text-slate-200')}`}>
                              {displayUnits} units
                            </span>

                            {/* In Stock / Out of Stock Toggle Button */}
                            <button
                              type="button"
                              onClick={() => {
                                const nextInStock = !isCurrentlyIn;
                                const nextStock = nextInStock ? (Number(p.stock) > 0 ? Number(p.stock) : 25) : 0;
                                updateProduct(p.id, { 
                                  inStock: nextInStock, 
                                  in_stock: nextInStock,
                                  stock: nextStock
                                });
                              }}
                              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold transition-all cursor-pointer shadow-xs inline-flex items-center gap-1 ${
                                isCurrentlyIn
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                                  : 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25'
                              }`}
                              title={isCurrentlyIn ? "Click to toggle Out of Stock (0 units)" : "Click to toggle In Stock (Restores stock)"}
                            >
                              {isCurrentlyIn ? (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                  <span>In Stock</span>
                                </>
                              ) : (
                                <>
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                                  <span>Out of Stock</span>
                                </>
                              )}
                            </button>

                            {/* Quick Restock Chips */}
                            <div className="flex items-center gap-1 mt-0.5" title="Quick add stock units">
                              {[10, 25, 50].map((addQty) => (
                                <button
                                  key={addQty}
                                  type="button"
                                  onClick={() => {
                                    const currentStock = isCurrentlyIn ? Number(p.stock || 0) : 0;
                                    const newStock = currentStock + addQty;
                                    updateProduct(p.id, {
                                      stock: newStock,
                                      inStock: true,
                                      in_stock: true,
                                    });
                                  }}
                                  className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-800/80 hover:bg-indigo-900/60 text-slate-300 hover:text-indigo-200 border border-slate-700/60 rounded transition-colors cursor-pointer"
                                  title={`Add +${addQty} units to stock`}
                                >
                                  +{addQty}
                                </button>
                              ))}
                            </div>

                            <span className="text-[10px] text-slate-500">
                              {p.sold_quantity || 0} sold
                            </span>
                          </div>
                        );
                      })()}
                    </td>

                    {/* Badge & Special Flags */}
                    <td className="table-td">
                      <div className="flex flex-wrap items-center gap-1">
                        {p.badge && (
                          <span className={`
                            badge text-[10px]
                            ${p.badge === 'Best Seller' ? 'badge-amber font-bold' : ''}
                            ${p.badge === 'Festival Special' ? 'badge-indigo font-bold' : ''}
                            ${p.badge === 'Trending' ? 'badge-purple font-bold' : ''}
                            ${p.badge === 'Handmade' ? 'badge-emerald font-bold' : ''}
                            ${p.badge === 'Sale' ? 'badge-rose font-bold' : ''}
                            ${p.badge === 'New' ? 'badge-cyan font-bold' : ''}
                          `}>
                            {p.badge}
                          </span>
                        )}
                        {p.isWeddingSpecial && (
                          <span className="badge-purple text-[9px] px-1.5 py-0.2">Wedding</span>
                        )}
                        {p.isHandmade && (
                          <span className="badge-emerald text-[9px] px-1.5 py-0.2">Handmade</span>
                        )}
                      </div>
                    </td>

                    {/* Storefront Visibility (Hide / Unhide) Toggle */}
                    <td className="table-td text-center">
                      <button
                        type="button"
                        onClick={() => updateProduct(p.id, { is_visible: p.is_visible === false ? true : false, isVisible: p.is_visible === false ? true : false })}
                        className={`text-xs px-3 py-1 rounded-full font-bold transition-all inline-flex items-center gap-1.5 cursor-pointer ${
                          p.is_visible !== false
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20'
                        }`}
                        title={p.is_visible !== false ? "Visible on Storefront - Click to Hide" : "Hidden from Storefront - Click to Unhide"}
                      >
                        {p.is_visible !== false ? (
                          <>
                            <Eye className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Visible</span>
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                            <span>Hidden</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Row Actions */}
                    <td className="table-td text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setEditingProduct({ ...p });
                            setActiveEditorTab('basic');
                          }}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit Product Details"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => duplicateProduct(p.id)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                          title="Duplicate Product"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Delete "${p.name}"?`)) {
                              deleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }))}
            </tbody>
          </table>
        </div>

        <div className="p-3.5 border-t border-slate-800/80 text-xs text-slate-400 flex justify-between items-center shrink-0 bg-slate-900/90">
          <span>{isPageLoading ? <Skeleton className="h-3.5 w-36 inline-block align-middle" /> : `Showing ${filteredProducts.length} of ${products.length} products`}</span>
          <span className="text-[11px] text-slate-500">All 164 Product Photos Loaded Locally</span>
        </div>
      </div>

      {/* COMPREHENSIVE PRODUCT EDITOR MODAL WITH INTERACTIVE MEDIA GALLERY */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto no-print">
          <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
              <div>
                <h3 className="font-bold text-lg text-white">
                  {editingProduct.id ? `Edit: ${editingProduct.name.substring(0, 38)}...` : 'Add New Craft Product'}
                </h3>
                <p className="text-xs text-slate-400">Preserves full schema & metadata from Trio Ecart products.js</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setEditingProduct(null)} className="btn-secondary py-1.5 px-3 text-xs">
                  Cancel
                </button>
                <button onClick={handleSaveProduct} className="btn-primary py-1.5 px-4 text-xs font-bold">
                  <Save className="w-3.5 h-3.5" /> Save Product
                </button>
              </div>
            </div>

            {/* Modal Tabs Bar */}
            <div className="flex items-center gap-2 px-6 py-2 bg-slate-950/40 border-b border-slate-800 text-xs overflow-x-auto no-scrollbar">
              {[
                { id: 'basic', label: '1. Basic Info' },
                { id: 'media', label: `2. Photos & Gallery (${editingProduct.images?.length || 0})` },
                { id: 'pricing', label: '3. Pricing, Stock & Shipping' },
                { id: 'variants', label: '4. Colors & Sizes' },
                { id: 'details', label: '5. Description & Specs' },
                { id: 'flags', label: '6. Badges & Special Flags' }
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setActiveEditorTab(t.id)}
                  className={`
                    px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-colors
                    ${activeEditorTab === t.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Modal Body Forms */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* TAB 1: BASIC INFO */}
              {activeEditorTab === 'basic' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Product Title / Name *</label>
                    <input
                      type="text"
                      value={editingProduct.name}
                      onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                      placeholder="e.g. Pearl zardosi Moti Beaded Round Applique Patches, Set of 20"
                      className="admin-input w-full text-xs"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Category *</label>
                      <select
                        value={editingProduct.category}
                        onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value })}
                        className="admin-select w-full text-xs"
                      >
                        {categories.map((c) => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Subcategory</label>
                      <input
                        type="text"
                        value={editingProduct.subcategory || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, subcategory: e.target.value })}
                        placeholder="e.g. Lotus Flower Patches"
                        className="admin-input w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Brand</label>
                      <input
                        type="text"
                        value={editingProduct.brand || 'Trio Ecart'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, brand: e.target.value })}
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Material Composition</label>
                      <input
                        type="text"
                        value={editingProduct.material || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, material: e.target.value })}
                        placeholder="e.g. Fabric, Faux Pearl Beads, Metallic Gold Thread, Zari"
                        className="admin-input w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Recommended Occasion</label>
                      <input
                        type="text"
                        value={editingProduct.occasion || ''}
                        onChange={(e) => setEditingProduct({ ...editingProduct, occasion: e.target.value })}
                        placeholder="e.g. Sarees, Lehengas, Dupattas, Bags & DIY Crafts"
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: INTERACTIVE MEDIA GALLERY */}
              {activeEditorTab === 'media' && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-slate-100 text-sm">Product High-Resolution Photo Gallery</h4>
                      <p className="text-[11px] text-slate-400">
                        First image is used as the primary catalog cover thumbnail. Click "Make Cover" to reorder.
                      </p>
                    </div>
                  </div>

                  {/* Visual Image Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {editingProduct.images?.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        className={`
                          relative group rounded-2xl overflow-hidden border-2 bg-slate-950 p-2 flex flex-col items-center justify-between shadow-lg transition-all
                          ${idx === 0 ? 'border-indigo-500 shadow-indigo-500/10' : 'border-slate-800 hover:border-slate-600'}
                        `}
                      >
                        {/* Primary Badge */}
                        {idx === 0 && (
                          <span className="absolute top-3 left-3 bg-indigo-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow z-10">
                            Cover Image
                          </span>
                        )}

                        {/* Image Preview */}
                        <div className="w-full aspect-square rounded-xl overflow-hidden mb-2 bg-slate-900 flex items-center justify-center">
                          <img
                            src={imgUrl}
                            alt={`Photo ${idx + 1}`}
                            className="w-full h-full object-contain hover:scale-105 transition-transform duration-200"
                          />
                        </div>

                        {/* Action buttons */}
                        <div className="w-full flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
                          <span className="text-slate-400 truncate max-w-[90px] font-mono text-[9px]">
                            {imgUrl.replace('/products/', '')}
                          </span>
                          <div className="flex items-center gap-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="text-indigo-400 hover:text-white text-[10px] font-bold px-1.5 py-0.5 rounded hover:bg-indigo-600/30"
                                title="Set as Main Cover"
                              >
                                Set Cover
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="text-rose-400 hover:text-white p-1 rounded hover:bg-rose-500/20"
                              title="Delete Photo"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Hidden File Input for Device Uploads */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />

                  {/* Drag & Drop / Device Upload Area */}
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-900/40 hover:bg-indigo-950/20 group"
                  >
                    {isUploadingImage ? (
                      <div className="flex flex-col items-center gap-2 py-2">
                        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                        <p className="text-xs font-bold text-slate-200">Uploading photo(s) to Supabase Storage...</p>
                        <p className="text-[10px] text-slate-400">Please wait while media is processed</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 py-1">
                        <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-bold text-slate-200">
                          Click to browse device or drag photos here
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Directly uploads JPG, PNG, WEBP to Supabase Storage CDN
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Add Image Input */}
                  <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
                    <label className="font-semibold text-slate-300 block text-xs">Add by Photo URL / Path or Device:</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddImage();
                          }
                        }}
                        placeholder="e.g. /products/new-angle.jpg or click Add Image to browse files"
                        className="admin-input flex-1 text-xs font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        disabled={isUploadingImage}
                        className="btn-secondary py-1.5 px-4 text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer"
                      >
                        {isUploadingImage ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        <span>{newImageUrl.trim() ? 'Add URL' : 'Add Image'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: PRICING & STOCK */}
              {activeEditorTab === 'pricing' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={editingProduct.price}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct(prev => {
                            const syncColors = Array.isArray(prev.colors)
                              ? prev.colors.map(c => (prev.colors.length <= 1 ? { ...c, price: val } : c))
                              : prev.colors;
                            return { ...prev, price: val, colors: syncColors };
                          });
                        }}
                        className="admin-input w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Original MRP (₹)</label>
                      <input
                        type="number"
                        value={editingProduct.originalPrice || 0}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setEditingProduct(prev => {
                            const syncColors = Array.isArray(prev.colors)
                              ? prev.colors.map(c => (prev.colors.length <= 1 ? { ...c, originalPrice: val } : c))
                              : prev.colors;
                            return { ...prev, originalPrice: val, colors: syncColors };
                          });
                        }}
                        className="admin-input w-full text-xs"
                      />
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Discount %</label>
                      <input
                        type="number"
                        value={editingProduct.discount || 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, discount: Number(e.target.value) })}
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Total Production Stock Quantity (Units) *</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="0"
                          value={editingProduct.stock !== undefined ? editingProduct.stock : 50}
                          onChange={(e) => {
                            const val = Math.max(0, Number(e.target.value));
                            setEditingProduct({ 
                              ...editingProduct, 
                              stock: val,
                              inStock: val > 0,
                              in_stock: val > 0
                            });
                          }}
                          className="admin-input w-full text-xs font-bold font-mono"
                        />
                        <div className="flex gap-1 shrink-0">
                          {[10, 25, 50, 100].map((inc) => (
                            <button
                              key={inc}
                              type="button"
                              onClick={() => {
                                const currentStock = (Boolean(editingProduct.inStock ?? editingProduct.in_stock ?? true) && Number(editingProduct.stock) > 0)
                                  ? Number(editingProduct.stock)
                                  : 0;
                                const newQty = currentStock + inc;
                                setEditingProduct({
                                  ...editingProduct,
                                  stock: newQty,
                                  inStock: true,
                                  in_stock: true,
                                });
                              }}
                              className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-300 rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                              title={`Add +${inc} units`}
                            >
                              +{inc}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="font-semibold text-slate-300 block mb-1">Package Quantity String</label>
                      <input
                        type="text"
                        value={editingProduct.packageQuantity || 'Set of 2 Pieces'}
                        onChange={(e) => setEditingProduct({ ...editingProduct, packageQuantity: e.target.value })}
                        placeholder="e.g. 20 Patches (₹9.95 / count)"
                        className="admin-input w-full text-xs"
                      />
                    </div>
                  </div>

                  {/* Stock Availability & Units Sold & Threshold */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-950/60 rounded-xl border border-slate-800">
                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Stock Availability Status</label>
                      {(() => {
                        const isEditingInStock = Boolean(editingProduct.inStock ?? editingProduct.in_stock ?? true) && Number(editingProduct.stock ?? 0) > 0;
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const nextInStock = !isEditingInStock;
                              const nextStock = nextInStock ? (Number(editingProduct.stock) > 0 ? Number(editingProduct.stock) : 25) : 0;
                              const nextColors = Array.isArray(editingProduct.colors)
                                ? editingProduct.colors.map(c => ({
                                    ...c,
                                    stock: nextInStock ? (Number(c.stock) > 0 ? Number(c.stock) : Math.max(1, Math.floor(nextStock / (editingProduct.colors.length || 1)))) : 0
                                  }))
                                : [];
                              setEditingProduct({
                                ...editingProduct,
                                inStock: nextInStock,
                                in_stock: nextInStock,
                                stock: nextStock,
                                colors: nextColors,
                              });
                            }}
                            className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                              isEditingInStock
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border-rose-500/40 hover:bg-rose-500/30'
                            }`}
                          >
                            {isEditingInStock ? (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                                <span>In Stock ({editingProduct.stock || 25} Units)</span>
                              </>
                            ) : (
                              <>
                                <XCircle className="w-3.5 h-3.5 text-rose-400" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </button>
                        );
                      })()}
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Total Units Sold</label>
                      <input
                        type="number"
                        value={editingProduct.sold_quantity ?? editingProduct.soldQuantity ?? 0}
                        onChange={(e) => setEditingProduct({ ...editingProduct, sold_quantity: Number(e.target.value), soldQuantity: Number(e.target.value) })}
                        className="admin-input w-full text-xs font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-400 block mb-1">Low Stock Warning (Threshold)</label>
                      <input
                        type="number"
                        value={editingProduct.low_stock_threshold ?? editingProduct.lowStockThreshold ?? 15}
                        onChange={(e) => setEditingProduct({ ...editingProduct, low_stock_threshold: Number(e.target.value), lowStockThreshold: Number(e.target.value) })}
                        className="admin-input w-full text-xs font-mono"
                      />
                    </div>
                  </div>

                  {/* Shipping Weight & Dimensions for Shiprocket Courier Calculation */}
                  <div className="pt-3.5 border-t border-slate-800 space-y-2 bg-slate-950/40 p-3 rounded-lg border border-indigo-500/20">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <label className="font-bold text-indigo-300 flex items-center gap-1.5 text-xs">
                        <Truck className="w-3.5 h-3.5 text-indigo-400" />
                        Shipping Specifications (Weight & Package Dimensions)
                        <span className="text-red-400 font-black text-xs">* Mandatory</span>
                      </label>
                      <span className="text-[10px] text-red-400 font-mono font-bold bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 w-fit">
                        ★ Mandatory for Accurate Courier Rate & Dispatch
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Enter the single packed item weight in kg (e.g. 0.25 kg = 250g) and outer box dimensions in cm. All 4 fields must be filled.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                      <div>
                        <label className="font-semibold text-slate-300 block mb-1 text-[11px]">
                          Weight (kg) <span className="text-red-400 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          value={editingProduct.weight !== undefined && editingProduct.weight !== null ? editingProduct.weight : ''}
                          onChange={(e) => setEditingProduct({ ...editingProduct, weight: e.target.value === '' ? '' : parseFloat(e.target.value) })}
                          placeholder="e.g. 0.5"
                          className="admin-input w-full text-xs font-mono border-indigo-500/40 focus:border-indigo-400"
                          required
                        />
                        <span className="text-[10px] text-slate-500">e.g. 0.5 kg (500g)</span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1 text-[11px]">
                          Length (cm) <span className="text-red-400 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={editingProduct.length !== undefined && editingProduct.length !== null ? editingProduct.length : (editingProduct.dimensions?.length !== undefined ? editingProduct.dimensions.length : '')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              length: val,
                              dimensions: { ...(editingProduct.dimensions || {}), length: val }
                            });
                          }}
                          placeholder="e.g. 15"
                          className="admin-input w-full text-xs font-mono border-indigo-500/40 focus:border-indigo-400"
                          required
                        />
                        <span className="text-[10px] text-slate-500">Box length (cm)</span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1 text-[11px]">
                          Breadth (cm) <span className="text-red-400 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={editingProduct.breadth !== undefined && editingProduct.breadth !== null ? editingProduct.breadth : (editingProduct.dimensions?.breadth !== undefined ? editingProduct.dimensions.breadth : '')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              breadth: val,
                              dimensions: { ...(editingProduct.dimensions || {}), breadth: val }
                            });
                          }}
                          placeholder="e.g. 10"
                          className="admin-input w-full text-xs font-mono border-indigo-500/40 focus:border-indigo-400"
                          required
                        />
                        <span className="text-[10px] text-slate-500">Box width (cm)</span>
                      </div>

                      <div>
                        <label className="font-semibold text-slate-300 block mb-1 text-[11px]">
                          Height (cm) <span className="text-red-400 font-bold">*</span>
                        </label>
                        <input
                          type="number"
                          step="0.5"
                          min="1"
                          value={editingProduct.height !== undefined && editingProduct.height !== null ? editingProduct.height : (editingProduct.dimensions?.height !== undefined ? editingProduct.dimensions.height : '')}
                          onChange={(e) => {
                            const val = e.target.value === '' ? '' : parseFloat(e.target.value);
                            setEditingProduct({
                              ...editingProduct,
                              height: val,
                              dimensions: { ...(editingProduct.dimensions || {}), height: val }
                            });
                          }}
                          placeholder="e.g. 5"
                          className="admin-input w-full text-xs font-mono border-indigo-500/40 focus:border-indigo-400"
                          required
                        />
                        <span className="text-[10px] text-slate-500">Box height (cm)</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: VARIANTS (COLORS & SIZES) */}
              {activeEditorTab === 'variants' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">Color Variants & Stock Allocation</h4>
                      <p className="text-[11px] text-slate-400">Set individual stock quantities for each color variant. Customers cannot purchase out-of-stock colors.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const totalSum = (editingProduct.colors || []).reduce((acc, c) => acc + Number(c.stock || 0), 0);
                          if (totalSum > 0) {
                            setEditingProduct({ ...editingProduct, stock: totalSum, inStock: totalSum > 0, in_stock: totalSum > 0 });
                            showToast(`Total stock synced to ${totalSum} units from variants`, 'success');
                          } else {
                            showToast('Please add quantities to color variants first', 'info');
                          }
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-900/60 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        title="Sum all color stocks into total product stock"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        <span>Sync Sum to Total Stock</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const currentColors = Array.isArray(editingProduct.colors) ? [...editingProduct.colors] : [];
                          currentColors.push({
                            name: `Variant ${currentColors.length + 1}`,
                            hex: '#D4AF37',
                            price: editingProduct.price || 299,
                            originalPrice: editingProduct.originalPrice || 699,
                            stock: 25,
                            image: editingProduct.images?.[0] || '/products/pearl-zardosi-patch-1.jpg',
                          });
                          setEditingProduct({ ...editingProduct, colors: currentColors });
                        }}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Color</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {editingProduct.colors?.map((c, i) => (
                      <div key={i} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col gap-3">
                        <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-center">
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Color Name</label>
                            <input
                              type="text"
                              value={c.name}
                              onChange={(e) => {
                                const newColors = [...editingProduct.colors];
                                newColors[i].name = e.target.value;
                                setEditingProduct({ ...editingProduct, colors: newColors });
                              }}
                              className="admin-input w-full text-xs py-1"
                              placeholder="e.g. Royal Maroon"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Hex Code</label>
                            <div className="flex items-center gap-2">
                              <input
                                type="color"
                                value={c.hex || '#D4AF37'}
                                onChange={(e) => {
                                  const newColors = [...editingProduct.colors];
                                  newColors[i].hex = e.target.value;
                                  setEditingProduct({ ...editingProduct, colors: newColors });
                                }}
                                className="w-7 h-7 rounded-lg bg-transparent border-0 cursor-pointer"
                              />
                              <input
                                type="text"
                                value={c.hex || '#D4AF37'}
                                onChange={(e) => {
                                  const newColors = [...editingProduct.colors];
                                  newColors[i].hex = e.target.value;
                                  setEditingProduct({ ...editingProduct, colors: newColors });
                                }}
                                className="admin-input w-full text-xs font-mono py-1"
                              />
                            </div>
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Variant Price (₹)</label>
                            <input
                              type="number"
                              value={c.price !== undefined ? c.price : editingProduct.price}
                              onChange={(e) => {
                                const newColors = [...editingProduct.colors];
                                newColors[i].price = Number(e.target.value);
                                setEditingProduct({ ...editingProduct, colors: newColors });
                              }}
                              className="admin-input w-full text-xs py-1"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] text-slate-400 font-bold block mb-0.5">
                              Stock Qty (Units)
                            </label>
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                value={c.stock !== undefined ? c.stock : (editingProduct.stock || 25)}
                                onChange={(e) => {
                                  const newColors = [...editingProduct.colors];
                                  newColors[i].stock = Math.max(0, Number(e.target.value));
                                  setEditingProduct({ ...editingProduct, colors: newColors });
                                }}
                                className="admin-input w-full text-xs py-1 font-bold font-mono"
                              />
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shrink-0 ${
                                (c.stock !== undefined ? c.stock : 25) > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                              }`}>
                                {(c.stock !== undefined ? c.stock : 25) > 0 ? 'In Stock' : 'Out'}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="text-[10px] text-slate-400 font-bold block mb-0.5">Photo URL</label>
                              <input
                                type="text"
                                value={c.image || ''}
                                onChange={(e) => {
                                  const newColors = [...editingProduct.colors];
                                  newColors[i].image = e.target.value;
                                  setEditingProduct({ ...editingProduct, colors: newColors });
                                }}
                                placeholder="/products/color.jpg"
                                className="admin-input w-full text-xs font-mono py-1"
                              />
                            </div>
                            {editingProduct.colors.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const newColors = editingProduct.colors.filter((_, idx) => idx !== i);
                                  setEditingProduct({ ...editingProduct, colors: newColors });
                                }}
                                className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-lg mt-3"
                                title="Remove Variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <label className="font-semibold text-slate-300 block mb-1">Available Sizes (Comma separated)</label>
                    <input
                      type="text"
                      value={editingProduct.sizes?.join(', ') || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, sizes: e.target.value.split(',').map(s => s.trim()) })}
                      placeholder="e.g. Set of 20 (Medium), Set of 40 (Medium)"
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 5: DESCRIPTIONS & SPECS */}
              {activeEditorTab === 'details' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Short Description</label>
                    <textarea
                      rows={2}
                      value={editingProduct.shortDescription || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, shortDescription: e.target.value })}
                      className="admin-input w-full text-xs"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Full Authentic Description</label>
                    <textarea
                      rows={4}
                      value={editingProduct.fullDescription || ''}
                      onChange={(e) => setEditingProduct({ ...editingProduct, fullDescription: e.target.value })}
                      className="admin-input w-full text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 6: BADGES & SPECIAL FLAGS */}
              {activeEditorTab === 'flags' && (
                <div className="space-y-4 animate-fadeIn">
                  <div>
                    <label className="font-semibold text-slate-300 block mb-1">Catalog Badge</label>
                    <select
                      value={editingProduct.badge || 'New'}
                      onChange={(e) => setEditingProduct({ ...editingProduct, badge: e.target.value })}
                      className="admin-select w-full text-xs"
                    >
                      <option value="Best Seller">Best Seller</option>
                      <option value="Festival Special">Festival Special</option>
                      <option value="Trending">Trending</option>
                      <option value="Handmade">Handmade</option>
                      <option value="Sale">Sale</option>
                      <option value="New">New</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isHandmade ?? true}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isHandmade: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Handmade</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isWeddingSpecial ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isWeddingSpecial: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Wedding Special</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isFestivalSpecial ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isFestivalSpecial: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Festival Special</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isBestSeller ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Best Seller</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isTrending ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isTrending: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Trending</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.isFeatured ?? false}
                        onChange={(e) => setEditingProduct({ ...editingProduct, isFeatured: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-slate-200">Featured</span>
                    </label>

                    <label className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingProduct.inStock ?? true}
                        onChange={(e) => setEditingProduct({ ...editingProduct, inStock: e.target.checked })}
                        className="rounded border-slate-700 bg-slate-800 text-indigo-600 w-4 h-4"
                      />
                      <span className="font-semibold text-emerald-400">Published / Active</span>
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
