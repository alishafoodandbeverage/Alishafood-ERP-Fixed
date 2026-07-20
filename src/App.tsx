import React, { useState, useEffect } from "react";
import { 
  initialBranches 
} from "./initialData";
import { 
  Branch, 
  Item, 
  Sale, 
  Customer, 
  Supplier, 
  Expense, 
  ProductionRecord 
} from "./types";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import AlishaLogo from "./components/AlishaLogo";
import MetricCard from "./components/MetricCard";
import SalesChart from "./components/SalesChart";
import ItemsManager from "./components/ItemsManager";
import SalesManager from "./components/SalesManager";
import ProductionCard from "./components/ProductionCard";
import BranchManager from "./components/BranchManager";
import AskFactoryAI from "./components/AskFactoryAI";
import IntegrationsView from "./components/IntegrationsView";
import StaffManager from "./components/StaffManager";
import StaffCard from "./components/StaffCard";
import ImportDataCard from "./components/ImportDataCard";
import { generateReportPDF, createReportPDF } from "./utils/pdfGenerator";
import { uploadPdfToDrive } from "./utils/googleDrive";

// Icons for metrics
import { 
  DollarSign, 
  AlertCircle, 
  ShoppingBag, 
  TrendingDown, 
  Archive, 
  Layers, 
  Users, 
  Truck,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Settings,
  Plus,
  Trash2,
  Calendar,
  Sparkles,
  CheckCircle,
  Building2,
  Lock,
  Factory,
  Edit,
  Check,
  X,
  ChevronDown
} from "lucide-react";

const DEFAULT_ITEM_TYPES = [
  { id: "type-default-1", name: "বোতল" },
  { id: "type-default-2", name: "প্রিফর্ম" },
  { id: "type-default-3", name: "হাতা" },
  { id: "type-default-4", name: "ক্যাপ" }
];

function normalizeItemType(type?: string): string {
  if (!type) return "বোতল";
  const t = type.trim().toLowerCase();
  if (t === "bottle" || t === "বোতল") return "বোতল";
  if (t === "preform" || t === "প্রিফর্ম") return "প্রিফর্ম";
  if (t === "sleeve" || t === "হাতা") return "হাতা";
  if (t === "cap" || t === "ক্যাপ") return "ক্যাপ";
  return type;
}

