import React, { useState } from "react";
import { Wallet, Plus, Minus, FileText, DownloadCloud, Edit, Trash2, Check, X, Calendar, User, DollarSign } from "lucide-react";
import { Branch, PettyCashTransaction, EmployeeAdvance } from "../types";
import { jsPDF } from "jspdf";

interface PettyCashCardProps {
  branch: Branch;
  onUpdatePettyCash: (branchId: string, transactions: PettyCashTransaction[]) => void;
  onUpdateAdvances?: (branchId: string, advances: EmployeeAdvance[]) => void;
}

export default function PettyCashCard({ branch, onUpdatePettyCash, onUpdateAdvances }: PettyCashCardProps) {
  // --- Petty Cash State ---
  const [showForm, setShowForm] = useState(false);
  const [type, setType] = useState<"credit" | "debit">("credit");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editingPcId, setEditingPcId] = useState<string | null>(null);

  // --- Advance State ---
  const [showAdvForm, setShowAdvForm] = useState(false);
  const [advName, setAdvName] = useState("");
  const [advAmount, setAdvAmount] = useState("");
  const [advDate, setAdvDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [editingAdvId, setEditingAdvId] = useState<string | null>(null);

  const balance = branch.pettyCashBalance || 0;
  const transactions = branch.pettyCashTransactions || [];
  const advances = branch.advances || [];

  const handleDownloadPDF = () => {
    // Basic PDF download...
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`Petty Cash Ledger: ${branch.name}`, 20, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Current Balance: ${balance} BDT`, 20, 30);
    doc.save(`petty_cash_${branch.name}.pdf`);
  };

  // --- Petty Cash Logic ---
  const handleAddPc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || isNaN(Number(amount)) || !description) return;
    
    if (editingPcId) {
      const updated = transactions.map(t => 
        t.id === editingPcId ? { ...t, type, amount: Number(amount), description, date } : t
      );
      onUpdatePettyCash(branch.id, updated);
      setEditingPcId(null);
    } else {
      const newTx: PettyCashTransaction = {
        id: `pd-${Date.now()}`,
        type,
        amount: Number(amount),
        description,
        date
      };
      onUpdatePettyCash(branch.id, [...transactions, newTx]);
    }
    
    setAmount("");
    setDescription("");
    setShowForm(false);
  };

  const handleEditPc = (t: PettyCashTransaction) => {
    setType(t.type);
    setAmount(t.amount.toString());
    setDescription(t.description);
    setDate(t.date);
    setEditingPcId(t.id);
    setShowForm(true);
  };

  const handleDeletePc = (id: string) => {
    if (confirm("Are you sure you want to delete this transaction?")) {
      onUpdatePettyCash(branch.id, transactions.filter(t => t.id !== id));
    }
  };

  // --- Advances Logic ---
  const handleAddAdv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!advAmount || isNaN(Number(advAmount)) || !advName) return;
    if (!onUpdateAdvances) return;
    
    if (editingAdvId) {
      const updated = advances.map(a => 
        a.id === editingAdvId ? { ...a, employeeName: advName, amount: Number(advAmount), date: advDate } : a
      );
      onUpdateAdvances(branch.id, updated);
      setEditingAdvId(null);
    } else {
      const newAdv: EmployeeAdvance = {
        id: `adv-${Date.now()}`,
        employeeName: advName,
        amount: Number(advAmount),
        date: advDate
      };
      onUpdateAdvances(branch.id, [...advances, newAdv]);
    }
    
    setAdvName("");
    setAdvAmount("");
    setShowAdvForm(false);
  };

  const handleEditAdv = (a: EmployeeAdvance) => {
    setAdvName(a.employeeName);
    setAdvAmount(a.amount.toString());
    setAdvDate(a.date);
    setEditingAdvId(a.id);
    setShowAdvForm(true);
  };

  const handleDeleteAdv = (id: string) => {
    if (confirm("Are you sure you want to delete this advance?")) {
      if (onUpdateAdvances) {
        onUpdateAdvances(branch.id, advances.filter(a => a.id !== id));
      }
    }
  };

  // Calculate Running Balance for Ledger
  let runningBalance = 0;
  const ledgerData = transactions.slice().sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(t => {
    if (t.type === 'credit') runningBalance += t.amount;
    else runningBalance -= t.amount;
    return { ...t, runningBalance };
  }).reverse(); // Reverse for display (newest first)

  return (
    <div className="flex flex-col gap-4">
      {/* Petty Cash Ledger Section */}
      <div className="bg-white rounded-2xl border border-slate-200/60 p-4 shadow-sm flex flex-col h-[500px]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-slate-800 text-sm">Petty Cash Ledger</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              title="Download Report"
            >
              <DownloadCloud className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setShowForm(!showForm);
                if (showForm) setEditingPcId(null);
              }}
              className="p-1.5 bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {showForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            </button>
            <div className="w-3 h-3 rounded-full flex shrink-0 relative ml-2">
              <div className={`absolute inset-0 rounded-full animate-ping opacity-75 ${balance < 1000 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
              <div className={`relative w-3 h-3 rounded-full ${balance < 1000 ? 'bg-red-500' : 'bg-emerald-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="bg-indigo-500 rounded-xl p-3 text-white mb-4 shadow-sm shrink-0 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-indigo-100 font-medium uppercase tracking-wider mb-0.5">Current Balance</p>
            <h2 className="text-xl font-black">৳ {balance.toLocaleString()}</h2>
          </div>
        </div>

        {showForm ? (
          <form onSubmit={handleAddPc} className="space-y-3 mb-4 shrink-0 animate-in fade-in zoom-in-95 duration-200 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setType("credit")}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  type === "credit" ? "bg-emerald-500 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                + Credit (Receive)
              </button>
              <button
                type="button"
                onClick={() => setType("debit")}
                className={`py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  type === "debit" ? "bg-rose-500 text-white shadow-md" : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                - Debit (Expense)
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1">Description (Particulars)</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                placeholder="Details..."
              />
            </div>
            
            <div className="flex gap-2">
              <button type="submit" className="flex-1 py-1.5 bg-indigo-600 text-white text-[10px] font-bold rounded-lg hover:bg-indigo-700">
                {editingPcId ? 'Update' : 'Save'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditingPcId(null); }} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg">
                Cancel
              </button>
            </div>
          </form>
        ) : null}

        <div className="flex-1 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-inner">
          <table className="w-full text-left text-[10px] leading-tight">
            <thead className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 text-[9px] uppercase tracking-wider text-slate-500 font-bold">
              <tr>
                <th className="px-1 py-2 text-center w-10">Date</th>
                <th className="px-1 py-2">Part.</th>
                <th className="px-1 py-2 text-right text-emerald-600">In</th>
                <th className="px-1 py-2 text-right text-rose-600">Out</th>
                <th className="px-1 py-2 text-right">Bal.</th>
                <th className="px-1 py-2 text-center w-8">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ledgerData.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-2 py-8 text-center text-slate-400">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                ledgerData.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50">
                    <td className="px-1 py-1.5 text-slate-600 text-center whitespace-nowrap">{new Date(t.date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' })}</td>
                    <td className="px-1 py-1.5 font-medium text-slate-800 max-w-[60px] truncate" title={t.description}>{t.description}</td>
                    <td className="px-1 py-1.5 text-right font-mono text-emerald-600 whitespace-nowrap">
                      {t.type === 'credit' ? t.amount.toLocaleString() : '-'}
                    </td>
                    <td className="px-1 py-1.5 text-right font-mono text-rose-600 whitespace-nowrap">
                      {t.type === 'debit' ? t.amount.toLocaleString() : '-'}
                    </td>
                    <td className="px-1 py-1.5 text-right font-mono font-bold text-slate-700 bg-slate-50/50 whitespace-nowrap">
                      {t.runningBalance.toLocaleString()}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-0.5 opacity-40 hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditPc(t)} className="p-0.5 text-blue-600 hover:bg-blue-50 rounded"><Edit className="w-2.5 h-2.5" /></button>
                        <button onClick={() => handleDeletePc(t.id)} className="p-0.5 text-rose-600 hover:bg-rose-50 rounded"><Trash2 className="w-2.5 h-2.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Advance Section */}
      <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/60 p-4 shadow-sm flex flex-col h-[300px]">
        <div className="flex items-center justify-between mb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
              <User className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-amber-900 text-sm">Staff Advance</h3>
          </div>
          <button
            onClick={() => {
              setShowAdvForm(!showAdvForm);
              if (showAdvForm) setEditingAdvId(null);
            }}
            className="p-1.5 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
          >
            {showAdvForm ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>

        {showAdvForm ? (
          <form onSubmit={handleAddAdv} className="space-y-3 mb-3 shrink-0 animate-in fade-in bg-white/60 p-3 rounded-xl border border-amber-200/50">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Employee Name</label>
                <input
                  type="text"
                  required
                  value={advName}
                  onChange={(e) => setAdvName(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  placeholder="Name"
                />
              </div>
              <div>
                <label className="block text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Amount (৳)</label>
                <input
                  type="number"
                  required
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                  placeholder="0"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 items-end">
              <div>
                <label className="block text-[9px] font-bold text-amber-700 uppercase tracking-wider mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={advDate}
                  onChange={(e) => setAdvDate(e.target.value)}
                  className="w-full bg-white border border-amber-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-1 h-[28px]">
                <button type="submit" className="flex-1 bg-amber-500 text-white text-[10px] font-bold rounded-lg hover:bg-amber-600">
                  {editingAdvId ? 'Update' : 'Save'}
                </button>
                <button type="button" onClick={() => { setShowAdvForm(false); setEditingAdvId(null); }} className="px-2 bg-amber-200/50 text-amber-700 rounded-lg">
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          </form>
        ) : null}

        <div className="flex-1 overflow-auto rounded-xl bg-white/80 border border-amber-100 shadow-inner">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead className="bg-amber-100/50 border-b border-amber-200 sticky top-0 z-10 text-[9px] uppercase tracking-wider text-amber-800 font-bold">
              <tr>
                <th className="px-2 py-2">Date</th>
                <th className="px-2 py-2">Name</th>
                <th className="px-2 py-2 text-right">Amount</th>
                <th className="px-1 py-2 text-center w-10">Act</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amber-100/50">
              {advances.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-2 py-6 text-center text-amber-700/50">
                    No advances given.
                  </td>
                </tr>
              ) : (
                advances.slice().reverse().map((a) => (
                  <tr key={a.id} className="hover:bg-amber-50">
                    <td className="px-2 py-1.5 text-amber-700/70">{new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</td>
                    <td className="px-2 py-1.5 font-bold text-amber-900">{a.employeeName}</td>
                    <td className="px-2 py-1.5 text-right font-mono font-bold text-rose-600">
                      {a.amount.toLocaleString()}
                    </td>
                    <td className="px-1 py-1.5 text-center">
                      <div className="flex items-center justify-center gap-1 opacity-30 hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEditAdv(a)} className="p-0.5 text-blue-600"><Edit className="w-3 h-3" /></button>
                        <button onClick={() => handleDeleteAdv(a.id)} className="p-0.5 text-rose-600"><Trash2 className="w-3 h-3" /></button>
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
  );
}
