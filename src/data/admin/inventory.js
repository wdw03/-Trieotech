import products from './products.js';

// Generate inventory data for all 43 genuine products
export const initialInventory = products.map((p, idx) => {
  // Category prefix for SKU
  const catPrefix = p.category ? p.category.substring(0, 3).toUpperCase() : 'PRD';
  const sku = `TE-${catPrefix}-${p.id}`;

  // Deterministic realistic stock numbers
  let available = 0;
  if (idx === 0) available = 142;
  else if (idx === 1) available = 89;
  else if (idx === 2) available = 67;
  else if (idx === 3) available = 54;
  else if (idx === 4) available = 112;
  else if (idx === 14) available = 156;
  else if (idx === 15) available = 234;
  else if (idx === 28) available = 8; // Low stock alert!
  else if (idx === 29) available = 3; // Critically low!
  else if (idx === 34) available = 0; // Out of stock!
  else available = Math.floor(((p.id * 17) % 180) + 12);

  const reserved = Math.floor(available * 0.12);

  // Variant breakdown if colors exist
  const variantStock = (p.colors && p.colors.length > 0)
    ? p.colors.map((c, cIdx) => ({
        colorName: c.name,
        colorHex: c.hex,
        available: Math.floor(available / p.colors.length) + (cIdx === 0 ? available % p.colors.length : 0),
        reserved: Math.floor(reserved / p.colors.length)
      }))
    : [];

  return {
    productId: p.id,
    name: p.name,
    sku,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    image: p.images?.[0] || '/products/pearl-zardosi-patch-1.jpg',
    totalStock: available + reserved,
    availableStock: available,
    reservedStock: reserved,
    lowStockThreshold: 15,
    status: available === 0 ? 'Out of Stock' : (available <= 15 ? 'Low Stock' : 'In Stock'),
    lastRestocked: `2026-08-${String(10 + (idx % 20)).padStart(2, '0')}`,
    variants: variantStock
  };
});

// Initial stock history logs
export const initialStockLogs = [
  {
    id: "LOG-901",
    date: "2026-09-02 14:15",
    sku: "TE-PAT-106",
    productName: "Pearl zardosi Moti Beaded Round Applique Patches",
    change: "+50",
    newStock: 142,
    reason: "New Artisan Batch Received",
    admin: "Admin (Trio Ecart Team)"
  },
  {
    id: "LOG-900",
    date: "2026-09-01 11:30",
    sku: "TE-CUP-140",
    productName: "Rhinestone Cup Chain Iridescent AB Crystal",
    change: "-15",
    newStock: 8,
    reason: "Bulk Wholesale Order Deduction",
    admin: "Inventory Manager"
  },
  {
    id: "LOG-899",
    date: "2026-08-30 16:45",
    sku: "TE-FLW-130",
    productName: "Pollen Artificial Flowers (Yellow)",
    change: "+100",
    newStock: 234,
    reason: "Festival Season Restock",
    admin: "Admin (Trio Ecart Team)"
  },
  {
    id: "LOG-898",
    date: "2026-08-28 10:00",
    sku: "TE-BOT-110",
    productName: "100% Pure Copper Water Bottle 1 Litre with Carry Bag",
    change: "+30",
    newStock: 67,
    reason: "Factory Shipment Checked In",
    admin: "Inventory Manager"
  }
];
