import React, { useState } from "react";
import { Sale, Item } from "../types";
import { Plus, Receipt, CircleDollarSign, Calendar, ShoppingCart, Download } from "lucide-react";
import { generateInvoicePDF } from "../utils/pdfGenerator";
import ImportVoucher from "./ImportVoucher";

interface SalesManagerProps {
  sales: Sale[];
  itemsList: Item[];
  branchName: string;
  location: string;
  onAddSale: (itemName: string, quantity: number, price: number, date: string, customerName: string) => void;
  onAddSales?: (sales: { itemName: string; quantity: number; price: number; date: string; customerName: string }[]) => void;
  onDownloadPDF: () => void;
}

export default function SalesManager({ sales, itemsList, branchName, location, onAddSale, onAddSales, onDownloadPDF }: SalesManagerProps) {
  const [selectedItemId, setSelectedItemId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [customPrice, setCustomPrice] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerName, setCustomerName] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const activeItem = itemsList.find((it) => it.id === selectedItemId);
  const detectedPrice = activeItem ? activeItem.price : 0;
  const unitPrice = customPrice ? parseFloat(customPrice) : detectedPrice;
  const totalCalculated = unitPrice * parseInt(quantity || "0");

  const handleItemChange = (itemId: string) => {
    setSelectedItemId(itemId);
    const item = itemsList.find((it) => it.id === itemId);
    if (item) {
      setCustomPrice(item.price.toString());
    } else {
      setCustomPrice("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeItem) return setError("Please select an item to sell.");
    const qty = parseInt(quantity);
    if (isNaN(qty) || qty <= 0) return setError("Please enter a valid quantity.");
    if (qty > activeItem.stock) {
      return setError(`Insufficient stock! Active factory stock of ${activeItem.name} is ${activeItem.stock} Pcs.`);
    }
    const price = parseFloat(customPrice);
    if (isNaN(price) || price <= 0) return setError("Please enter a valid sales price.");

    onAddSale(activeItem.name, qty, price, date, customerName);

    setSuccess(`Sale of ${qty}x ${activeItem.name} successfully registered!`);
    setSelectedItemId("");
    setQuantity("1");
    setCustomPrice("");
    setCustomerName("");
    setError("");

    setTimeout(() => setSuccess(""), 3000);
  };

  return (
    <div id="sales-manager-panel" className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Sales Transactions</h2>
            <p className="text-xs text-slate-400">Log client delivery invoice runs and track current daily revenues</p>
          </div>
        </div>
        <button
          onClick={onDownloadPDF}
          className="w-full sm:w-auto bg-slate-950 hover:bg-black text-white font-bold text-xs uppercase tracking-wider px-4 py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
        >
          Download PDF Report
        </button>
      </div>

      {onAddSales && <ImportVoucher onImportSales={onAddSales} />}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Record Sale Form */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-4">
            <ShoppingCart className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-800">New Invoice Run</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Choose product */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Select product</label>
              <select
                value={selectedItemId}
                onChange={(e) => handleItemChange(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="">-- Choose item --</option>
                {itemsList.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} (Stock: {item.stock} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            {/* Qty and custom price */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Unit Price (৳)</label>
                <input
                  type="number"
                  min="0.1"
                  step="any"
                  value={customPrice}
                  onChange={(e) => setCustomPrice(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Invoice total and date */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Invoice Date</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Calendar className="w-4 h-4" />
                </div>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-lg pl-9 pr-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Customer Name</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            {/* Price Preview Panel */}
            {activeItem && (
              <div className="bg-emerald-50/50 rounded-xl p-3.5 border border-emerald-100/50">
                <div className="flex justify-between items-center text-xs text-slate-500">
                  <span>Unit Price:</span>
                  <span>{unitPrice.toLocaleString()} ৳</span>
                </div>
                <div className="flex justify-between items-center text-xs text-slate-500 mt-1">
                  <span>Quantity:</span>
                  <span>{quantity || 0}</span>
                </div>
                <hr className="my-1.5 border-dashed border-emerald-100" />
                <div className="flex justify-between items-center text-sm font-bold text-emerald-700">
                  <span>Invoice Total:</span>
                  <span>{totalCalculated.toLocaleString()} ৳</span>
                </div>
              </div>
            )}

            {error && <p className="text-xs text-red-500 font-semibold">{error}</p>}
            {success && <p className="text-xs text-emerald-600 font-semibold">{success}</p>}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Invoice Sale</span>
            </button>
          </form>
        </div>

        {/* Sales Logs list table */}
        <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-slate-100 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                <th className="px-4 py-3">Item Sold</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Gross Total</th>
                <th className="px-4 py-3 text-right">Invoice Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 text-xs font-semibold text-slate-600">
              {sales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-slate-400 font-medium">
                    No sales invoices logged for this factory.
                  </td>
                </tr>
              ) : (
                [...sales].reverse().map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{sale.itemName}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">{sale.quantity.toLocaleString()} Pcs</td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600">
                      {sale.amount.toLocaleString()} ৳
                    </td>
                    <td className="px-4 py-3 text-right text-xs text-slate-400 font-normal">
                      {new Date(sale.date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => {
                          const doc = generateInvoicePDF(
                            branchName,
                            location,
                            sale.id,
                            sale.date,
                            sale.customerName || "N/A",
                            "N/A",
                            [{ description: sale.itemName, quantity: sale.quantity, rate: sale.amount / sale.quantity, total: sale.amount }],
                            sale.amount,
                            sale.amount,
                            0
                          );
                          doc.save(`invoice_${sale.id}.pdf`);
                        }}
                        className="text-emerald-600 hover:text-emerald-800"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
