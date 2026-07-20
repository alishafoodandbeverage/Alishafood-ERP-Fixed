export interface SalesDataPoint {
  date: string; // e.g., "14 Jun", "15 Jun"
  amount: number;
}

export interface Item {
  id: string;
  name: string;
  sku: string; // Used as barcode/SKU
  price: number; // Sale price
  cost: number; // Buy price
  stock: number;
  unit: string;
  type?: string; // Item Type (e.g. Bottle, Cap)
  productionDate?: string;
  expirationDate?: string;
}

export interface ProductionRecord {
  id: string;
  itemName: string;
  productionCost: number;
  quantity: number;
  date: string; // YYYY-MM-DD
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  due: number;
  totalSales: number;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  outstanding: number;
}

export interface Expense {
  id: string;
  category: string;
  amount: number;
  date: string;
  description: string;
}

export interface Sale {
  id: string;
  itemName: string;
  quantity: number;
  amount: number;
  date: string;
  customerName?: string;
}

export interface PettyCashTransaction {
  id: string;
  type: "credit" | "debit";
  amount: number;
  description: string;
  date: string;
}

export interface ItemType {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
  role: string;
  phone: string;
  email?: string;
  salary: number;
}

export interface Attendance {
  id: string;
  staffId: string;
  date: string;
  status: "Present" | "Absent" | "Late";
  notes?: string;
}

export interface Payroll {
  id: string;
  staffId: string;
  month: string; // YYYY-MM
  baseSalary: number;
  bonus: number;
  deductions: number;
  netPayable: number;
  status: "Pending" | "Paid";
}

export interface StaffTransaction {
  id: string;
  staffId: string;
  date: string;
  type: "Advance" | "Bonus" | "Penalty";
  amount: number;
}

export interface EmployeeAdvance {
  id: string;
  employeeName: string;
  amount: number;
  date: string;
}

export interface Branch {
  id: string;
  name: string;
  location: string;
  sales: number;
  due: number;
  purchases: number;
  expenses: number;
  stockValue: number;
  pettyCashBalance?: number;
  pettyCashTransactions?: PettyCashTransaction[];
  advances?: EmployeeAdvance[];
  staff?: Staff[];
  attendance?: Attendance[];
  payroll?: Payroll[];
  staffTransactions?: StaffTransaction[];
  itemTypes?: ItemType[];
  items: Item[];
  customers: Customer[];
  suppliers: Supplier[];
  production: ProductionRecord[];
  salesData: SalesDataPoint[];
  expensesList: Expense[];
  salesList: Sale[];
  logoUrl?: string;
  themeColor?: string;
}
