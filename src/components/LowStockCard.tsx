import React from "react";
import { AlertTriangle, Package } from "lucide-react";
import { Branch } from "../types";

interface LowStockCardProps {
  branch: Branch;
}

export default function LowStockCard({ branch }: LowStockCardProps) {
  // Assuming a low stock threshold, say <= 500
  const LOW_STOCK_THRESHOLD = 500;
  const lowStockItems = branch.items.filter((item) => item.stock <= LOW_STOCK_THRESHOLD);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-col h-full min-h-[250px]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-800 text-sm">Low Stock Alerts</h3>
        </div>
        <div className="w-3 h-3 rounded-full flex shrink-0 relative">
          <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${lowStockItems.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
          <div className={`relative w-3 h-3 rounded-full ${lowStockItems.length > 0 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2">
        {lowStockItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Package className="w-8 h-8 mb-2 opacity-20" />
            <p className="text-xs">No low stock items</p>
          </div>
        ) : (
          lowStockItems.map((item) => (
            <div key={item.id} className="flex items-center justify-between p-2.5 rounded-xl border border-rose-100 bg-rose-50/30">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-[10px]">
                  {item.sku.substring(0, 3)}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-700">{item.name}</h4>
                  <p className="text-[10px] text-slate-500 font-medium">SKU: {item.sku}</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">
                  {item.stock} {item.unit}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
