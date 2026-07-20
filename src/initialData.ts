import { Branch, SalesDataPoint, Item, Customer, Supplier, ProductionRecord, Expense, Sale } from "./types";

// Helper to generate sales trend data points (30 days: 14 Jun to 13 Jul)
const generateSalesTrends = (peakAmount: number): SalesDataPoint[] => {
  const dates = [
    "14 Jun", "15 Jun", "16 Jun", "17 Jun", "18 Jun", "19 Jun", "20 Jun", "21 Jun",
    "22 Jun", "23 Jun", "24 Jun", "25 Jun", "26 Jun", "27 Jun", "28 Jun", "29 Jun",
    "30 Jun", "01 Jul", "02 Jul", "03 Jul", "04 Jul", "05 Jul", "06 Jul", "07 Jul",
    "08 Jul", "09 Jul", "10 Jul", "11 Jul", "12 Jul", "13 Jul"
  ];

  return dates.map(date => {
    let amount = 0;
    if (date === "03 Jul") {
      amount = peakAmount; // Match the 55,400 ৳ peak in the user's image!
    } else if (date === "25 Jun") {
      amount = Math.round(peakAmount * 0.15); // A small mini-peak
    } else if (date === "10 Jul") {
      amount = Math.round(peakAmount * 0.22);
    } else {
      // Deterministic low/zero values keep demo data stable across reloads.
      const index = dates.indexOf(date);
      amount = index % 7 === 0 ? 1200 + (index * 137) % 1800 : 0;
    }
    return { date, amount };
  });
};

export const initialBranches: Branch[] = [
  {
    id: "br-1",
    name: "Alisha Food And Bev",
    location: "বিসিক শিল্প নগরী, সোনাপুর,নোয়াখালী।",
    sales: 0,
    due: 0,
    purchases: 0,
    expenses: 0,
    stockValue: 0,
    itemTypes: [
      { id: "type-initial-1", name: "বোতল" },
      { id: "type-initial-2", name: "প্রিফর্ম" },
      { id: "type-initial-3", name: "হাতা" },
      { id: "type-initial-4", name: "ক্যাপ" }
    ],
    items: [],
    customers: [],
    suppliers: [],
    production: [],
    salesData: [],
    expensesList: [],
    salesList: []
  }
];
