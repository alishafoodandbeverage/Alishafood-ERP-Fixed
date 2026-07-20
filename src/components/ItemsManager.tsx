import React, { useState, useEffect } from "react";
import { Plus, Search, Filter, Trash2, Edit, ChevronDown, DownloadCloud, UploadCloud, Box, DollarSign, Activity, FileText } from "lucide-react";
import { Item, ItemType } from "../types";
import ImportItems from "./ImportItems";
import ImportItemTypes from "./ImportItemTypes";
import AlishaLogo from "./AlishaLogo";

interface ItemsManagerProps {
  items: Item[];
  itemTypes: ItemType[];
  onAddItem: (name: string, sku?: string, price?: number, cost?: number, stock?: number, unit?: string, type?: string) => void;
  onAddItems: (items: any[]) => void;
  onEditItem?: (id: string, updatedFields: Partial<Item>) => void;
  onDeleteItem?: (id: string) => void;
  onAddItemType: (name: string) => void;
  onAddItemTypes: (types: string[]) => void;
  onEditItemType?: (id: string, newName: string) => void;
  onDeleteItemType?: (id: string) => void;
  onDownloadPDF?: () => void;
  onUploadDrive?: () => void;
  isUploadingDrive?: boolean;
}

const DEFAULT_ITEM_TYPES = [
  { id: "type-default-1", name: "বোতল" },
  { id: "type-default-2", name: "প্রিফর্ম" },
  { id: "type-default-3", name: "হাতা" },
  { id: "type-default-4", name: "ক্যাপ" }
];

