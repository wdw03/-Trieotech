export const initialReturns = [
  {
    id: "RET-401",
    orderId: "ORD-98413",
    customer: "Divya Nambiar",
    email: "divya.nambiar@gmail.com",
    productName: "Pearl zardosi Moti Beaded Round Applique Patches (Set of 20)",
    quantity: 1,
    amount: 199,
    reason: "Size Mismatch",
    reasonDetails: "The medium patches are slightly larger than my blouse sleeve border width (needed 3cm, received 4.5cm).",
    status: "Return Requested",
    requestDate: "2026-09-02",
    pickupCourier: "BlueDart Return",
    trackingNumber: "R-BD991209",
    timeline: [
      { step: "Return Requested", date: "2026-09-02 11:20 AM", done: true },
      { step: "Merchant Approval", date: "Pending Review", done: false },
      { step: "Courier Pickup", date: "Scheduled", done: false },
      { step: "Quality Check & Inspection", date: "Pending", done: false },
      { step: "Refund Credited", date: "Pending", done: false }
    ]
  },
  {
    id: "RET-400",
    orderId: "ORD-98412",
    customer: "Arti Sengupta",
    email: "arti.sengupta@kolkata.net",
    productName: "Decorative Peacock Applique Patches, Sequin & Rhinestone (Set of 4)",
    quantity: 1,
    amount: 249,
    reason: "Accidental Duplicate Order",
    reasonDetails: "I accidentally placed two orders for the peacock motif set while refreshing the payment page.",
    status: "Returned",
    requestDate: "2026-08-30",
    pickupCourier: "Delhivery Reverse",
    trackingNumber: "R-DL221456",
    timeline: [
      { step: "Return Requested", date: "2026-08-30 09:40 AM", done: true },
      { step: "Merchant Approved", date: "2026-08-30 01:15 PM", done: true },
      { step: "Item Picked Up", date: "2026-08-31 03:00 PM", done: true },
      { step: "Quality Check Passed", date: "2026-09-01 11:30 AM", done: true },
      { step: "Refund Pending Bank Clearance", date: "2026-09-02", done: false }
    ]
  },
  {
    id: "RET-399",
    orderId: "ORD-98411",
    customer: "Deepika Chawla",
    email: "deepika.c@gmail.com",
    productName: "Shreenath ji Face Embroidered Patch (Set of 2)",
    quantity: 1,
    amount: 499,
    reason: "Minor Stone Dislodged",
    reasonDetails: "One rhinestone near the Mukharvind border came loose during transit.",
    status: "Refunded",
    requestDate: "2026-08-28",
    pickupCourier: "BlueDart Return",
    trackingNumber: "R-BD665123",
    refundTransactionId: "RFND-62431720",
    timeline: [
      { step: "Return Requested", date: "2026-08-28 04:15 PM", done: true },
      { step: "Merchant Approved", date: "2026-08-28 05:00 PM", done: true },
      { step: "Item Picked Up", date: "2026-08-29 02:20 PM", done: true },
      { step: "Quality Checked", date: "2026-08-30 10:15 AM", done: true },
      { step: "Refund Completed (₹499 to UPI)", date: "2026-08-31 05:20 PM", done: true }
    ]
  }
];
