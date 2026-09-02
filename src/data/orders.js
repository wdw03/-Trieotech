export const mockOrders = [
  {
    id: "TRIO-98421",
    date: "28 August 2026",
    status: "Delivered",
    trackingNumber: "ECOM-IND-78492019",
    carrier: "BlueDart Express Courier",
    items: [
      {
        productId: 101,
        name: "Shreenathji Face Statement Embroidered Zari & Sequin Applique Patch | Big Royal Size",
        image: "/products/shreenathji-statement-patch-1.jpg",
        price: 999,
        quantity: 1,
        color: "Royal Crimson & Gold",
        size: "Single Big Statement Piece (25cm x 18cm)"
      },
      {
        productId: 102,
        name: "Trio Ecart 100% Pure Hammered Copper Water Bottle 1 Litre with Premium Jute Bottle Bag Set",
        image: "/products/hammered-copper-bottle-1.jpg",
        price: 899,
        quantity: 1,
        color: "Natural Hammered Copper",
        size: "1000 ml Bottle + Jute Carrier Bag"
      }
    ],
    subtotal: 1898,
    discount: 189,
    shipping: 0,
    tax: 0,
    total: 1709,
    shippingAddress: {
      name: "Radhika Singhania",
      phone: "+91 98234 56789",
      address: "Flat 402, Royal Palms Residency, MG Road",
      city: "Jaipur",
      state: "Rajasthan",
      zip: "302001",
      country: "India"
    },
    paymentMethod: "UPI (Google Pay / PhonePe)",
    estimatedDelivery: "31 August 2026",
    deliveredDate: "30 August 2026",
    timeline: [
      { status: "Order Placed", date: "28 Aug 2026, 10:30 AM", completed: true, details: "Order confirmed via UPI payment" },
      { status: "Artisan Quality Checked", date: "28 Aug 2026, 03:15 PM", completed: true, details: "Handcrafted inspection and defect verification passed" },
      { status: "Packed in Eco-Friendly Box", date: "29 Aug 2026, 09:00 AM", completed: true, details: "Packed with bubble wrap & sacred packaging seals" },
      { status: "Handed over to BlueDart", date: "29 Aug 2026, 02:45 PM", completed: true, details: "Tracking ID generated: ECOM-IND-78492019" },
      { status: "Out for Delivery", date: "30 Aug 2026, 08:30 AM", completed: true, details: "Delivery executive Rajesh Kumar is out for delivery" },
      { status: "Delivered with Love", date: "30 Aug 2026, 01:20 PM", completed: true, details: "Delivered to patron at front door. Signature recorded." }
    ]
  },
  {
    id: "TRIO-98542",
    date: "01 September 2026",
    status: "Shipped",
    trackingNumber: "DELHIVERY-EXP-392011",
    carrier: "Delhivery Air Express",
    items: [
      {
        productId: 103,
        name: "Decorative Red Velvet Handcrafted Pooja Thali with 2 Solid Brass Diyas & Pearl Lace Border",
        image: "/products/pooja-thali-brass-diya-1.jpg",
        price: 399,
        quantity: 2,
        color: "Red & Gold",
        size: "Standard Round Pooja Thali (with 2 Brass Diyas)"
      }
    ],
    subtotal: 798,
    discount: 0,
    shipping: 0,
    tax: 0,
    total: 798,
    shippingAddress: {
      name: "Amitabh Chatterjee",
      phone: "+91 97321 44556",
      address: "B-12, Lake View Towers, Salt Lake Sector 2",
      city: "Kolkata",
      state: "West Bengal",
      zip: "700091",
      country: "India"
    },
    paymentMethod: "Cash on Delivery (COD)",
    estimatedDelivery: "05 September 2026",
    deliveredDate: null,
    timeline: [
      { status: "Order Placed", date: "01 Sep 2026, 02:15 PM", completed: true, details: "Order confirmed with COD option" },
      { status: "Artisan Quality Checked", date: "01 Sep 2026, 05:00 PM", completed: true, details: "Craft quality inspection certified" },
      { status: "Packed in Eco-Friendly Box", date: "02 Sep 2026, 11:30 AM", completed: true, details: "Reinforced corner protection applied" },
      { status: "Handed over to Courier", date: "02 Sep 2026, 04:00 PM", completed: true, details: "Dispatched from Jaipur Craft Center" },
      { status: "Out for Delivery", date: "Pending", completed: false, details: "In transit to Kolkata Sorting Facility" },
      { status: "Delivered with Love", date: "Pending", completed: false, details: "Expected arrival on 05 Sep 2026" }
    ]
  }
];

export const getOrderByTrackingOrId = (identifier) => {
  if (!identifier) return null;
  const id = identifier.trim().toUpperCase();
  return mockOrders.find(o => 
    o.id.toUpperCase() === id || 
    (o.trackingNumber && o.trackingNumber.toUpperCase() === id)
  );
};

export default mockOrders;
