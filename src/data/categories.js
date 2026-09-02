export const categories = [
  {
    id: 1,
    name: "Patches",
    slug: "patches",
    image: "/products/peacock-real-feathers-pair-1.jpg",
    banner: "/products/shreenathji-statement-patch-1.jpg",
    description: "Exquisite handcrafted embroidery appliques, zardosi motifs, zarkan stone emblems, and sacred deity patches for bridal wear and ethnic couture.",
    productCount: 16,
    subcategories: [
      { name: "Peacock Patches", slug: "peacock-patches" },
      { name: "Deity & Spiritual", slug: "deity-spiritual" },
      { name: "Zardosi & Moti", slug: "zardosi-moti" },
      { name: "Lotus & Floral", slug: "lotus-floral" }
    ]
  },
  {
    id: 2,
    name: "Bottle",
    slug: "bottle",
    image: "/products/hammered-copper-bottle-1.jpg",
    banner: "/products/hammered-copper-bottle-2.jpg",
    description: "100% pure Ayurvedic hammered and matte copper water bottles engineered for health, holistic wellness, and timeless Indian dining.",
    productCount: 4,
    subcategories: [
      { name: "Hammered Finish", slug: "hammered-finish" },
      { name: "Matte Plain", slug: "matte-plain" },
      { name: "Gift Sets with Bag", slug: "gift-sets-bag" }
    ]
  },
  {
    id: 3,
    name: "Aasan",
    slug: "aasan",
    image: "/products/lotus-kamal-aasan-1.jpg",
    banner: "/products/pooja-thali-brass-diya-1.jpg",
    description: "Sacred velvet, silk, and beaded pooja aasans, chowki cloths, and mandir mats designed for festive rituals and daily devotion.",
    productCount: 4,
    subcategories: [
      { name: "Lotus Kamal Aasan", slug: "lotus-kamal-aasan" },
      { name: "Velvet Thali Mat", slug: "velvet-thali-mat" },
      { name: "Mandir Chowki Aasan", slug: "mandir-chowki-aasan" }
    ]
  },
  {
    id: 4,
    name: "Flower Bunch",
    slug: "flower-bunch",
    image: "/products/gold-pollen-flower-bunch-1.jpg",
    banner: "/products/pink-pollen-flower-bunch-1.jpg",
    description: "Vibrant artificial pollens, peony blooms, and silk flower bunches for festive torans, haldi-mehendi decor, and DIY crafts.",
    productCount: 5,
    subcategories: [
      { name: "Pollen Bunches", slug: "pollen-bunches" },
      { name: "Silk Peonies", slug: "silk-peonies" },
      { name: "Festive Rose Stems", slug: "festive-rose-stems" }
    ]
  },
  {
    id: 5,
    name: "Towel / Gamcha",
    slug: "towel-gamcha",
    image: "/products/pure-cotton-gamcha-red-1.jpg",
    banner: "/products/pure-cotton-gamcha-white-1.jpg",
    description: "100% breathable pure desi cotton gamchas and angavastrams woven for pooja rituals, daily comfort, and traditional wear.",
    productCount: 4,
    subcategories: [
      { name: "Pooja Angavastram", slug: "pooja-angavastram" },
      { name: "Check Gamcha", slug: "check-gamcha" },
      { name: "White Cotton Gamcha", slug: "white-cotton-gamcha" }
    ]
  },
  {
    id: 6,
    name: "Cup Chain",
    slug: "cup-chain",
    image: "/products/gold-clear-cup-chain-10m-1.jpg",
    banner: "/products/pearl-emerald-cup-chain-5m-1.jpg",
    description: "High-sparkle rhinestone stone chains, pearl zarkan trim, and rainbow iridescent cup chains for saree borders and jewelry crafting.",
    productCount: 5,
    subcategories: [
      { name: "Clear Crystal Chains", slug: "clear-crystal-chains" },
      { name: "Pearl Emerald Chains", slug: "pearl-emerald-chains" },
      { name: "Multi Iridescent", slug: "multi-iridescent" }
    ]
  },
  {
    id: 7,
    name: "Paranda",
    slug: "paranda",
    image: "/products/pearl-paranda-bunch-1.jpg",
    banner: "/products/pearl-paranda-bunch-2.jpg",
    description: "Traditional Punjabi & Rajasthani hair parandas embellished with lustrous pearls, golden beads, and tassels for wedding attire.",
    productCount: 2,
    subcategories: [
      { name: "Bridal Pearl Paranda", slug: "bridal-pearl-paranda" },
      { name: "Festive Latkan Paranda", slug: "festive-latkan-paranda" }
    ]
  },
  {
    id: 8,
    name: "Chudi Ring",
    slug: "chudi-ring",
    image: "/products/gota-chudi-ring-1.jpg",
    banner: "/products/gota-chudi-ring-2.jpg",
    description: "Festive gota patti and silk thread chudi rings, bangles, and latkan accessories for sangeet, mehendi favors, and ethnic styling.",
    productCount: 2,
    subcategories: [
      { name: "Gota Patti Rings", slug: "gota-patti-rings" },
      { name: "Mehendi Favors", slug: "mehendi-favors" }
    ]
  },
  {
    id: 9,
    name: "More Products",
    slug: "more-products",
    image: "/products/jute-bottle-bag-1.jpg",
    banner: "/products/hanuman-chalisa-book-1.jpg",
    description: "Handicraft tools, premium jute bottle carriers, miniature devotional Hanuman Chalisa books, and artisanal workshop accessories.",
    productCount: 3,
    subcategories: [
      { name: "Jute Bottle Bags", slug: "jute-bottle-bags" },
      { name: "Devotional Books", slug: "devotional-books" },
      { name: "Crafting & Polishing Tools", slug: "crafting-tools" }
    ]
  }
];

export const getCategoryBySlug = (slug) => {
  if (!slug) return null;
  const cleanSlug = slug.toLowerCase().trim();
  return categories.find(c => c.slug === cleanSlug || c.name.toLowerCase().replace(/ \/ /g, '-').replace(/ /g, '-') === cleanSlug);
};

export default categories;
