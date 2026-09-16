import products from './products.js';

// Order Statuses
export const ORDER_STATUSES = [
  'New',
  'Confirmed',
  'Processing',
  'Packed',
  'Pickup Scheduled',
  'Picked Up',
  'Shipped',
  'In Transit',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'Delivery Failed',
  'RTO Initiated',
  'RTO Delivered',
  'Return Requested',
  'Return Approved',
  'Return Initiated',
  'Returned',
  'Refunded'
];

export const PAYMENT_METHODS = ['UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'COD'];
export const COURIER_PARTNERS = ['BlueDart', 'Delhivery', 'Xpressbees', 'DTDC', 'Shadowfax'];

// Helper to pick random items from catalog
const getRandomProducts = (seed) => {
  const p1 = products[seed % products.length];
  const p2 = products[(seed * 3 + 7) % products.length];
  return [
    {
      productId: p1.id,
      name: p1.name,
      slug: p1.slug,
      image: p1.images?.[0] || '/products/pearl-zardosi-patch-1.jpg',
      category: p1.category,
      price: p1.price,
      originalPrice: p1.originalPrice || p1.price * 2,
      discount: p1.discount || 20,
      quantity: (seed % 3) + 1,
      selectedColor: p1.colors?.[0]?.name || p1.color || 'Standard',
      selectedSize: p1.sizes?.[0] || 'Standard Pack',
    },
    ...(seed % 2 === 0 ? [{
      productId: p2.id,
      name: p2.name,
      slug: p2.slug,
      image: p2.images?.[0] || '/products/yellow-pollen-flower-bunch-1.jpg',
      category: p2.category,
      price: p2.price,
      originalPrice: p2.originalPrice || p2.price * 2,
      discount: p2.discount || 15,
      quantity: 1,
      selectedColor: p2.colors?.[0]?.name || p2.color || 'Standard',
      selectedSize: p2.sizes?.[0] || 'Standard Pack',
    }] : [])
  ];
};

export const initialOrders = [
  {
    id: "ORD-98421",
    date: "2026-09-03T10:30:00Z",
    customer: {
      id: "CUST-101",
      name: "Pooja Sharma",
      email: "pooja.sharma92@gmail.com",
      phone: "+91 98201 44521",
      address: {
        street: "B-402, Royal Palms, Goregaon East",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400065"
      }
    },
    status: "New",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    shippingPartner: "BlueDart",
    trackingNumber: "BD982144512IN",
    estimatedDelivery: "2026-09-06",
    shippingCharge: 0,
    taxAmount: 36,
    discountAmount: 50,
    items: getRandomProducts(1)
  },
  {
    id: "ORD-98420",
    date: "2026-09-03T09:15:00Z",
    customer: {
      id: "CUST-102",
      name: "Ananya Deshmukh",
      email: "ananya.d@rediffmail.com",
      phone: "+91 98711 23098",
      address: {
        street: "12/A, Kalyani Nagar",
        city: "Pune",
        state: "Maharashtra",
        pincode: "411006"
      }
    },
    status: "Confirmed",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    shippingPartner: "Delhivery",
    trackingNumber: "DL889021430IN",
    estimatedDelivery: "2026-09-07",
    shippingCharge: 49,
    taxAmount: 54,
    discountAmount: 100,
    items: getRandomProducts(2)
  },
  {
    id: "ORD-98419",
    date: "2026-09-02T18:40:00Z",
    customer: {
      id: "CUST-103",
      name: "Meenakshi Sundaram",
      email: "meenakshi.s@gmail.com",
      phone: "+91 94441 55672",
      address: {
        street: "Plot 88, T Nagar",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600017"
      }
    },
    status: "Processing",
    paymentMethod: "Net Banking",
    paymentStatus: "Paid",
    shippingPartner: "Xpressbees",
    trackingNumber: "XB773190223IN",
    estimatedDelivery: "2026-09-08",
    shippingCharge: 0,
    taxAmount: 72,
    discountAmount: 0,
    items: getRandomProducts(3)
  },
  {
    id: "ORD-98418",
    date: "2026-09-02T15:20:00Z",
    customer: {
      id: "CUST-104",
      name: "Rajesh Khandelwal",
      email: "rajesh.k@khandelwaltraders.com",
      phone: "+91 98290 11234",
      address: {
        street: "Johari Bazaar, Near Hawa Mahal",
        city: "Jaipur",
        state: "Rajasthan",
        pincode: "302003"
      }
    },
    status: "Packed",
    paymentMethod: "COD",
    paymentStatus: "Pending",
    shippingPartner: "Delhivery",
    trackingNumber: "DL990145231IN",
    estimatedDelivery: "2026-09-06",
    shippingCharge: 50,
    taxAmount: 48,
    discountAmount: 30,
    items: getRandomProducts(4)
  },
  {
    id: "ORD-98417",
    date: "2026-09-02T11:05:00Z",
    customer: {
      id: "CUST-105",
      name: "Sneha Patel",
      email: "sneha.patel@surattextile.in",
      phone: "+91 99099 87654",
      address: {
        street: "C-14, Ring Road Ring Mall",
        city: "Surat",
        state: "Gujarat",
        pincode: "395002"
      }
    },
    status: "Shipped",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    shippingPartner: "BlueDart",
    trackingNumber: "BD441908234IN",
    estimatedDelivery: "2026-09-05",
    shippingCharge: 0,
    taxAmount: 90,
    discountAmount: 150,
    items: getRandomProducts(5)
  },
  {
    id: "ORD-98416",
    date: "2026-09-01T16:30:00Z",
    customer: {
      id: "CUST-106",
      name: "Kavita Singhal",
      email: "kavita.singhal@yahoo.co.in",
      phone: "+91 98101 22345",
      address: {
        street: "Sector 14, HUDA Colony",
        city: "Gurugram",
        state: "Haryana",
        pincode: "122001"
      }
    },
    status: "Out for Delivery",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    shippingPartner: "BlueDart",
    trackingNumber: "BD556211902IN",
    estimatedDelivery: "2026-09-03",
    shippingCharge: 0,
    taxAmount: 64,
    discountAmount: 50,
    items: getRandomProducts(6)
  },
  {
    id: "ORD-98415",
    date: "2026-09-01T10:10:00Z",
    customer: {
      id: "CUST-107",
      name: "Sunita Verma",
      email: "sunita.v@outlook.com",
      phone: "+91 94150 88921",
      address: {
        street: "Hazratganj, Near Cathedral",
        city: "Lucknow",
        state: "Uttar Pradesh",
        pincode: "226001"
      }
    },
    status: "Delivered",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    shippingPartner: "DTDC",
    trackingNumber: "DT332145890IN",
    estimatedDelivery: "2026-09-02",
    shippingCharge: 0,
    taxAmount: 110,
    discountAmount: 120,
    items: getRandomProducts(7)
  },
  {
    id: "ORD-98414",
    date: "2026-08-31T14:45:00Z",
    customer: {
      id: "CUST-108",
      name: "Rohit Agrawal",
      email: "rohit.agrawal@gmail.com",
      phone: "+91 97551 22091",
      address: {
        street: "55, Chhappan Dukan Area",
        city: "Indore",
        state: "Madhya Pradesh",
        pincode: "452001"
      }
    },
    status: "Cancelled",
    paymentMethod: "COD",
    paymentStatus: "Cancelled",
    shippingPartner: "Delhivery",
    trackingNumber: "DL776512309IN",
    estimatedDelivery: "2026-09-04",
    shippingCharge: 50,
    taxAmount: 32,
    discountAmount: 0,
    items: getRandomProducts(8)
  },
  {
    id: "ORD-98413",
    date: "2026-08-30T11:20:00Z",
    customer: {
      id: "CUST-109",
      name: "Divya Nambiar",
      email: "divya.nambiar@gmail.com",
      phone: "+91 98470 33412",
      address: {
        street: "Panampilly Nagar",
        city: "Kochi",
        state: "Kerala",
        pincode: "682036"
      }
    },
    status: "Return Requested",
    paymentMethod: "UPI",
    paymentStatus: "Paid",
    shippingPartner: "BlueDart",
    trackingNumber: "BD991209844IN",
    estimatedDelivery: "2026-09-01",
    shippingCharge: 0,
    taxAmount: 85,
    discountAmount: 40,
    returnReason: "Size slightly larger than my blouse sleeve border",
    returnDate: "2026-09-02",
    items: getRandomProducts(9)
  },
  {
    id: "ORD-98412",
    date: "2026-08-29T09:40:00Z",
    customer: {
      id: "CUST-110",
      name: "Arti Sengupta",
      email: "arti.sengupta@kolkata.net",
      phone: "+91 98300 44921",
      address: {
        street: "Salt Lake Sector 1",
        city: "Kolkata",
        state: "West Bengal",
        pincode: "700064"
      }
    },
    status: "Returned",
    paymentMethod: "Debit Card",
    paymentStatus: "Paid",
    shippingPartner: "Delhivery",
    trackingNumber: "DL221456908IN",
    estimatedDelivery: "2026-08-31",
    shippingCharge: 0,
    taxAmount: 42,
    discountAmount: 30,
    returnReason: "Ordered 2 pairs by mistake, returned 1",
    returnDate: "2026-09-01",
    items: getRandomProducts(10)
  },
  {
    id: "ORD-98411",
    date: "2026-08-28T16:15:00Z",
    customer: {
      id: "CUST-111",
      name: "Deepika Chawla",
      email: "deepika.c@gmail.com",
      phone: "+91 98112 33445",
      address: {
        street: "Model Town III",
        city: "Delhi",
        state: "Delhi",
        pincode: "110009"
      }
    },
    status: "Refunded",
    paymentMethod: "UPI",
    paymentStatus: "Refunded",
    shippingPartner: "BlueDart",
    trackingNumber: "BD665123490IN",
    estimatedDelivery: "2026-08-30",
    shippingCharge: 0,
    taxAmount: 95,
    discountAmount: 50,
    returnReason: "Defective rhinestone in one patch - full refund processed",
    returnDate: "2026-08-31",
    refundAmount: 798,
    items: getRandomProducts(11)
  },
  {
    id: "ORD-98410",
    date: "2026-08-27T12:00:00Z",
    customer: {
      id: "CUST-112",
      name: "Vandana Rao",
      email: "vandana.rao@techindia.com",
      phone: "+91 99490 88712",
      address: {
        street: "Banjara Hills, Road No 10",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500034"
      }
    },
    status: "Delivered",
    paymentMethod: "Credit Card",
    paymentStatus: "Paid",
    shippingPartner: "BlueDart",
    trackingNumber: "BD889214450IN",
    estimatedDelivery: "2026-08-29",
    shippingCharge: 0,
    taxAmount: 140,
    discountAmount: 200,
    items: getRandomProducts(12)
  },
  {
    id: "ORD-98409",
    date: "2026-08-26T17:30:00Z",
    customer: {
      id: "CUST-113",
      name: "Manju Bhatia",
      email: "manju.bhatia@gmail.com",
      phone: "+91 98140 12890",
      address: {
        street: "Ranjit Avenue, B Block",
        city: "Amritsar",
        state: "Punjab",
        pincode: "143001"
      }
    },
    status: "Delivered",
    paymentMethod: "COD",
    paymentStatus: "Paid",
    shippingPartner: "Xpressbees",
    trackingNumber: "XB992145678IN",
    estimatedDelivery: "2026-08-28",
    shippingCharge: 50,
    taxAmount: 60,
    discountAmount: 0,
    items: getRandomProducts(13)
  }
];

// Helper to compute order totals
export const calculateOrderTotal = (order) => {
  const subtotal = order.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = order.taxAmount || 0;
  const shipping = order.shippingCharge || 0;
  const discount = order.discountAmount || 0;
  const total = Math.max(0, subtotal + tax + shipping - discount);
  return {
    subtotal,
    tax,
    shipping,
    discount,
    total
  };
};
