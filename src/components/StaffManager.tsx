import React, { useState } from "react";
import { Users, Plus, Search, Calendar, DollarSign, List, Activity, Check, X, Clock, DownloadCloud } from "lucide-react";
import { Branch, Staff, Attendance, Payroll, StaffTransaction } from "../types";
import StaffCard from "./StaffCard";

interface StaffManagerProps {
  activeBranch?: Branch;
  onUpdateStaff?: (staff: Staff[]) => void;
  onUpdateAttendance?: (attendance: Attendance[]) => void;
  onUpdatePayroll?: (payroll: Payroll[]) => void;
  onUpdateStaffTransactions?: (transactions: StaffTransaction[]) => void;
}

export default function StaffManager({ 
  activeBranch, 
  onUpdateStaff,
  onUpdateAttendance,
  onUpdatePayroll,
  onUpdateStaffTransactions 
}: StaffManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"list" | "create" | "attendance" | "payroll" | "transactions">("list");
  
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [payrollMonth, setPayrollMonth] = useState(() => new Date().toISOString().slice(0, 7)); // YYYY-MM
  
  const staff = activeBranch?.staff || [];
  const attendance = activeBranch?.attendance || [];
  const payroll = activeBranch?.payroll || [];
  const staffTransactions = activeBranch?.staffTransactions || [];

  // Form states for creating staff
  const [editingStaffId, setEditingStaffId] = useState<string | null>(null);
  const [newStaff, setNewStaff] = useState<Partial<Staff>>({
    name: "", role: "", phone: "", salary: 0
  });

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaff.name || !newStaff.role || !onUpdateStaff) return;
    
    if (editingStaffId) {
      onUpdateStaff(staff.map(s => s.id === editingStaffId ? {
        ...s,
        name: newStaff.name || "",
        role: newStaff.role || "",
        phone: newStaff.phone || "",
        salary: Number(newStaff.salary) || 0,
      } : s));
    } else {
      const staffItem: Staff = {
        id: Date.now().toString(),
        name: newStaff.name,
        role: newStaff.role,
        phone: newStaff.phone || "",
        salary: Number(newStaff.salary) || 0,
      };
      onUpdateStaff([...staff, staffItem]);
    }

    setNewStaff({ name: "", role: "", phone: "", salary: 0 });
    setEditingStaffId(null);
    setActiveTab("list");
  };

  const handleMarkAttendance = (staffId: string, status: "Present" | "Absent" | "Late") => {
    if (!onUpdateAttendance) return;
    const existingIndex = attendance.findIndex(a => a.staffId === staffId && a.date === attendanceDate);
    let newAttendance = [...attendance];
    
    if (existingIndex >= 0) {
      newAttendance[existingIndex].status = status;
    } else {
      newAttendance.push({
        id: Date.now().toString(),
        staffId,
        date: attendanceDate,
        status
      });
    }
    onUpdateAttendance(newAttendance);
  };

  const getAttendanceStatus = (staffId: string) => {
    return attendance.find(a => a.staffId === staffId && a.date === attendanceDate)?.status;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Staff & HR Management
          </h2>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage employees, payroll, and contact directory for {activeBranch?.name || "all branches"}.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-xl leading-5 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm shadow-sm"
            />
          </div>
          <button 
            onClick={() => setActiveTab("create")}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Staff</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-slate-100 p-1 rounded-xl w-max border border-slate-200 overflow-x-auto max-w-full">
        {[
          { id: "list", label: "Staff List", icon: List },
          { id: "create", label: "Staff Create", icon: Plus },
          { id: "attendance", label: "Attendance", icon: Calendar },
          { id: "payroll", label: "Payroll", icon: DollarSign },
          { id: "transactions", label: "Transactions", icon: Activity },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? "bg-white text-emerald-700 shadow-sm border border-slate-200/50" 
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {activeTab === "list" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <StaffCard 
              branchName={activeBranch?.name} 
              staff={staff} 
              onAdd={() => {
                setEditingStaffId(null);
                setNewStaff({ name: "", role: "", phone: "", salary: 0 });
                setActiveTab("create");
              }}
              onEdit={(s) => {
                setEditingStaffId(s.id);
                setNewStaff({ name: s.name, role: s.role, phone: s.phone, salary: s.salary });
                setActiveTab("create");
              }}
              onDelete={(id) => {
                if(window.confirm("Are you sure you want to delete this staff?")) {
                  onUpdateStaff?.(staff.filter(s => s.id !== id));
                }
              }}
            />
          </div>
        )}

        {activeTab === "create" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 max-w-2xl animate-in fade-in">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-emerald-600" />
              Create New Staff
            </h3>
            <form className="space-y-4" onSubmit={handleCreateStaff}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input type="text" required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. John Doe" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Role / Designation</label>
                  <input type="text" required value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. Manager" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
                  <input type="text" required value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. 017..." />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Salary (৳)</label>
                  <input type="number" required value={newStaff.salary || ""} onChange={e => setNewStaff({...newStaff, salary: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" placeholder="e.g. 25000" />
                </div>
              </div>
              <div className="pt-2">
                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-xl text-sm font-bold shadow-sm hover:bg-emerald-700 transition-colors">
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        )}

        {activeTab === "attendance" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-in fade-in">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                Daily Attendance
              </h3>
              <div className="flex items-center gap-3">
                <input 
                  type="date" 
                  value={attendanceDate}
                  onChange={(e) => setAttendanceDate(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Staff Name</th>
                    <th className="px-4 py-3 font-bold">Role</th>
                    <th className="px-4 py-3 font-bold text-center">Status</th>
                    <th className="px-4 py-3 font-bold">Notes / Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => {
                    const status = getAttendanceStatus(s.id);
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-bold text-slate-800">{s.name}</td>
                        <td className="px-4 py-3 text-slate-500">{s.role}</td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                            <button 
                              onClick={() => handleMarkAttendance(s.id, "Present")}
                              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${status === "Present" ? "bg-emerald-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                            >
                              <Check className="w-3 h-3" /> Present
                            </button>
                            <button 
                              onClick={() => handleMarkAttendance(s.id, "Absent")}
                              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${status === "Absent" ? "bg-rose-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                            >
                              <X className="w-3 h-3" /> Absent
                            </button>
                            <button 
                              onClick={() => handleMarkAttendance(s.id, "Late")}
                              className={`px-3 py-1 text-xs font-bold rounded-md flex items-center gap-1 transition-colors ${status === "Late" ? "bg-amber-500 text-white shadow-sm" : "text-slate-500 hover:bg-slate-200"}`}
                            >
                              <Clock className="w-3 h-3" /> Late
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input type="text" placeholder="Optional notes" className="w-full border border-slate-200 rounded p-1 text-xs focus:outline-none" />
                        </td>
                      </tr>
                    );
                  })}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No staff members found. Please create one.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "payroll" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-in fade-in">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-600" />
                Payroll Processing
              </h3>
              <div className="flex items-center gap-3">
                <input 
                  type="month" 
                  value={payrollMonth}
                  onChange={(e) => setPayrollMonth(e.target.value)}
                  className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700" 
                />
                <button className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                  <DownloadCloud className="w-4 h-4" /> Export Report
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Staff Name</th>
                    <th className="px-4 py-3 font-bold text-right">Base Salary (৳)</th>
                    <th className="px-4 py-3 font-bold text-right text-emerald-600">Bonus (+)</th>
                    <th className="px-4 py-3 font-bold text-right text-rose-600">Deductions (-)</th>
                    <th className="px-4 py-3 font-bold text-right">Net Payable (৳)</th>
                    <th className="px-4 py-3 font-bold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staff.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-bold text-slate-800">
                        {s.name}
                        <span className="block text-[10px] text-slate-400 font-normal">{s.role}</span>
                      </td>
                      <td className="px-4 py-3 font-mono text-right text-slate-600">{s.salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" defaultValue={0} className="w-20 border-b border-slate-200 focus:border-emerald-500 outline-none text-right font-mono text-emerald-600 bg-transparent" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <input type="number" defaultValue={0} className="w-20 border-b border-slate-200 focus:border-rose-500 outline-none text-right font-mono text-rose-600 bg-transparent" />
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-right text-slate-800">{s.salary.toLocaleString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button className="bg-slate-800 text-white text-xs px-3 py-1 rounded hover:bg-slate-900 transition-colors">Process Pay</button>
                      </td>
                    </tr>
                  ))}
                  {staff.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">No staff members to process.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "transactions" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 animate-in fade-in">
            <div className="flex flex-wrap gap-4 items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-600" />
                Staff Transactions
              </h3>
              <button 
                onClick={() => {
                  if (!onUpdateStaffTransactions) return;
                  const randomStaff = staff.length > 0 ? staff[0].name : "Unknown";
                  onUpdateStaffTransactions([...staffTransactions, {
                    id: Date.now().toString(),
                    staffId: randomStaff,
                    date: new Date().toISOString().split('T')[0],
                    type: "Advance",
                    amount: 1000
                  }]);
                }}
                className="bg-emerald-100 text-emerald-700 px-4 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-emerald-200"
              >
                <Plus className="w-4 h-4" /> Add Transaction
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-bold">Date</th>
                    <th className="px-4 py-3 font-bold">Staff Member</th>
                    <th className="px-4 py-3 font-bold">Type</th>
                    <th className="px-4 py-3 font-bold text-right">Amount (৳)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {staffTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-slate-600">{tx.date}</td>
                      <td className="px-4 py-3 font-bold text-slate-800">{tx.staffId}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          tx.type === 'Bonus' ? 'bg-emerald-100 text-emerald-700' :
                          tx.type === 'Penalty' ? 'bg-rose-100 text-rose-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {tx.type}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-right text-slate-700">{tx.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {staffTransactions.length === 0 && (
                     <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No transactions recorded.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