export default function App() {
  // Local UI fallback is used only until the authenticated server state is loaded.
  // Sensitive branch credentials are never persisted in browser storage.
  const [branches, setBranches] = useState<Branch[]>(() => initialBranches.map((b) => ({
    ...b,
    itemTypes: (b.itemTypes && b.itemTypes.length > 0) ? b.itemTypes : DEFAULT_ITEM_TYPES,
    items: (b.items || []).map(item => ({ ...item, type: normalizeItemType(item.type) }))
  })));

  const [activeBranchId, setActiveBranchId] = useState<string>(() => {
    const saved = localStorage.getItem("alisha_beverage_active_branch_id_v2");
    return saved && saved !== "undefined" ? saved : initialBranches[0]?.id || "br-1";
  });
  const [isInitializing, setIsInitializing] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const loadServerState = async () => {
    const response = await fetch('/api/state', { credentials: 'same-origin' });
    if (!response.ok) throw new Error(response.status === 401 ? 'Unauthorized' : 'Failed to load state');
    const data = await response.json();
    if (data?.branches) {
      const mappedBranches = (data.branches as Branch[]).map((b) => ({
        ...b,
        itemTypes: (b.itemTypes && b.itemTypes.length > 0) ? b.itemTypes : DEFAULT_ITEM_TYPES,
        items: (b.items || []).map(item => ({ ...item, type: normalizeItemType(item.type) }))
      }));
      setBranches(mappedBranches);
      if (data.activeBranchId && mappedBranches.some((b) => b.id === data.activeBranchId)) setActiveBranchId(data.activeBranchId);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const auth = await fetch('/api/auth/me', { credentials: 'same-origin' });
        if (auth.ok) {
          setIsAuthenticated(true);
          await loadServerState();
        }
      } catch (error) {
        console.error("Failed to initialize authenticated session", error);
      } finally {
        setIsInitializing(false);
      }
    };
    bootstrap();
  }, []);

  useEffect(() => {
    if (isInitializing || !isAuthenticated) return;
    const timeout = setTimeout(async () => {
      try {
        const response = await fetch('/api/state', {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ branches, activeBranchId }),
        });
        if (!response.ok) console.error("Failed to save state to server", response.status);
      } catch (error) {
        console.error("Failed to save state to server", error);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [branches, activeBranchId, isInitializing, isAuthenticated]);

  // Find currently active branch
  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Sidebar responsive drawer state
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);

  // Ask Factory AI drawer state
  const [aiDrawerOpen, setAiDrawerOpen] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const hasGreeted = sessionStorage.getItem("alisha_ai_greeted");
      return !hasGreeted; // Auto open if hasn't greeted today/session
    }
    return false;
  });

  // Dashboard widgets customization states
  const [dashboardWidgets, setDashboardWidgets] = useState<string[]>(() => {
    const saved = localStorage.getItem("alisha_dashboard_widget_order");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return ["metrics", "salesTrend", "itemList", "productionLogs", "staff"];
  });

  const [visibleWidgets, setVisibleWidgets] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("alisha_dashboard_widget_visibility");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      metrics: true,
      salesTrend: true,
      itemList: true,
      productionLogs: true,
      staff: true,
    };
  });

  const [showConfigPanel, setShowConfigPanel] = useState(false);

  // Dashboard item edit/delete states
  const [editingDashItemId, setEditingDashItemId] = useState<string | null>(null);
  const [editingDashItemName, setEditingDashItemName] = useState("");
  const [editingDashItemType, setEditingDashItemType] = useState("");
  const [editingDashItemCost, setEditingDashItemCost] = useState("");
  const [editingDashItemPrice, setEditingDashItemPrice] = useState("");
  const [editingDashItemStock, setEditingDashItemStock] = useState("");
  const [editingDashItemUnit, setEditingDashItemUnit] = useState("");
  const [deletingDashItemId, setDeletingDashItemId] = useState<string | null>(null);
  const [activeDashTypeEditId, setActiveDashTypeEditId] = useState<string | null>(null);
  const [inlineEditingNameId, setInlineEditingNameId] = useState<string | null>(null);
  const [inlineEditingNameVal, setInlineEditingNameVal] = useState("");

  // Form states for supplementary lists (Customers, Suppliers, Expenses)
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custDue, setCustDue] = useState("");
  const [custSales, setCustSales] = useState("");
  const [custSuccess, setCustSuccess] = useState("");

  const [supName, setSupName] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supOutstanding, setSupOutstanding] = useState("");
  const [supSuccess, setSupSuccess] = useState("");

  const [expCategory, setExpCategory] = useState("");
  const [expAmount, setExpAmount] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expDesc, setExpDesc] = useState("");
  const [expSuccess, setExpSuccess] = useState("");
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [expenseFilterCategory, setExpenseFilterCategory] = useState("");

  // --- SERVER-SIDE AUTHENTICATION ---
  const [loginUser, setLoginUser] = useState("");
  const [loginPass, setLoginPass] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginUser.trim(), password: loginPass }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Invalid email or password.');
      setIsAuthenticated(true);
      await loadServerState();
      setLoginUser("");
      setLoginPass("");
    } catch (error: any) {
      setLoginError(error.message || 'Unable to sign in.');
    }
  };

  const handleLogout = async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' }); }
    finally { setIsAuthenticated(false); }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetSuccess("");
    try {
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Password reset is not configured.');
      setResetSuccess('If the account is eligible, reset instructions will be sent by the configured email service.');
      setResetEmail("");
    } catch (error: any) {
      setResetSuccess(error.message || 'Password reset is not configured.');
    }
  };

  // --- CARD ENTRY DATA PDF DOWNLOADS ---
  const getReportDoc = (cardType: string) => {
    const brandColor = activeBranch.themeColor || "#D31D1D";
    
    if (cardType === "sales") {
      const headers = ["Date", "Product Sold", "Qty", "Total Amount"];
      const rows = activeBranch.salesList.map((s) => [
        s.date,
        s.itemName,
        `${s.quantity} pcs`,
        `${s.amount.toLocaleString()} BDT`
      ]);
      const summaries = [
        { label: "Total Sales Count", value: activeBranch.salesList.length.toString() },
        { label: "Gross Sales Revenue", value: `${activeBranch.sales.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Sales Transactions Log",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    } 
    else if (cardType === "customers" || cardType === "due") {
      const headers = ["Dealer Name", "Email Address", "Phone Number", "Pending Due"];
      const rows = activeBranch.customers.map((c) => [
        c.name,
        c.email,
        c.phone,
        `${c.due.toLocaleString()} BDT`
      ]);
      const summaries = [
        { label: "Registered Dealers", value: activeBranch.customers.length.toString() },
        { label: "Total Outstanding Due", value: `${activeBranch.due.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Retail Clients & Dues Ledger",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    } 
    else if (cardType === "suppliers" || cardType === "purchases") {
      const headers = ["Supplier Name", "Contact Email", "Phone", "Outstanding Payable"];
      const rows = activeBranch.suppliers.map((s) => [
        s.name,
        s.email,
        s.phone,
        `${s.outstanding.toLocaleString()} BDT`
      ]);
      const summaries = [
        { label: "Registered Vendors", value: activeBranch.suppliers.length.toString() },
        { label: "Total Payable", value: `${activeBranch.purchases.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Suppliers & Materials Outstanding",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    } 
    else if (cardType === "expenses") {
      const headers = ["Expense Type", "Date", "Description", "Amount"];
      const rows = activeBranch.expensesList.map((ex) => [
        ex.category,
        ex.date,
        ex.description,
        `${ex.amount.toLocaleString()} BDT`
      ]);
      const summaries = [
        { label: "Logged Expenses", value: activeBranch.expensesList.length.toString() },
        { label: "Total Expenses Sum", value: `${activeBranch.expenses.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Factory Operations Expenses Log",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    } 
    else if (cardType === "items" || cardType === "stock") {
      const headers = ["Product Name", "SKU Code", "Production Cost", "Sale Price", "Stock Level"];
      const rows = activeBranch.items.map((it) => [
        it.name,
        it.sku,
        `${it.cost.toLocaleString()} BDT`,
        `${it.price.toLocaleString()} BDT`,
        `${it.stock.toLocaleString()} ${it.unit}`
      ]);
      const summaries = [
        { label: "Unique Products", value: activeBranch.items.length.toString() },
        { label: "Aggregate Asset Valuation", value: `${activeBranch.stockValue.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Product Inventory & Valuation",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    } 
    else if (cardType === "production") {
      const headers = ["Item Name", "Production Date", "Direct Batch Cost"];
      const rows = activeBranch.production.map((p) => [
        p.itemName,
        p.date,
        `${p.productionCost.toLocaleString()} BDT`
      ]);
      const totalCost = activeBranch.production.reduce((sum, p) => sum + p.productionCost, 0);
      const summaries = [
        { label: "Production Batches", value: activeBranch.production.length.toString() },
        { label: "Total Production Cost", value: `${totalCost.toLocaleString()} BDT` }
      ];
      return createReportPDF(
        "Factory Production Run Logs",
        activeBranch.name,
        activeBranch.location,
        headers,
        rows,
        summaries,
        brandColor
      );
    }
  };


  const handleDownloadPDF = (cardType: string) => {
    const doc = getReportDoc(cardType);
    if (doc) {
      const filename = `${cardType}_export.pdf`;
      doc.save(filename);
    }
  };

  const [isUploadingDrive, setIsUploadingDrive] = useState<Record<string, boolean>>({});


  const handleUploadDrive = async (cardType: string) => {
    const doc = getReportDoc(cardType);
    if (!doc) return;
    
    setIsUploadingDrive(prev => ({ ...prev, [cardType]: true }));
    try {
      const blob = doc.output("blob");
      const filename = `${cardType}_export.pdf`;
      const link = await uploadPdfToDrive(blob, filename, "Alisha Factory Exports");
      alert(`Successfully uploaded to Google Drive!\nLink: ${link}`);
    } catch (error: any) {
      alert(`Drive upload failed: ${error.message}`);
    } finally {
      setIsUploadingDrive(prev => ({ ...prev, [cardType]: false }));
    }
  };

  // Persist active branch ID
  useEffect(() => {
    localStorage.setItem("alisha_beverage_active_branch_id_v2", activeBranchId);
  }, [activeBranchId]);

  // Persist dashboard layout states
  useEffect(() => {
    localStorage.setItem("alisha_dashboard_widget_order", JSON.stringify(dashboardWidgets));
  }, [dashboardWidgets]);

  useEffect(() => {
    localStorage.setItem("alisha_dashboard_widget_visibility", JSON.stringify(visibleWidgets));
  }, [visibleWidgets]);

  // Find currently active branch

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-500 font-medium">Loading Factory Data...</p>
        </div>
      </div>
    );
  }


  // Handler to switch branches
  const handleSwitchBranch = (id: string) => {
    setActiveBranchId(id);
  };

  // Handler to register a new branch
  const handleAddBranch = (name: string, location: string, logoUrl?: string, themeColor?: string) => {
    const newId = `br-${Date.now()}`;
    const newBranch: Branch = {
      id: newId,
      name,
      location,
      sales: 0,
      due: 0,
      purchases: 0,
      expenses: 0,
      stockValue: 0,
      items: [],
      customers: [],
      suppliers: [],
      production: [],
      salesData: [
        { date: "14 Jun", amount: 0 },
        { date: "18 Jun", amount: 0 },
        { date: "22 Jun", amount: 0 },
        { date: "26 Jun", amount: 0 },
        { date: "30 Jun", amount: 0 },
        { date: "03 Jul", amount: 0 },
        { date: "07 Jul", amount: 0 },
        { date: "11 Jul", amount: 0 },
        { date: "13 Jul", amount: 0 }
      ],
      expensesList: [],
      salesList: [],
      itemTypes: DEFAULT_ITEM_TYPES,
      logoUrl,
      themeColor: themeColor || "#D31D1D",
    };

    setBranches((prev) => [...prev, newBranch]);
    setActiveBranchId(newId);
  };

  const handleAddItemType = (name: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      const newType = { id: `type-${Date.now()}`, name };
      return { ...b, itemTypes: [...(b.itemTypes || []), newType] };
    }));
  };

  const handleEditItemType = (id: string, newName: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      return { ...b, itemTypes: (b.itemTypes || []).map(t => t.id === id ? { ...t, name: newName } : t) };
    }));
  };

  const handleUpdateBranchLocation = (newLocation: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      return { ...b, location: newLocation };
    }));
  };

  const handleDeleteItemType = (id: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      return { ...b, itemTypes: (b.itemTypes || []).filter(t => t.id !== id) };
    }));
  };

  const handleAddItemTypes = (types: string[]) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      
      const existingTypeNames = (b.itemTypes || []).map(t => t.name.toLowerCase());
      const newTypes = types
         .filter(t => !existingTypeNames.includes(t.toLowerCase()))
         .map(t => ({ id: `type-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name: t }));
         
      return { ...b, itemTypes: [...(b.itemTypes || []), ...newTypes] };
    }));
  };

  const handleEditItem = (id: string, updatedFields: Partial<Item>) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      const updatedItems = b.items.map(item => item.id === id ? { ...item, ...updatedFields } : item);
      const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
      return { ...b, items: updatedItems, stockValue: newStockValue };
    }));
  };

  const handleDeleteItem = (id: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id !== activeBranchId) return b;
      const updatedItems = b.items.filter(item => item.id !== id);
      const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
      return { ...b, items: updatedItems, stockValue: newStockValue };
    }));
  };

  // Handler to add stock item
  const handleAddItem = (
    name: string,
    sku?: string,
    price?: number,
    cost?: number,
    stock?: number,
    unit?: string,
    type?: string
  ) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const newItem: Item = {
          id: `it-${Date.now()}`,
          name,
          sku: sku || "",
          price: price || 0,
          cost: cost || 0,
          stock: stock || 0,
          unit: unit || "Pcs",
          type: normalizeItemType(type)
        };
        const updatedItems = [...b.items, newItem];
        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
        return {
          ...b,
          items: updatedItems,
          stockValue: newStockValue,
        };
      })
    );
  };

  // Handler to log item sale
  const handleAddSale = (
    itemName: string,
    quantity: number,
    price: number,
    date: string,
    customerName: string
  ) => {
    const saleAmount = quantity * price;
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;

        // Deduct item stock
        const updatedItems = b.items.map((item) => {
          if (item.name === itemName) {
            return { ...item, stock: Math.max(0, item.stock - quantity) };
          }
          return item;
        });

        // Insert sale list record
        const newSale: Sale = {
          id: `sa-${Date.now()}`,
          itemName,
          quantity,
          amount: saleAmount,
          date,
          customerName,
        };

        // Increment dynamic sales graph
        // Try parsing short date e.g. "03 Jul"
        const formattedDate = new Date(date);
        const day = String(formattedDate.getDate()).padStart(2, "0");
        const month = formattedDate.toLocaleString("en-US", { month: "short" });
        const dayMonthStr = `${day} ${month}`;

        let dateFound = false;
        const updatedSalesData = b.salesData.map((dp) => {
          if (dp.date === dayMonthStr) {
            dateFound = true;
            return { ...dp, amount: dp.amount + saleAmount };
          }
          return dp;
        });

        if (!dateFound) {
          updatedSalesData.push({ date: dayMonthStr, amount: saleAmount });
        }

        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);

        return {
          ...b,
          items: updatedItems,
          salesList: [...b.salesList, newSale],
          sales: b.sales + saleAmount,
          salesData: updatedSalesData,
          stockValue: newStockValue,
        };
      })
    );
  };

  const handleAddSales = (
    salesToAdd: { itemName: string; quantity: number; price: number; date: string; customerName: string }[]
  ) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        
        let updatedItems = [...b.items];
        let newSalesList = [...b.salesList];
        let totalNewSales = 0;
        let updatedSalesData = [...b.salesData];

        salesToAdd.forEach((sale, index) => {
          const saleAmount = sale.quantity * sale.price;
          totalNewSales += saleAmount;
          
          // Deduct item stock
          updatedItems = updatedItems.map((item) => {
            if (item.name === sale.itemName) {
              return { ...item, stock: Math.max(0, item.stock - sale.quantity) };
            }
            return item;
          });

          // Create sale record
          const newSale: Sale = {
            id: `sa-${Date.now()}-${index}`,
            itemName: sale.itemName,
            quantity: sale.quantity,
            amount: saleAmount,
            date: sale.date,
            customerName: sale.customerName || "Unknown",
          };
          newSalesList.push(newSale);

          // Update sales graph data
          const formattedDate = new Date(sale.date);
          const day = String(formattedDate.getDate()).padStart(2, "0");
          const month = formattedDate.toLocaleString("en-US", { month: "short" });
          const dayMonthStr = `${day} ${month}`;
          
          const dpIndex = updatedSalesData.findIndex(dp => dp.date === dayMonthStr);
          if (dpIndex >= 0) {
            updatedSalesData[dpIndex] = { ...updatedSalesData[dpIndex], amount: updatedSalesData[dpIndex].amount + saleAmount };
          } else {
            updatedSalesData.push({ date: dayMonthStr, amount: saleAmount });
          }
        });

        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);

        return {
          ...b,
          items: updatedItems,
          salesList: newSalesList,
          sales: b.sales + totalNewSales,
          salesData: updatedSalesData,
          stockValue: newStockValue,
        };
      })
    );
  };
  const handleAddItems = (itemsToAdd: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        
        let updatedItems = [...b.items];
        let updatedItemTypes = [...b.itemTypes];

        itemsToAdd.forEach(i => {
           const typeStr = normalizeItemType(i.type);
           if (typeStr !== "Uncategorized" && !updatedItemTypes.find(t => t.name === typeStr)) {
             updatedItemTypes.push({
               id: `typ-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
               name: typeStr,
             });
           }

           // Find existing item by SKU (if valid) or Name
           const existingIndex = updatedItems.findIndex(
              ex => (i.sku && ex.sku === i.sku) || (ex.name === i.name)
           );

           if (existingIndex >= 0) {
              // Update existing
              updatedItems[existingIndex] = {
                  ...updatedItems[existingIndex],
                  price: i.price !== undefined ? i.price : updatedItems[existingIndex].price,
                  cost: i.cost !== undefined ? i.cost : updatedItems[existingIndex].cost,
                  stock: i.stock !== undefined ? i.stock : updatedItems[existingIndex].stock,
                  unit: i.unit || updatedItems[existingIndex].unit,
                  type: normalizeItemType(i.type || updatedItems[existingIndex].type),
              };
           } else {
              // Add new
              updatedItems.push({
                  id: `it-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  name: i.name,
                  sku: i.sku || "",
                  price: i.price || 0,
                  cost: i.cost || 0,
                  stock: i.stock || 0,
                  unit: i.unit || "Pcs",
                  type: typeStr
              });
           }
        });

        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);
        return {
          ...b,
          items: updatedItems,
          itemTypes: updatedItemTypes,
          stockValue: newStockValue,
        };
      })
    );
  };

  // Handler to record item production
  const handleAddProduction = (itemName: string, cost: number, quantity: number, date: string) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;

        // Increment stock of item with matching name (if it exists)
        const updatedItems = b.items.map((item) => {
          if (item.name.toLowerCase() === itemName.toLowerCase()) {
            return { ...item, stock: item.stock + quantity };
          }
          return item;
        });

        const newProduction: ProductionRecord = {
          id: `pr-${Date.now()}`,
          itemName,
          productionCost: cost,
          quantity,
          date,
        };

        // Log corresponding automatic operational expense
        const newExpense: Expense = {
          id: `ex-auto-${Date.now()}`,
          category: "Production Material Cost",
          amount: cost,
          date,
          description: `Auto-logged material cost for baking/processing batch: ${itemName}`,
        };

        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);

        return {
          ...b,
          items: updatedItems,
          production: [...b.production, newProduction],
          expensesList: [...b.expensesList, newExpense],
          expenses: b.expenses + cost,
          stockValue: newStockValue,
        };
      })
    );
  };

  // Helper to add customers branch-specifically
  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) return;

    const dueVal = parseFloat(custDue) || 0;
    const saleVal = parseFloat(custSales) || 0;

    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const newCust: Customer = {
          id: `cu-${Date.now()}`,
          name: custName.trim(),
          email: custEmail.trim() || "no-email@alisha.com",
          phone: custPhone.trim() || "N/A",
          due: dueVal,
          totalSales: saleVal,
        };
        return {
          ...b,
          customers: [...b.customers, newCust],
          due: b.due + dueVal,
          sales: b.sales + saleVal,
        };
      })
    );

    setCustSuccess(`Client "${custName}" successfully added!`);
    setCustName("");
    setCustEmail("");
    setCustPhone("");
    setCustDue("");
    setCustSales("");
    setTimeout(() => setCustSuccess(""), 3000);
  };

  // Helper to add suppliers branch-specifically
  const handleAddSupplierSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;

    const outstandingVal = parseFloat(supOutstanding) || 0;

    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const newSup: Supplier = {
          id: `su-${Date.now()}`,
          name: supName.trim(),
          email: supEmail.trim() || "info@supplier.com",
          phone: supPhone.trim() || "N/A",
          outstanding: outstandingVal,
        };
        return {
          ...b,
          suppliers: [...b.suppliers, newSup],
          purchases: b.purchases + outstandingVal,
        };
      })
    );

    setSupSuccess(`Supplier "${supName}" successfully registered!`);
    setSupName("");
    setSupEmail("");
    setSupPhone("");
    setSupOutstanding("");
    setTimeout(() => setSupSuccess(""), 3000);
  };

  // Helper to add/edit manual expenses
  const handleAddExpenseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expCategory.trim()) return;

    const amountVal = parseFloat(expAmount) || 0;

    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        
        let newExpensesList;
        let newExpensesTotal;

        if (editingExpenseId) {
          const oldExp = b.expensesList.find(ex => ex.id === editingExpenseId);
          const oldAmount = oldExp ? oldExp.amount : 0;
          
          newExpensesList = b.expensesList.map(ex => 
            ex.id === editingExpenseId 
              ? { ...ex, category: expCategory.trim(), amount: amountVal, date: expDate, description: expDesc.trim() || "Administrative cost run" }
              : ex
          );
          newExpensesTotal = b.expenses - oldAmount + amountVal;
        } else {
          const newExp: Expense = {
            id: `ex-${Date.now()}`,
            category: expCategory.trim(),
            amount: amountVal,
            date: expDate,
            description: expDesc.trim() || "Administrative cost run",
          };
          newExpensesList = [...b.expensesList, newExp];
          newExpensesTotal = b.expenses + amountVal;
        }

        return {
          ...b,
          expensesList: newExpensesList,
          expenses: newExpensesTotal,
        };
      })
    );

    setExpSuccess(`Expense ${editingExpenseId ? 'updated' : 'logged'} successfully!`);
    setExpCategory("");
    setExpAmount("");
    setExpDesc("");
    setEditingExpenseId(null);
    setTimeout(() => setExpSuccess(""), 3000);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpenseId(expense.id);
    setExpCategory(expense.category);
    setExpAmount(expense.amount.toString());
    setExpDate(expense.date);
    setExpDesc(expense.description);
    // Scroll to form (optional)
  };

  const handleDeleteExpense = (expenseId: string) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const expToDelete = b.expensesList.find(e => e.id === expenseId);
        if (!expToDelete) return b;
        return {
          ...b,
          expensesList: b.expensesList.filter(e => e.id !== expenseId),
          expenses: b.expenses - expToDelete.amount,
        };
      })
    );
  };

  const handleAddCustomers = (customers: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const mapped = customers.map((c, i) => ({
          id: `cu-${Date.now()}-${i}`,
          name: c.name || "Unknown",
          email: c.email || "no-email@alisha.com",
          phone: c.phone || "N/A",
          due: Number(c.due) || 0,
          totalSales: Number(c.totalSales) || 0,
        }));
        return { ...b, customers: [...b.customers, ...mapped] };
      })
    );
  };

  const handleAddSuppliers = (suppliers: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        const mapped = suppliers.map((s, i) => ({
          id: `sup-${Date.now()}-${i}`,
          name: s.name || "Unknown",
          email: s.email || "no-email@alisha.com",
          phone: s.phone || "N/A",
          outstanding: Number(s.outstanding) || 0,
        }));
        return { ...b, suppliers: [...b.suppliers, ...mapped] };
      })
    );
  };

  const handleAddExpenses = (expenses: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        let total = 0;
        const mapped = expenses.map((e, i) => {
          const amt = Number(e.amount) || 0;
          total += amt;
          return {
            id: `ex-${Date.now()}-${i}`,
            category: e.category || "Unknown",
            amount: amt,
            date: e.date || new Date().toISOString().split('T')[0],
            description: e.description || "Imported expense",
          };
        });
        return { ...b, expensesList: [...b.expensesList, ...mapped], expenses: b.expenses + total };
      })
    );
  };

  const handleAddProductions = (productions: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== activeBranchId) return b;
        let totalCost = 0;
        
        let updatedItems = [...b.items];
        
        const mapped = productions.map((p, i) => {
          const cost = Number(p.cost) || 0;
          const qty = Number(p.quantity) || 0;
          totalCost += cost;
          
          updatedItems = updatedItems.map((item) => {
            if (item.name.toLowerCase() === (p.itemName || "").toLowerCase()) {
              return { ...item, stock: item.stock + qty };
            }
            return item;
          });

          return {
            id: `pr-${Date.now()}-${i}`,
            itemName: p.itemName || "Unknown",
            productionCost: cost,
            quantity: qty,
            date: p.date || new Date().toISOString().split('T')[0],
          };
        });
        
        const newStockValue = updatedItems.reduce((sum, item) => sum + item.stock * item.cost, 0);

        return { 
          ...b, 
          items: updatedItems,
          production: [...b.production, ...mapped],
          expensesList: [...b.expensesList, ...mapped.map(m => ({
            id: `ex-prod-${m.id}`,
            category: "Production Materials",
            amount: m.productionCost,
            date: m.date,
            description: `Batch run for ${m.itemName}`
          }))],
          expenses: b.expenses + totalCost,
          stockValue: newStockValue
        };
      })
    );
  };

  const handlePettyCashUpdate = (branchId: string, transactions: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;
        
        const newBalance = transactions.reduce((sum, t) => sum + (t.type === "credit" ? Number(t.amount) : -Number(t.amount)), 0);
        
        return {
          ...b,
          pettyCashBalance: newBalance,
          pettyCashTransactions: transactions,
        };
      })
    );
  };

  const handleAdvancesUpdate = (branchId: string, advances: any[]) => {
    setBranches((prev) =>
      prev.map((b) => {
        if (b.id !== branchId) return b;
        return {
          ...b,
          advances: advances,
        };
      })
    );
  };

  const handleUpdateStaff = (branchId: string, staff: any[]) => {
    setBranches((prev) => prev.map((b) => b.id === branchId ? { ...b, staff } : b));
  };
  const handleUpdateAttendance = (branchId: string, attendance: any[]) => {
    setBranches((prev) => prev.map((b) => b.id === branchId ? { ...b, attendance } : b));
  };
  const handleUpdatePayroll = (branchId: string, payroll: any[]) => {
    setBranches((prev) => prev.map((b) => b.id === branchId ? { ...b, payroll } : b));
  };
  const handleUpdateStaffTransactions = (branchId: string, staffTransactions: any[]) => {
    setBranches((prev) => prev.map((b) => b.id === branchId ? { ...b, staffTransactions } : b));
  };

  // Dashboard widget movement & rearrangement functions
  const moveWidget = (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= dashboardWidgets.length) return;

    const updated = [...dashboardWidgets];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setDashboardWidgets(updated);
  };

  const toggleWidgetVisibility = (widgetId: string) => {
    setVisibleWidgets((prev) => ({
      ...prev,
      [widgetId]: !prev[widgetId],
    }));
  };

  // Calculate dynamic active stock valuation
  const dynamicStockValuation = activeBranch.items.reduce((sum, item) => sum + item.stock * item.cost, 0);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
        <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
          <div className="mb-6 p-4 bg-white rounded-3xl shadow-xs border border-slate-100 flex justify-center">
            <AlishaLogo size="lg" />
          </div>
          <h2 className="text-center text-2xl font-black text-slate-900 uppercase tracking-widest">
            {activeBranch.name}
          </h2>
          <p className="mt-2 text-center text-xs text-slate-500 uppercase tracking-wider font-semibold">
            Administrative Login Panel
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
          <div className="bg-white py-8 px-6 shadow-xl rounded-3xl border border-slate-100 space-y-6">
            {!showForgotPassword ? (
              <>
                <form onSubmit={handleLoginSubmit} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      User ID / Email Address
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Users className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={loginUser}
                        onChange={(e) => setLoginUser(e.target.value)}
                        placeholder="admin@branch.com"
                        className="w-full text-sm border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Access Password
                      </label>
                      <button 
                        type="button" 
                        onClick={() => setShowForgotPassword(true)}
                        className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 uppercase tracking-wider"
                      >
                        Forgot Password?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type="password"
                        required
                        value={loginPass}
                        onChange={(e) => setLoginPass(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-sm border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {loginError && (
                    <div className="p-3 bg-rose-50 text-rose-700 text-xs font-medium rounded-xl border border-rose-100 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
                      <span>{loginError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Authorize & Connect</span>
                  </button>
                </form>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100/80">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> Secure server-side authentication
                  </p>
                  <p className="text-[11px] text-slate-600 mt-1">Use the administrator credentials configured in the server environment.</p>
                </div>
              </>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-5 animate-in fade-in duration-300">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800">Reset Password</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter your email address to receive a password reset link.</p>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Users className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="admin@branch.com"
                      className="w-full text-sm border border-slate-200 rounded-2xl pl-10 pr-3.5 py-3 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                    />
                  </div>
                </div>

                {resetSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-xl border border-emerald-100 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                    <span>{resetSuccess}</span>
                  </div>
                )}

                <div className="flex flex-col gap-3 mt-4">
                  <button
                    type="submit"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl transition-all shadow-xs cursor-pointer active:scale-[0.98] flex items-center justify-center gap-2"
                  >
                    <span>Send Reset Link</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(false)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs uppercase tracking-widest py-3.5 px-4 rounded-2xl transition-all cursor-pointer"
                  >
                    Back to Login
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="application-container" className="flex h-screen bg-[#F4F7F6] text-slate-800 font-sans overflow-hidden">
      
      {/* Sidebar navigation system drawer */}
      <Sidebar 
        activeTab={activeTab} 
        onChangeTab={setActiveTab} 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        onOpenAddBranch={() => {
          setActiveTab("branches");
          setSidebarOpen(false);
        }}
        activeBranch={activeBranch}
        onUpdatePettyCash={handlePettyCashUpdate}
        onUpdateAdvances={handleAdvancesUpdate}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        
        {/* Main application Header with centered Alisha Food & Beverage Logo */}
        <Header 
          branches={branches}
          activeBranchId={activeBranchId}
          onSwitchBranch={handleSwitchBranch}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onOpenAddBranchModal={() => setActiveTab("branches")}
          onLogout={handleLogout}
        />

        {/* Scrollable workspace layout viewport */}
        <main id="main-workspace-viewport" className="relative flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          
          {/* Lightly visible company logo background watermark at the middle of full start page */}
          {activeTab === "dashboard" && (
            <div id="start-page-watermark" className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 overflow-hidden mix-blend-multiply opacity-10">
              <div className="scale-[4] select-none">
                <AlishaLogo />
              </div>
            </div>
          )}
          
          {/* VIEW 1: DYNAMIC CUSTOMIZABLE DASHBOARD */}
          {activeTab === "dashboard" && (
            <div id="tab-dashboard-view" className="space-y-6 animate-in fade-in duration-300">
              
              {/* Customizable Dashboard Header Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white px-5 py-4 rounded-2xl border border-slate-100/80 gap-3">
                <div>
                  <h1 className="text-base font-extrabold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4.5 h-4.5 text-emerald-500" />
                    Interactive Dashboard
                  </h1>
                  <p className="text-xs text-slate-400 mt-1">
                    Manage sales statistics, inventory value and production lists for <span className="text-emerald-600 font-bold">{activeBranch.name}</span>
                  </p>
                </div>

                <div className="relative">
                  <button
                    onClick={() => setShowConfigPanel(!showConfigPanel)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200/80 rounded-xl text-xs font-bold uppercase tracking-wider text-slate-700 transition-all cursor-pointer active:scale-[0.98]"
                  >
                    <Settings className={`w-4 h-4 text-slate-500 transition-transform ${showConfigPanel ? "rotate-90" : ""}`} />
                    Customize Layout
                  </button>

                  {showConfigPanel && (
                    <div className="absolute right-0 mt-2.5 w-76 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-30 animate-in fade-in slide-in-from-top-1">
                      <div className="border-b border-slate-100 pb-2 mb-3">
                        <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">Dashboard Customizer</h4>
                        <p className="text-[10px] text-slate-400">Rearrange cards & control visual visibility</p>
                      </div>

                      <div className="space-y-2.5">
                        {dashboardWidgets.map((wid, idx) => {
                          const labels: Record<string, string> = {
                            metrics: "1. Information Metric Cards",
                            salesTrend: "2. Sales Daily Trend Graph",
                            itemList: "3. Factory Product Directory",
                            productionLogs: "4. Finished Production Logs",
                          };
                          return (
                            <div key={wid} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100">
                              <span className="text-[11px] font-bold text-slate-600 truncate mr-2">
                                {labels[wid]}
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => toggleWidgetVisibility(wid)}
                                  className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200/60 transition-colors"
                                  title={visibleWidgets[wid] ? "Hide widget" : "Show widget"}
                                >
                                  {visibleWidgets[wid] ? (
                                    <Eye className="w-3.5 h-3.5 text-emerald-600" />
                                  ) : (
                                    <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === 0}
                                  onClick={() => moveWidget(idx, "up")}
                                  className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200/60 disabled:opacity-30 transition-colors"
                                  title="Move Up"
                                >
                                  <ArrowUp className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                                <button
                                  type="button"
                                  disabled={idx === dashboardWidgets.length - 1}
                                  onClick={() => moveWidget(idx, "down")}
                                  className="p-1 hover:bg-white rounded border border-transparent hover:border-slate-200/60 disabled:opacity-30 transition-colors"
                                  title="Move Down"
                                >
                                  <ArrowDown className="w-3.5 h-3.5 text-slate-500" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      
                      <div className="mt-4 pt-2.5 border-t border-slate-100 text-center">
                        <button
                          onClick={() => setShowConfigPanel(false)}
                          className="text-[10px] text-emerald-600 font-extrabold uppercase tracking-widest hover:text-emerald-700"
                        >
                          Close Panel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Prominent Ask Factory AI Welcome & Shortcut Card */}
              <div id="dashboard-ai-intro-card" className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 rounded-2xl p-5 text-white border border-slate-800 shadow-sm relative overflow-hidden z-10">
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                  <Sparkles className="w-40 h-40 text-emerald-400" />
                </div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-2 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-widest">
                      <Sparkles className="w-3.5 h-3.5" />
                      Empowered by Gemini AI
                    </div>
                    <h2 className="text-lg font-black tracking-wide uppercase">Ask Alisha Factory AI Co-Pilot</h2>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Interact with our smart factory intelligence engine. Query current inventory value, stock levels, dealer dues, vendor outstanding accounts, and sales analytics instantly.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2.5 shrink-0">
                    <button
                      onClick={() => {
                        setAiDrawerOpen(true);
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs uppercase tracking-widest py-3 px-5 rounded-xl transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4.5 h-4.5" />
                      <span>Start Chat</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        setAiDrawerOpen(true);
                      }}
                      className="bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-extrabold text-xs uppercase tracking-widest py-3 px-5 rounded-xl transition-all cursor-pointer active:scale-95"
                    >
                      Quick Diagnosis
                    </button>
                  </div>
                </div>
              </div>

              {/* Render orderable customizable widgets list */}
              <div className="space-y-6">
                {dashboardWidgets.map((widgetId) => {
                  if (!visibleWidgets[widgetId]) return null;

                  if (widgetId === "metrics") {
                    return (
                      <div key="metrics" className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                        <MetricCard id="sales" label="Gross Revenue" value={activeBranch.sales} icon={<DollarSign className="w-5 h-5" />} isCurrency />
                        <MetricCard id="due" label="Outstanding Due" value={activeBranch.due} icon={<AlertCircle className="w-5 h-5 text-rose-500" />} isCurrency />
                        <MetricCard id="purchases" label="Raw Material Purchases" value={activeBranch.purchases} icon={<ShoppingBag className="w-5 h-5" />} isCurrency />
                        <MetricCard id="expenses" label="Total Expenses" value={activeBranch.expenses} icon={<TrendingDown className="w-5 h-5 text-orange-500" />} isCurrency />
                        <MetricCard id="stock" label="Current Stock Value" value={dynamicStockValuation} icon={<Archive className="w-5 h-5" />} isCurrency />
                        <MetricCard id="items" label="Active Product Range" value={`${activeBranch.items.length} SKUs`} icon={<Layers className="w-5 h-5" />} />
                        <MetricCard id="customers" label="Registered Clients" value={`${activeBranch.customers.length} Accounts`} icon={<Users className="w-5 h-5" />} />
                        <MetricCard id="suppliers" label="Active Suppliers" value={`${activeBranch.suppliers.length} Partners`} icon={<Truck className="w-5 h-5" />} />
                      </div>
                    );
                  }

                  if (widgetId === "salesTrend") {
                    return (
                      <div key="salesTrend" className="animate-in fade-in duration-200">
                        <SalesChart data={activeBranch.salesData} />
                      </div>
                    );
                  }

                  if (widgetId === "itemList") {
                    return (
                      <div key="itemList" className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-4 gap-2">
                          <div>
                            <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                              <Archive className="w-4.5 h-4.5 text-emerald-600" />
                              Factory Products Summary
                            </h3>
                            <p className="text-[11px] text-slate-400 mt-0.5">Quick lookup of items in active production line</p>
                          </div>
                          <button
                            onClick={() => setActiveTab("items")}
                            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100/70 px-3 py-1.5 rounded-xl transition-all self-start sm:self-auto cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Manage Full Inventory
                          </button>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-slate-100">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-extrabold text-slate-500 uppercase tracking-widest">
                                <th className="px-4 py-3">Product Name (আইটেমের নাম)</th>
                                <th className="px-4 py-3">Type (টাইপ)</th>
                                <th className="px-4 py-3 text-right">Buy/Production Cost (ক্রয়/উৎপাদন মূল্য)</th>
                                <th className="px-4 py-3 text-right">Available Stock (মজুদ পরিমাণ)</th>
                                <th className="px-4 py-3 text-center">Actions (অ্যাকশন)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                              {activeBranch.items.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                                    No items registered in active branch. Go to Items List tab to add products.
                                  </td>
                                </tr>
                              ) : (
                                activeBranch.items.map((item) => (
                                  <tr key={item.id} className="hover:bg-slate-50/30 transition-colors">
                                    {/* Product Name Column with Inline Edit option */}
                                    <td className="px-4 py-3 font-medium text-slate-800">
                                      {inlineEditingNameId === item.id ? (
                                        <div className="flex items-center gap-2 max-w-xs">
                                          <input
                                            type="text"
                                            value={inlineEditingNameVal}
                                            onChange={(e) => setInlineEditingNameVal(e.target.value)}
                                            className="text-xs border border-slate-200 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-full font-bold"
                                            autoFocus
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") {
                                                if (inlineEditingNameVal.trim()) {
                                                  handleEditItem(item.id, { name: inlineEditingNameVal.trim() });
                                                  setInlineEditingNameId(null);
                                                }
                                              } else if (e.key === "Escape") {
                                                setInlineEditingNameId(null);
                                              }
                                            }}
                                          />
                                          <button
                                            onClick={() => {
                                              if (inlineEditingNameVal.trim()) {
                                                handleEditItem(item.id, { name: inlineEditingNameVal.trim() });
                                                setInlineEditingNameId(null);
                                              }
                                            }}
                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                                            title="Save (সংরক্ষণ করুন)"
                                          >
                                            <Check className="w-3.5 h-3.5" />
                                          </button>
                                          <button
                                            onClick={() => setInlineEditingNameId(null)}
                                            className="p-1 text-slate-400 hover:bg-slate-50 rounded"
                                            title="Cancel (বাতিল)"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-1.5 group">
                                          <span className="font-bold text-slate-800">{item.name}</span>
                                          <button
                                            onClick={() => {
                                              setInlineEditingNameId(item.id);
                                              setInlineEditingNameVal(item.name);
                                            }}
                                            className="opacity-60 group-hover:opacity-100 transition-opacity p-0.5 hover:bg-slate-100 rounded text-slate-400 hover:text-blue-500 cursor-pointer"
                                            title="Edit Name (নাম সংশোধন করুন)"
                                          >
                                            <Edit className="w-3 h-3" />
                                          </button>
                                        </div>
                                      )}
                                    </td>

                                    {/* Type Column - clicking on it allows correcting type */}
                                    <td className="px-4 py-3">
                                      {activeDashTypeEditId === item.id ? (
                                        <div className="flex items-center gap-1">
                                          <select
                                            value={item.type || ""}
                                            onChange={(e) => {
                                              handleEditItem(item.id, { type: e.target.value });
                                              setActiveDashTypeEditId(null);
                                            }}
                                            onBlur={() => setActiveDashTypeEditId(null)}
                                            className="text-xs border border-slate-200 rounded px-2 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                                            autoFocus
                                          >
                                            <option value="">Select Type</option>
                                            {((activeBranch.itemTypes && activeBranch.itemTypes.length > 0) ? activeBranch.itemTypes : DEFAULT_ITEM_TYPES).map((t) => (
                                              <option key={t.id} value={t.name}>{t.name}</option>
                                            ))}
                                          </select>
                                          <button
                                            onClick={() => setActiveDashTypeEditId(null)}
                                            className="p-1 text-slate-400 hover:text-slate-600"
                                          >
                                            <X className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          onClick={() => setActiveDashTypeEditId(item.id)}
                                          title="Click to edit type (টাইপ সংশোধন করতে ক্লিক করুন)"
                                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-[10px] font-bold border border-blue-100 transition-colors flex items-center gap-1 cursor-pointer"
                                        >
                                          {item.type || "N/A"}
                                          <ChevronDown className="w-2.5 h-2.5 text-blue-400" />
                                        </button>
                                      )}
                                    </td>

                                    {/* Buy/Production Cost Column */}
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-600">
                                      {item.cost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ৳
                                    </td>

                                    {/* Available Stock Column */}
                                    <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">
                                      {item.stock.toLocaleString()} {item.unit || "Pcs"}
                                    </td>

                                    {/* Edit and Delete Actions Columns */}
                                    <td className="px-4 py-3 text-center">
                                      <div className="flex items-center justify-center gap-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingDashItemId(item.id);
                                            setEditingDashItemName(item.name);
                                            setEditingDashItemType(item.type || "");
                                            setEditingDashItemCost(item.cost.toString());
                                            setEditingDashItemPrice(item.price.toString());
                                            setEditingDashItemStock(item.stock.toString());
                                            setEditingDashItemUnit(item.unit || "Pcs");
                                          }}
                                          className="p-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer"
                                          title="Edit Item (পণ্য সংশোধন করুন)"
                                        >
                                          <Edit className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setDeletingDashItemId(item.id);
                                          }}
                                          className="p-1.5 text-rose-600 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors cursor-pointer"
                                          title="Delete Item (পণ্য মুছে ফেলুন)"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>

                        {/* Edit Item Modal */}
                        {editingDashItemId && (
                          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 overflow-hidden">
                              <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
                                <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">
                                  Edit Product (পণ্য সংশোধন করুন)
                                </h3>
                                <button 
                                  onClick={() => setEditingDashItemId(null)}
                                  className="text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                  ✕
                                </button>
                              </div>
                              
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Item Name (আইটেমের নাম) <span className="text-red-500">*</span>
                                  </label>
                                  <input 
                                    type="text" 
                                    value={editingDashItemName} 
                                    onChange={e => setEditingDashItemName(e.target.value)}
                                    placeholder="e.g. 250ml Bottle"
                                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    required
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Type (আইটেমের ধরন)
                                    </label>
                                    <select 
                                      value={editingDashItemType} 
                                      onChange={e => setEditingDashItemType(e.target.value)}
                                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">Select Type</option>
                                      {((activeBranch.itemTypes && activeBranch.itemTypes.length > 0) ? activeBranch.itemTypes : DEFAULT_ITEM_TYPES).map(t => (
                                        <option key={t.id} value={t.name}>{t.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Unit (ইউনিট)
                                    </label>
                                    <input 
                                      type="text" 
                                      value={editingDashItemUnit} 
                                      onChange={e => setEditingDashItemUnit(e.target.value)}
                                      placeholder="Pcs, Box, Kg, Ltr"
                                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Buy/Production Price (ক্রয় মূল্য ৳)
                                    </label>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      min="0"
                                      value={editingDashItemCost} 
                                      onChange={e => setEditingDashItemCost(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                      Sale Price (বিক্রয় মূল্য ৳)
                                    </label>
                                    <input 
                                      type="number" 
                                      step="0.01"
                                      min="0"
                                      value={editingDashItemPrice} 
                                      onChange={e => setEditingDashItemPrice(e.target.value)}
                                      placeholder="0.00"
                                      className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                                    Quantity (পরিমাণ)
                                  </label>
                                  <input 
                                    type="number" 
                                    min="0"
                                    value={editingDashItemStock} 
                                    onChange={e => setEditingDashItemStock(e.target.value)}
                                    placeholder="0"
                                    className="w-full text-xs border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                                  />
                                </div>
                              </div>

                              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100 mt-5">
                                <button 
                                  onClick={() => setEditingDashItemId(null)} 
                                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                  Cancel (বাতিল)
                                </button>
                                <button 
                                  onClick={() => {
                                    if (editingDashItemName.trim()) {
                                      handleEditItem(editingDashItemId, { 
                                        name: editingDashItemName.trim(),
                                        type: editingDashItemType,
                                        cost: parseFloat(editingDashItemCost) || 0,
                                        price: parseFloat(editingDashItemPrice) || 0,
                                        stock: parseInt(editingDashItemStock) || 0,
                                        unit: editingDashItemUnit.trim()
                                      });
                                      setEditingDashItemId(null);
                                    }
                                  }} 
                                  disabled={!editingDashItemName.trim()}
                                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                                >
                                  Save Changes (সংরক্ষণ করুন)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Delete Confirmation Modal */}
                        {deletingDashItemId && (
                          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                            <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 overflow-hidden">
                              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider mb-2">
                                Delete Product? (পণ্য মুছে ফেলবেন?)
                              </h3>
                              <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                                Are you sure you want to delete this product? This action is permanent and cannot be undone.
                                <br />
                                (আপনি কি নিশ্চিত যে আপনি এই পণ্যটি ডিলিট করতে চান? এটি চিরতরে মুছে যাবে।)
                              </p>
                              <div className="flex justify-end gap-2">
                                <button 
                                  onClick={() => setDeletingDashItemId(null)} 
                                  className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors"
                                >
                                  Cancel (বাতিল)
                                </button>
                                <button 
                                  onClick={() => {
                                    handleDeleteItem(deletingDashItemId);
                                    setDeletingDashItemId(null);
                                  }} 
                                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 rounded-xl hover:bg-rose-700 transition-colors"
                                >
                                  Delete (মুছে ফেলুন)
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (widgetId === "productionLogs") {
                    return (
                      <div key="productionLogs" className="animate-in fade-in duration-200">
                        {/* Beautiful Production card section appearing strictly after the item list cards as configured */}
                        <ProductionCard 
                          productionLogs={activeBranch.production}
                          itemsList={activeBranch.items}
                          onAddProduction={handleAddProduction}
                          onDownloadPDF={() => handleDownloadPDF("production")}
                          onUploadDrive={() => handleUploadDrive("production")}
                          isUploadingDrive={isUploadingDrive["production"]}
                        />
                      </div>
                    );
                  }

                  if (widgetId === "staff") {
                    return (
                      <div key="staff" className="animate-in fade-in duration-200">
                        <StaffCard branchName={activeBranch.name} />
                      </div>
                    );
                  }

                  return null;
                })}
              </div>
            </div>
          )}

          {/* VIEW 2: SALES MANAGEMENT VIEW */}
          {activeTab === "sales" && (
            <div id="tab-sales-view" className="animate-in fade-in duration-300">
              <SalesManager 
                sales={activeBranch.salesList}
                itemsList={activeBranch.items}
                branchName={activeBranch.name}
                location={activeBranch.location}
                onAddSale={handleAddSale}
                onDownloadPDF={() => handleDownloadPDF("sales")}
              />
            </div>
          )}

          {/* VIEW 3: ITEMS MANAGEMENT VIEW */}
          {activeTab === "items" && (
            <div id="tab-items-view" className="animate-in fade-in duration-300">
              <ItemsManager 
                items={activeBranch.items}
                itemTypes={(activeBranch.itemTypes && activeBranch.itemTypes.length > 0) ? activeBranch.itemTypes : DEFAULT_ITEM_TYPES}
                onAddItem={handleAddItem}
                onAddItems={handleAddItems}
                onEditItem={handleEditItem}
                onDeleteItem={handleDeleteItem}
                onAddItemType={handleAddItemType}
                onAddItemTypes={handleAddItemTypes}
                onEditItemType={handleEditItemType}
                onDeleteItemType={handleDeleteItemType}
                onDownloadPDF={() => handleDownloadPDF("items")}
                onUploadDrive={() => handleUploadDrive("items")}
                isUploadingDrive={isUploadingDrive["items"]}
              />
            </div>
          )}

          {/* VIEW 4: CUSTOMERS MANAGEMENT VIEW */}
          {activeTab === "customers" && (
            <div id="tab-customers-view" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shrink-0">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Registered Clients</h2>
                    <p className="text-xs text-slate-400">Manage client corporate accounts and sales ledger balances</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadPDF("customers")}
                >
                  Download PDF Report
                </button>
                <button
                  onClick={() => handleUploadDrive("customers")}
                  disabled={isUploadingDrive["customers"]}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isUploadingDrive["customers"] ? "Uploading..." : "Upload to Drive"}
                </button>
              </div>

              <ImportDataCard entityType="customers" onImportData={handleAddCustomers} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Register Client</h3>
                  </div>

                  <form onSubmit={handleAddCustomerSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Client / Outlet Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., Shwapno Superstore"
                        value={custName}
                        onChange={(e) => setCustName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Email Address</label>
                      <input
                        type="email"
                        placeholder="e.g., purchase@shwapno.com"
                        value={custEmail}
                        onChange={(e) => setCustEmail(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Number</label>
                      <input
                        type="text"
                        placeholder="e.g., 01711223344"
                        value={custPhone}
                        onChange={(e) => setCustPhone(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Initial Due (৳)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={custDue}
                          onChange={(e) => setCustDue(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Sales Ledger (৳)</label>
                        <input
                          type="number"
                          placeholder="0"
                          value={custSales}
                          onChange={(e) => setCustSales(e.target.value)}
                          className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    {custSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100">
                        {custSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      Add Client Account
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-5 py-3.5">Client Outlet</th>
                        <th className="px-5 py-3.5">Phone Contact</th>
                        <th className="px-5 py-3.5 text-right">Outstanding Due</th>
                        <th className="px-5 py-3.5 text-right">Total Purchase Ledger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                      {activeBranch.customers.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                            No clients registered. Register your first customer account in left panel.
                          </td>
                        </tr>
                      ) : (
                        activeBranch.customers.map((c) => (
                          <tr key={c.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-extrabold text-slate-800">{c.name}</div>
                              <div className="text-[10px] text-slate-400 lowercase">{c.email}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-500">{c.phone}</td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                              {c.due.toLocaleString()} ৳
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-800">
                              {c.totalSales.toLocaleString()} ৳
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 5: SUPPLIERS MANAGEMENT VIEW */}
          {activeTab === "suppliers" && (
            <div id="tab-suppliers-view" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shrink-0">
                    <Truck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Active Suppliers</h2>
                    <p className="text-xs text-slate-400">Manage feedstock providers, plastic suppliers and flavor outstanding debts</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadPDF("suppliers")}
                >
                  Download PDF Report
                </button>
                <button
                  onClick={() => handleUploadDrive("suppliers")}
                  disabled={isUploadingDrive["suppliers"]}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isUploadingDrive["suppliers"] ? "Uploading..." : "Upload to Drive"}
                </button>
              </div>

              <ImportDataCard entityType="suppliers" onImportData={handleAddSuppliers} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Add Supplier</h3>
                  </div>

                  <form onSubmit={handleAddSupplierSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Company Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g., National Sugar Mills"
                        value={supName}
                        onChange={(e) => setSupName(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Business Email</label>
                      <input
                        type="email"
                        placeholder="e.g., sales@sugar.com"
                        value={supEmail}
                        onChange={(e) => setSupEmail(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Phone Contact</label>
                      <input
                        type="text"
                        placeholder="e.g., 01888223311"
                        value={supPhone}
                        onChange={(e) => setSupPhone(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Purchases Outstanding Debt (৳)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={supOutstanding}
                        onChange={(e) => setSupOutstanding(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>

                    {supSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100">
                        {supSuccess}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer"
                    >
                      Register Supplier
                    </button>
                  </form>
                </div>

                <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-5 py-3.5">Supplier Brand</th>
                        <th className="px-5 py-3.5">Business Phone</th>
                        <th className="px-5 py-3.5 text-right">Outstanding Balance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                      {activeBranch.suppliers.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="px-5 py-12 text-center text-slate-400">
                            No suppliers registered for this factory.
                          </td>
                        </tr>
                      ) : (
                        activeBranch.suppliers.map((s) => (
                          <tr key={s.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-extrabold text-slate-800">{s.name}</div>
                              <div className="text-[10px] text-slate-400 lowercase">{s.email}</div>
                            </td>
                            <td className="px-5 py-3.5 font-mono text-slate-500">{s.phone}</td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-600">
                              {s.outstanding.toLocaleString()} ৳
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 6: EXPENSES LIST VIEW */}
          {activeTab === "expenses" && (
            <div id="tab-expenses-view" className="space-y-6 animate-in fade-in duration-300">
              <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50 shrink-0">
                    <TrendingDown className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Administrative Expenses</h2>
                    <p className="text-xs text-slate-400">Track raw factory running costs, staff payments and electricity bills</p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownloadPDF("expenses")}
                >
                  Download PDF Report
                </button>
                <button
                  onClick={() => handleUploadDrive("expenses")}
                  disabled={isUploadingDrive["expenses"]}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
                >
                  {isUploadingDrive["expenses"] ? "Uploading..." : "Upload to Drive"}
                </button>
              </div>

              <ImportDataCard entityType="expenses" onImportData={handleAddExpenses} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
                  <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                    <Plus className="w-4 h-4 text-emerald-600" />
                    <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-widest">Log Expense</h3>
                  </div>

                  <form onSubmit={handleAddExpenseSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
                      <input
                        type="text"
                        required
                        list="expenseCategories"
                        placeholder="e.g., Electric Bill"
                        value={expCategory}
                        onChange={(e) => setExpCategory(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                      <datalist id="expenseCategories">
                        <option value="Production Expense" />
                        <option value="Purchase Expense" />
                        <option value="Electric Power" />
                        <option value="Fuel / Transport" />
                        <option value="Labor / Wages" />
                        <option value="Other Expense" />
                      </datalist>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Amount in Taka (৳)</label>
                      <input
                        type="number"
                        required
                        placeholder="e.g., 4500"
                        value={expAmount}
                        onChange={(e) => setExpAmount(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Expense Date</label>
                      <input
                        type="date"
                        required
                        value={expDate}
                        onChange={(e) => setExpDate(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Description / Notes</label>
                      <textarea
                        placeholder="Details of expense allocation"
                        value={expDesc}
                        onChange={(e) => setExpDesc(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 h-20 resize-none"
                      />
                    </div>

                    {expSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-xl border border-emerald-100">
                        {expSuccess}
                      </div>
                    )}

                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all cursor-pointer"
                      >
                        {editingExpenseId ? "Update Expense" : "Record Expense"}
                      </button>
                      {editingExpenseId && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpenseId(null);
                            setExpCategory("");
                            setExpAmount("");
                            setExpDesc("");
                          }}
                          className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Expense Logs</h3>
                    <select
                      value={expenseFilterCategory}
                      onChange={(e) => setExpenseFilterCategory(e.target.value)}
                      className="text-xs border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-800 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value="">All Categories</option>
                      {Array.from(new Set(activeBranch.expensesList.map(e => e.category))).sort().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
                    <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <th className="px-5 py-3.5">Category & Details</th>
                        <th className="px-5 py-3.5 text-right">Cost Value</th>
                        <th className="px-5 py-3.5 text-right">Posting Date</th>
                        <th className="px-5 py-3.5 text-right w-24">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-xs text-slate-700 font-medium">
                      {(() => {
                        const filteredExpenses = expenseFilterCategory 
                          ? activeBranch.expensesList.filter(e => e.category === expenseFilterCategory)
                          : activeBranch.expensesList;
                        
                        if (filteredExpenses.length === 0) {
                          return (
                            <tr>
                              <td colSpan={4} className="px-5 py-12 text-center text-slate-400">
                                {expenseFilterCategory ? "No expenses found for this category." : "No administrative expenses logged yet."}
                              </td>
                            </tr>
                          );
                        }
                        
                        return [...filteredExpenses].reverse().map((e) => (
                          <tr key={e.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="px-5 py-3.5">
                              <div className="font-extrabold text-slate-800">{e.category}</div>
                              <div className="text-[10px] text-slate-400 leading-relaxed font-normal">{e.description}</div>
                            </td>
                            <td className="px-5 py-3.5 text-right font-mono font-bold text-rose-500">
                              {e.amount.toLocaleString()} ৳
                            </td>
                            <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                              {new Date(e.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => handleEditExpense(e)}
                                  className="text-slate-400 hover:text-blue-600 transition-colors p-1"
                                  title="Edit"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteExpense(e.id)}
                                  className="text-slate-400 hover:text-red-600 transition-colors p-1"
                                  title="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ));
                      })()}
                    </tbody>
                    <tfoot className="bg-slate-50 font-bold text-slate-800">
                      <tr>
                        <td className="px-5 py-3.5 text-right" colSpan={1}>Total:</td>
                        <td className="px-5 py-3.5 text-right font-mono text-rose-600">
                          {(() => {
                            const filteredExpenses = expenseFilterCategory 
                              ? activeBranch.expensesList.filter(e => e.category === expenseFilterCategory)
                              : activeBranch.expensesList;
                            return filteredExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString();
                          })()} ৳
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
              </div>
            </div>
          )}

          {/* VIEW 7: MULTI-BRANCH REGISTRY VIEW */}
          {activeTab === "branches" && (
            <div id="tab-branches-view" className="animate-in fade-in duration-300">
              <BranchManager 
                branches={branches}
                activeBranchId={activeBranchId}
                onSwitchBranch={handleSwitchBranch}
                onAddBranch={handleAddBranch}
              />
            </div>
          )}

          {/* VIEW 8: FINISHED PRODUCTION LOGS TAB */}
          {activeTab === "production" && (
            <div id="tab-production-view" className="animate-in fade-in duration-300">
              <ProductionCard 
                productionLogs={activeBranch.production}
                itemsList={activeBranch.items}
                onAddProduction={handleAddProduction}
                onAddProductions={handleAddProductions}
                onDownloadPDF={() => handleDownloadPDF("production")}
              />
            </div>
          )}

          {activeTab === "staff" && (
            <div id="tab-staff-view" className="animate-in fade-in duration-300">
              <StaffManager 
                activeBranch={activeBranch} 
                onUpdateStaff={(staff) => handleUpdateStaff(activeBranch.id, staff)} 
                onUpdateAttendance={(att) => handleUpdateAttendance(activeBranch.id, att)} 
                onUpdatePayroll={(pay) => handleUpdatePayroll(activeBranch.id, pay)} 
                onUpdateStaffTransactions={(tx) => handleUpdateStaffTransactions(activeBranch.id, tx)} 
              />
            </div>
          )}

          {/* VIEW 9: INTEGRATIONS & MAPS */}
          {activeTab === "integrations" && (
            <div id="tab-integrations-view" className="animate-in fade-in duration-300">
              <IntegrationsView 
                activeBranch={activeBranch} 
                onUpdateBranchLocation={handleUpdateBranchLocation}
              />
            </div>
          )}

        </main>
      </div>

      {/* Floating Ask Factory AI Button */}
      {activeTab === "dashboard" && (
        <button
          id="floating-ai-toggle"
          onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
          className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all cursor-pointer flex items-center justify-center group active:scale-95 border border-emerald-500/10"
          title="Ask Factory AI"
        >
          <Sparkles className="w-5.5 h-5.5 animate-pulse text-white group-hover:rotate-12 transition-transform" />
          <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out font-black text-xs uppercase tracking-wider ml-0 group-hover:ml-2">
            Ask AI
          </span>
        </button>
      )}

      {/* Floating Ask Factory AI Drawer Overlay */}
      {activeTab === "dashboard" && aiDrawerOpen && (
        <>
          <div
            id="ai-drawer-backdrop"
            className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-40 animate-in fade-in duration-200"
            onClick={() => setAiDrawerOpen(false)}
          />
          <div
            id="ai-drawer-container"
            className="fixed right-0 top-0 bottom-0 w-full sm:w-96 bg-white z-50 shadow-2xl border-l border-slate-100 flex flex-col h-full animate-in slide-in-from-right duration-300"
          >
            <AskFactoryAI 
              activeBranch={activeBranch} 
              isFloating={true} 
              onClose={() => setAiDrawerOpen(false)} 
            />
          </div>
        </>
      )}

    </div>
  );
}
