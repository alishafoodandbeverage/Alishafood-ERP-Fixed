import React, { useState } from "react";
import { ProductionRecord, Item } from "../types";
import { Factory, Plus, Calendar, Coins, PackageOpen, Sparkles } from "lucide-react";
import ImportDataCard from "./ImportDataCard";
import IntegratedCalculator from "./IntegratedCalculator";

interface ProductionCardProps {
  productionLogs: ProductionRecord[];
  itemsList: Item[];
  onAddProduction: (itemName: string, cost: number, quantity: number, date: string) => void;
  onAddProductions?: (productions: any[]) => void;
  onDownloadPDF?: () => void;
  onUploadDrive?: () => void;
  isUploadingDrive?: boolean;
}

export default function ProductionCard({
  productionLogs,
  itemsList,
  onAddProduction,
  onAddProductions,
  onDownloadPDF,
  onUploadDrive,
  isUploadingDrive,
}: ProductionCardProps) {
  const [selectedItem, setSelectedItem] = useState("");
  const [customItem, setCustomItem] = useState("");
  const [isCustom, setIsCustom] = useState(false);
  const [productionCost, setProductionCost] = useState("");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemName = isCustom ? customItem.trim() : selectedItem;
    const cost = parseFloat(productionCost);
    const qty = parseInt(quantity);

    if (!itemName) {
      setError("Please select or enter an item name.");
      return;
    }
    if (isNaN(cost) || cost <= 0) {
      setError("Please enter a valid production cost.");
      return;
    }
    if (isNaN(qty) || qty <= 0) {
      setError("Please enter a valid quantity.");
      return;
    }
    if (!date) {
      setError("Please select a production date.");
      return;
    }

    onAddProduction(itemName, cost, qty, date);
    
    setSelectedItem("");
    setCustomItem("");
    setProductionCost("");
    setQuantity("");
    setError("");
  };

  return (
    <div id="production-card" className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4 mb-5 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/50">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wider">Production logs</h3>
              <p className="text-xs text-slate-400">Track raw material conversions and batch costs</p>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onDownloadPDF && (
              <button
                onClick={onDownloadPDF}
                className="bg-slate-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                Download PDF
              </button>
            )}
            {onUploadDrive && (
              <button
                onClick={onUploadDrive}
                disabled={isUploadingDrive}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-xs uppercase tracking-wider px-3.5 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                {isUploadingDrive ? "Uploading..." : "Upload to Drive"}
              </button>
            )}
            <span className="bg-slate-100 text-slate-700 px-3.5 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider">
              {productionLogs.length} Records
            </span>
          </div>
        </div>

        {onAddProductions && <ImportDataCard entityType="production" onImportData={onAddProductions} />}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Production Logging Form */}
          <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100/80 h-fit">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-emerald-600" />
              Log Production Run
            </h4>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Item Selector */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Finished Item</label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustom(!isCustom);
                      setSelectedItem("");
                      setCustomItem("");
                    }}
                    className="text-[10px] text-emerald-600 hover:text-emerald-800 font-bold tracking-wide"
                  >
                    {isCustom ? "Select from list" : "Enter custom name"}
                  </button>
                </div>

                {isCustom ? (
                  <input
                    type="text"
                    placeholder="Enter item name (e.g. Potato Toast)"
                    value={customItem}
                    onChange={(e) => setCustomItem(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                ) : (
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Choose an item --</option>
                    {itemsList.map((item) => (
                      <option key={item.id} value={item.name}>
                        {item.name} ({item.sku})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Production Cost */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Total Production Cost (৳)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Coins className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="number"
                    min="1"
                    placeholder="Amount in Taka"
                    value={productionCost}
                    onChange={(e) => setProductionCost(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>
              
              {/* Quantity */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quantity
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="Quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Production Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Production Date</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Log Production</span>
              </button>
            </form>
          </div>

          {/* Production Logs List Table */}
          <div className="lg:col-span-2 flex flex-col justify-between">
            <div className="mb-4">
              <IntegratedCalculator />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-slate-100 bg-white">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 border-b border-slate-100 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="px-5 py-3.5 font-bold">Item Name</th>
                    <th className="px-5 py-3.5 font-bold text-right">Production Cost</th>
                    <th className="px-5 py-3.5 font-bold text-right">Quantity</th>
                    <th className="px-5 py-3.5 font-bold text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs text-slate-700">
                  {productionLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-400 font-medium">
                        <div className="flex flex-col items-center gap-3">
                          <PackageOpen className="w-10 h-10 text-slate-300" />
                          <span className="text-xs text-slate-400">No production logs available for this factory.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    [...productionLogs].reverse().map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-5 py-3.5 font-extrabold text-slate-800">{log.itemName}</td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-emerald-600">
                          {log.productionCost.toLocaleString()} ৳
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono font-bold text-slate-700">
                          {log.quantity?.toLocaleString() || "-"} 
                        </td>
                        <td className="px-5 py-3.5 text-right text-slate-500 font-mono">
                          {new Date(log.date).toLocaleDateString("en-GB", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-end gap-1 text-right text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
              <p className="text-[10px] font-medium">
                * Production runs automatically update inventory expenses to keep accurate accounting ledgers.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