export default function ItemsManager({ items, itemTypes, onAddItem, onAddItems, onEditItem, onDeleteItem, onAddItemType, onAddItemTypes, onEditItemType, onDeleteItemType, onDownloadPDF, onUploadDrive, isUploadingDrive }: ItemsManagerProps) {
  const currentItemTypes = (itemTypes && itemTypes.length > 0) ? itemTypes : DEFAULT_ITEM_TYPES;
  const [activeTab, setActiveTab] = useState<"items" | "types" | "unit-calculator">("items");
  
  // Add item state
  const [name, setName] = useState("");
  const [sku, setSku] = useState("");
  const [price, setPrice] = useState("");
  const [cost, setCost] = useState("");
  const [stock, setStock] = useState("");
  const [type, setType] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState("");

  // Add type state
  const [newTypeName, setNewTypeName] = useState("");

  // Filters
  const [searchTerm, setSearchTerm] = useState(() => localStorage.getItem("alisha_items_search") || "");
  const [filterType, setFilterType] = useState(() => localStorage.getItem("alisha_items_filter") || "");
  const [showLimit, setShowLimit] = useState<number>(() => {
    const saved = localStorage.getItem("alisha_items_limit");
    const parsed = parseInt(saved || "10", 10);
    return isNaN(parsed) ? 10 : parsed;
  });

  useEffect(() => {
    localStorage.setItem("alisha_items_search", searchTerm);
  }, [searchTerm]);

  useEffect(() => {
    localStorage.setItem("alisha_items_filter", filterType);
  }, [filterType]);

  useEffect(() => {
    localStorage.setItem("alisha_items_limit", showLimit.toString());
  }, [showLimit]);
  
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  
  // Custom Modal States
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editTypeName, setEditTypeName] = useState("");
  
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editItemName, setEditItemName] = useState("");
  const [editItemCost, setEditItemCost] = useState("");
  const [editItemPrice, setEditItemPrice] = useState("");
  const [editItemStock, setEditItemStock] = useState("");
  const [editItemSku, setEditItemSku] = useState("");
  const [editItemType, setEditItemType] = useState("");
  const [editItemUnit, setEditItemUnit] = useState("");
  
  const [deleteTarget, setDeleteTarget] = useState<{ type: "item" | "itemType" | "bulk", id?: string } | null>(null);

  const handleBulkDelete = () => {
    if (selectedItemIds.length === 0) return;
    setDeleteTarget({ type: "bulk" });
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedItemIds(filteredItems.slice(0, showLimit).map(i => i.id));
    } else {
      setSelectedItemIds([]);
    }
  };

  const handleSubmitItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Item Name is required.");
      return;
    }
    
    onAddItem(
      name.trim(),
      sku.trim() || undefined,
      price ? parseFloat(price) : undefined,
      cost ? parseFloat(cost) : undefined,
      stock ? parseFloat(stock) : undefined,
      "Pcs",
      type || undefined
    );
    
    setName("");
    setSku("");
    setPrice("");
    setCost("");
    setStock("");
    setType("");
    setError("");
    setShowAddForm(false);
  };

  const handleSubmitType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    onAddItemType(newTypeName.trim());
    setNewTypeName("");
  };

  const filteredItems = items.filter((item) => {
    const nameLower = (item.name || "").toLowerCase().trim();
    const skuLower = (item.sku || "").toLowerCase().trim();
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = nameLower.includes(searchLower) || skuLower.includes(searchLower);
    const matchesType = filterType ? (item.type || "").trim() === filterType.trim() : true;
    return matchesSearch && matchesType;
  });

  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + (item.stock || 0), 0);
  const totalPurchasePrice = items.reduce((sum, item) => sum + ((item.stock || 0) * (item.cost || 0)), 0);
  const totalSellPrice = items.reduce((sum, item) => sum + ((item.stock || 0) * (item.price || 0)), 0);
  const totalProfit = items.reduce((sum, item) => sum + (((item.price || 0) > 0) ? (((item.price || 0) - (item.cost || 0)) * (item.stock || 0)) : 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl shadow-xs border border-slate-100">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab("items")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "items" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Items List
          </button>
          <button 
            onClick={() => setActiveTab("types")}
            className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors ${activeTab === "types" ? "bg-emerald-50 text-emerald-700" : "text-slate-500 hover:bg-slate-50"}`}
          >
            Item Types
          </button>
        </div>
        <div className="flex items-center gap-2">
          {onDownloadPDF && activeTab === "items" && (
            <button
              onClick={onDownloadPDF}
              className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors flex items-center gap-2"
            >
              <DownloadCloud className="w-4 h-4" />
              Download Sample
            </button>
          )}
          {activeTab === "items" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-4 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>
          )}
        </div>
      </div>

      {activeTab === "items" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-500">
                <Box className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Items</p>
                <p className="text-lg font-black text-slate-800">{totalItems.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-500">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Quantity</p>
                <p className="text-lg font-black text-slate-800">{totalQuantity.toLocaleString()}</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Purchase Price</p>
                <p className="text-lg font-black text-slate-800">{totalPurchasePrice.toLocaleString()} ৳</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-xs border border-slate-100 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500">
                <DollarSign className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Profit</p>
                <p className="text-lg font-black text-emerald-600">{totalProfit.toLocaleString()} ৳</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {showAddForm && (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-top-4 duration-300">
                <h3 className="text-sm font-bold text-slate-800 mb-4 border-b border-slate-100 pb-3">Add New Item</h3>
                <form onSubmit={handleSubmitItem} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Item Name *</label>
                      <input type="text" value={name} onChange={e => setName(e.target.value)} required className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="Product Name" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Item Type</label>
                      <select value={type} onChange={e => setType(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500">
                        <option value="">Select an option</option>
                        {currentItemTypes.map(t => (
                          <option key={t.id} value={t.name}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Quantity</label>
                      <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 mb-1.5">Buy Price (৳)</label>
                      <input type="number" step="any" value={cost} onChange={e => setCost(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500" placeholder="0.00" />
                    </div>
                  </div>
                  {error && <p className="text-red-500 text-xs font-bold">{error}</p>}
                  <div className="flex justify-end gap-2 pt-2">
                    <button type="button" onClick={() => setShowAddForm(false)} className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
                    <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700">Save Item</button>
                  </div>
                </form>
              </div>
            )}
            <ImportItems onImportItems={onAddItems} />
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden relative">
            {/* Background Watermark Logo - Large & Centered behind the items list */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden opacity-[0.06] z-0 select-none">
              <div className="transform -rotate-12 scale-150 md:scale-[2.5]">
                <AlishaLogo size="lg" />
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
              <div className="col-span-1 md:col-span-2">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Search</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Search className="w-4 h-4" />
                  </div>
                  <input type="text" placeholder="Search product..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Item Type</label>
                <select value={filterType} onChange={e => setFilterType(e.target.value)} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500">
                  <option value="">Select an option</option>
                  {currentItemTypes.map(t => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Show Limit (দেখান)</label>
                <select value={showLimit} onChange={e => setShowLimit(parseInt(e.target.value, 10))} className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:border-blue-500 cursor-pointer relative z-20">
                  <option value="10">10 items</option>
                  <option value="20">20 items</option>
                  <option value="30">30 items</option>
                  <option value="50">50 items</option>
                  <option value="100">100 items</option>
                  <option value="5000">All</option>
                </select>
              </div>
            </div>
            
            <div className="p-3 bg-red-50/50 border-b border-slate-100 text-center">
              <button 
                onClick={handleBulkDelete}
                disabled={selectedItemIds.length === 0}
                className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center justify-center gap-1.5 w-full cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Bulk Delete {selectedItemIds.length > 0 && `(${selectedItemIds.length})`}
              </button>
            </div>
            {/* Desktop Table View - Hidden on Mobile */}
            <div className="hidden md:block overflow-x-auto relative z-10">
              <table className="w-full text-left border-collapse min-w-max">
                <thead>
                  <tr className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-4 py-3 text-center w-12">#</th>
                    <th className="px-4 py-3 text-center w-12"><input type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedItemIds.length === Math.min(filteredItems.length, showLimit)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" /></th>
                    <th className="px-4 py-3">Item Name</th>
                    <th className="px-4 py-3">Type</th>
                    <th className="px-4 py-3 text-right">Buy Price</th>
                    <th className="px-4 py-3 text-right">Sale Price</th>
                    <th className="px-4 py-3 text-right flex items-center justify-end gap-1">Quantity <ChevronDown className="w-3 h-3" /></th>
                    <th className="px-4 py-3 text-right">Purchase Price</th>
                    <th className="px-4 py-3 text-right">Profit (৳)</th>
                    <th className="px-4 py-3 text-center">Production Date</th>
                    <th className="px-4 py-3 text-center">Expiration Date</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-slate-500">No items match your criteria.</td>
                    </tr>
                  ) : (
                    filteredItems.slice(0, showLimit).map((item, index) => {
                      const itemProfit = item.price > 0 ? (item.price - item.cost) * item.stock : 0;
                      return (
                        <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-center font-medium text-slate-400">{index + 1}</td>
                          <td className="px-4 py-3 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedItemIds.includes(item.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedItemIds(prev => [...prev, item.id]);
                                } else {
                                  setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                                }
                              }}
                              className="rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer" 
                            />
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-800">{item.name}</td>
                          <td className="px-4 py-3">
                            <select className="bg-slate-50 text-slate-600 px-2 py-1.5 rounded-md text-[10px] font-semibold border border-slate-200 focus:outline-none focus:border-blue-500" value={item.type || ""} onChange={(e) => {
                              if (onEditItem) onEditItem(item.id, { type: e.target.value });
                            }}>
                              <option value="">Select Type</option>
                              {currentItemTypes.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                              {!currentItemTypes.find(t => t.name === item.type) && item.type && <option value={item.type}>{item.type}</option>}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right">
                             <input type="number" step="0.01" value={item.cost} onChange={(e) => {
                               if (onEditItem) onEditItem(item.id, { cost: parseFloat(e.target.value) || 0 });
                             }} className="w-20 text-right font-mono bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" /> ৳
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-bold text-slate-900">{item.price.toFixed(2)} ৳</td>
                          <td className="px-4 py-3 text-right">
                             <input type="number" value={item.stock} onChange={(e) => {
                               if (onEditItem) onEditItem(item.id, { stock: parseInt(e.target.value) || 0 });
                             }} className="w-16 text-right font-mono bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                          </td>
                          <td className="px-4 py-3 text-right font-mono">{(item.cost * item.stock).toFixed(2)} ৳</td>
                          <td className={`px-4 py-3 text-right font-mono font-bold ${
                            itemProfit > 0 
                              ? "text-emerald-600" 
                              : itemProfit < 0 
                                ? "text-red-500" 
                                : "text-slate-500"
                          }`}>
                            {itemProfit.toFixed(2)} ৳
                          </td>
                          <td className="px-4 py-3 text-center text-slate-500 text-xs">{item.productionDate || "-"}</td>
                          <td className="px-4 py-3 text-center text-slate-500 text-xs">{item.expirationDate || "-"}</td>
                          <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingItemId(item.id);
                                setEditItemName(item.name);
                                setEditItemCost(item.cost.toString());
                                setEditItemPrice(item.price.toString());
                                setEditItemStock(item.stock.toString());
                                setEditItemSku(item.sku || "");
                                setEditItemType(item.type || "");
                                setEditItemUnit(item.unit || "Pcs");
                              }}
                              className="p-1.5 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                              title="Edit Item"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteTarget({ type: "item", id: item.id });
                              }}
                              className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors cursor-pointer"
                              title="Delete Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards List View - High Contrast and Legible on mobile screens */}
            <div className="block md:hidden divide-y divide-slate-100 relative z-10">
              {filteredItems.length === 0 ? (
                <div className="px-4 py-8 text-center text-slate-500 text-xs">No items match your criteria.</div>
              ) : (
                filteredItems.slice(0, showLimit).map((item, index) => {
                  const itemProfit = item.price > 0 ? (item.price - item.cost) * item.stock : 0;
                  return (
                    <div key={item.id} className="p-4 space-y-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-slate-400">#{index + 1}</span>
                          <input 
                            type="checkbox" 
                            checked={selectedItemIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItemIds(prev => [...prev, item.id]);
                              } else {
                                setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                              }
                            }}
                            className="rounded border-slate-300 text-red-500 focus:ring-red-500 cursor-pointer" 
                          />
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">{item.name}</h4>
                            <div className="mt-1 flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold border border-blue-100">
                                {item.type || "N/A"}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400">
                                {item.unit || "Pcs"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          <button 
                            onClick={() => {
                              setEditingItemId(item.id);
                              setEditItemName(item.name);
                              setEditItemCost(item.cost.toString());
                              setEditItemPrice(item.price.toString());
                              setEditItemStock(item.stock.toString());
                              setEditItemSku(item.sku || "");
                              setEditItemType(item.type || "");
                              setEditItemUnit(item.unit || "Pcs");
                            }}
                            className="p-1.5 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                            title="Edit Item"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => {
                              setDeleteTarget({ type: "item", id: item.id });
                            }}
                            className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100 font-mono">
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans font-bold">ক্রয় মূল্য (Buy Price)</span>
                          <span className="font-bold text-slate-700 flex items-center">
                            <input type="number" step="0.01" value={item.cost} onChange={(e) => {
                              if (onEditItem) onEditItem(item.id, { cost: parseFloat(e.target.value) || 0 });
                            }} className="w-16 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" /> ৳
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans font-bold">বিক্রয় মূল্য (Sale Price)</span>
                          <span className="font-bold text-slate-900">{item.price.toFixed(2)} ৳</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans font-bold">পরিমাণ (Quantity)</span>
                          <span className="font-bold text-slate-700">
                            <input type="number" value={item.stock} onChange={(e) => {
                              if (onEditItem) onEditItem(item.id, { stock: parseInt(e.target.value) || 0 });
                            }} className="w-16 bg-transparent border-b border-dashed border-slate-300 focus:border-blue-500 focus:outline-none" />
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block font-sans font-bold">মোট ক্রয় মূল্য (Purchase Price)</span>
                          <span className="font-bold text-slate-700">{(item.cost * item.stock).toFixed(2)} ৳</span>
                        </div>
                        <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                           <div>
                              <span className="text-slate-400 text-[10px] block font-sans font-bold">Production Date</span>
                              <span className="text-slate-600 font-bold text-xs">{item.productionDate || "-"}</span>
                           </div>
                           <div>
                              <span className="text-slate-400 text-[10px] block font-sans font-bold">Expiration Date</span>
                              <span className="text-slate-600 font-bold text-xs">{item.expirationDate || "-"}</span>
                           </div>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-200 flex justify-between items-center font-sans">
                          <span className="text-slate-500 text-[10px] font-bold">লাভ (Profit)</span>
                          <span className={`font-mono font-bold text-xs ${
                            itemProfit > 0 
                              ? "text-emerald-600" 
                              : itemProfit < 0 
                                ? "text-red-500" 
                                : "text-slate-500"
                          }`}>
                            {itemProfit.toFixed(2)} ৳
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <div className="p-4 border-t border-slate-100 text-xs text-slate-500 flex justify-between items-center relative z-10 bg-white">
              <span>Showing 1 to {Math.min(filteredItems.length, showLimit)} of {filteredItems.length} results</span>
            </div>
          </div>
        </div>
      ) : activeTab === "types" ? (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Add Item Type</h3>
              <form onSubmit={handleSubmitType} className="mb-6">
                <label className="block text-xs font-bold text-slate-600 mb-1.5">Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  required
                  value={newTypeName} 
                  onChange={e => setNewTypeName(e.target.value)} 
                  className="w-full md:w-1/2 text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3" 
                  placeholder="e.g. Preform, Handle, Cap, Lock" 
                />
                <div className="flex justify-end md:justify-start">
                  <button type="submit" className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5" /> Add Item Type
                  </button>
                </div>
              </form>
              <ImportItemTypes onImportItemTypes={onAddItemTypes} />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-xs border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider">
                    <th className="px-5 py-3 w-16 text-center">#</th>
                    <th className="px-5 py-3">Name</th>
                    <th className="px-5 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {currentItemTypes.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-5 py-8 text-center text-slate-500">No item types found. Add one above.</td>
                    </tr>
                  ) : (
                    currentItemTypes.map((type, index) => (
                      <tr key={type.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3 text-center font-medium text-slate-400">{index + 1}</td>
                        <td className="px-5 py-3 font-bold text-slate-800">{type.name}</td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => {
                                setEditingTypeId(type.id);
                                setEditTypeName(type.name);
                              }}
                              className="p-1.5 text-blue-500 bg-blue-50 rounded hover:bg-blue-100 transition-colors cursor-pointer"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteTarget({ type: "itemType", id: type.id });
                              }}
                              className="p-1.5 text-red-500 bg-red-50 rounded hover:bg-red-100 transition-colors cursor-pointer"
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
          </div>
        </div>
      ) : null}

      {/* Modals */}
      {editingItemId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 overflow-hidden">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-5">
              <h3 className="text-base font-extrabold text-slate-800">Edit Product Info (পণ্য সংশোধন করুন)</h3>
              <button 
                onClick={() => setEditingItemId(null)}
                className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
              {/* Product Name */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">
                  Item Name (আইটেমের নাম) <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  value={editItemName} 
                  onChange={e => setEditItemName(e.target.value)}
                  placeholder="e.g. 250ml Bottle"
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Type and Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Type (আইটেমের ধরন)
                  </label>
                  <select 
                    value={editItemType} 
                    onChange={e => setEditItemType(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Type</option>
                    {currentItemTypes.map(t => (
                      <option key={t.id} value={t.name}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Unit (ইউনিট)
                  </label>
                  <input 
                    type="text" 
                    value={editItemUnit} 
                    onChange={e => setEditItemUnit(e.target.value)}
                    placeholder="Pcs, Box, Kg, Ltr"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Cost & Price */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Buy Price (ক্রয় মূল্য ৳)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editItemCost} 
                    onChange={e => setEditItemCost(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Sale Price (বিক্রয় মূল্য ৳)
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editItemPrice} 
                    onChange={e => setEditItemPrice(e.target.value)}
                    placeholder="0.00"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>

              {/* Stock / Quantity & Barcode */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Quantity (পরিমাণ)
                  </label>
                  <input 
                    type="number" 
                    min="0"
                    value={editItemStock} 
                    onChange={e => setEditItemStock(e.target.value)}
                    placeholder="0"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">
                    Barcode / SKU (বারকোড)
                  </label>
                  <input 
                    type="text" 
                    value={editItemSku} 
                    onChange={e => setEditItemSku(e.target.value)}
                    placeholder="Barcode string"
                    className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-5 border-t border-slate-100 mt-6">
              <button 
                onClick={() => setEditingItemId(null)} 
                className="px-4 py-2 text-xs font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Cancel (বাতিল)
              </button>
              <button 
                onClick={() => {
                  if (editItemName.trim() && onEditItem) {
                    onEditItem(editingItemId, { 
                      name: editItemName.trim(),
                      type: editItemType,
                      cost: parseFloat(editItemCost) || 0,
                      price: parseFloat(editItemPrice) || 0,
                      stock: parseInt(editItemStock) || 0,
                      sku: editItemSku.trim(),
                      unit: editItemUnit.trim()
                    });
                    setEditingItemId(null);
                  }
                }} 
                disabled={!editItemName.trim()}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                Save Changes (সংরক্ষণ করুন)
              </button>
            </div>
          </div>
        </div>
      )}

      {editingTypeId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Edit Item Type</h3>
            <input 
              type="text" 
              value={editTypeName} 
              onChange={e => setEditTypeName(e.target.value)}
              className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-slate-50 focus:outline-none focus:border-blue-500 mb-4"
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") {
                  if (editTypeName.trim() && onEditItemType) {
                    onEditItemType(editingTypeId, editTypeName.trim());
                    setEditingTypeId(null);
                  }
                }
              }}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setEditingTypeId(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
              <button 
                onClick={() => {
                  if (editTypeName.trim() && onEditItemType) {
                    onEditItemType(editingTypeId, editTypeName.trim());
                    setEditingTypeId(null);
                  }
                }} 
                className="px-4 py-2 text-sm font-bold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Confirm Deletion</h3>
            <p className="text-sm text-slate-600 mb-6">
              {deleteTarget.type === "bulk" 
                ? `Are you sure you want to delete ${selectedItemIds.length} items? This action cannot be undone.`
                : `Are you sure you want to delete this ${deleteTarget.type === "item" ? "item" : "item type"}? This action cannot be undone.`}
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setDeleteTarget(null)} className="px-4 py-2 text-sm font-bold text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200">Cancel</button>
              <button 
                onClick={() => {
                  if (deleteTarget.type === "bulk" && onDeleteItem) {
                    selectedItemIds.forEach(id => onDeleteItem(id));
                    setSelectedItemIds([]);
                  } else if (deleteTarget.type === "item" && onDeleteItem && deleteTarget.id) {
                    onDeleteItem(deleteTarget.id);
                  } else if (deleteTarget.type === "itemType" && onDeleteItemType && deleteTarget.id) {
                    onDeleteItemType(deleteTarget.id);
                  }
                  setDeleteTarget(null);
                }} 
                className="px-4 py-2 text-sm font-bold text-white bg-red-600 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
