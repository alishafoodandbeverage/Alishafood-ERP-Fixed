import {
  LayoutDashboard,
  Receipt,
  Boxes,
  Users,
  Truck,
  TrendingDown,
  Building2,
  Factory,
  X,
  Plus,
  Share2
} from "lucide-react";
import { Branch } from "../types";

import PettyCashCard from "./PettyCashCard";
import LowStockCard from "./LowStockCard";

interface SidebarProps {
  activeTab: string;
  onChangeTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpenAddBranch: () => void;
  activeBranch?: Branch;
  onUpdatePettyCash?: (branchId: string, transactions: any[]) => void;
  onUpdateAdvances?: (branchId: string, advances: any[]) => void;
}

export default function Sidebar({
  activeTab,
  onChangeTab,
  isOpen,
  onClose,
  onOpenAddBranch,
  activeBranch,
  onUpdatePettyCash,
  onUpdateAdvances,
}: SidebarProps) {
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "items", label: "Items List", icon: Boxes },
    { id: "production", label: "Production logs", icon: Factory },
    { id: "sales", label: "Sales List", icon: Receipt },
    { id: "suppliers", label: "Suppliers List", icon: Truck },
    { id: "customers", label: "Customers List", icon: Users },
    { id: "expenses", label: "Expenses List", icon: TrendingDown },
    { id: "branches", label: "Branches / Factories", icon: Building2 },
    { id: "staff", label: "Staff & HR", icon: Users },
    { id: "integrations", label: "Integrations & Maps", icon: Share2 },
  ];

  return (
    <>
      {/* Mobile & Desktop Drawer Overlay Back Drop */}
      {isOpen && (
        <div
          id="sidebar-overlay"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Navigation Panel */}
      <aside
        id="sidebar-panel"
        className={`fixed top-0 left-0 bottom-0 z-50 w-80 bg-white border-r border-slate-200/80 flex flex-col h-screen transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Top Header Branding Block */}
        <div className="bg-slate-900 px-5 py-5 text-white flex items-center justify-between shadow-xs border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Building2 className="w-4.5 h-4.5 text-emerald-400" />
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mid Navigation Links List */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-5 space-y-1 bg-white">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Main Functions</p>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChangeTab(item.id);
                  onClose(); // Auto close sidebar drawer on mobile
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-emerald-50 text-emerald-800 font-extrabold border-l-4 border-emerald-600 pl-2 shadow-2xs"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? "text-emerald-600" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Beautiful Custom Production Card on the Left Sidebar */}
          <div id="sidebar-production-card" className="mt-6 mx-1 p-3.5 bg-slate-50 border border-slate-200/60 rounded-xl space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 rounded-md bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 text-emerald-600">
                <Factory className="w-3.5 h-3.5" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Production</span>
            </div>
            
            <div className="grid grid-cols-2 gap-1.5 pt-0.5">
              <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Runs</p>
                <p className="text-xs font-black text-slate-800 mt-0.5">
                  {activeBranch?.production?.length || 0}
                </p>
              </div>
              <div className="p-1.5 bg-white rounded-lg border border-slate-100">
                <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">Total Cost</p>
                <p className="text-xs font-black text-emerald-700 mt-0.5 truncate" title={`${activeBranch?.production?.reduce((sum, p) => sum + p.productionCost, 0).toLocaleString()} ৳`}>
                  {(activeBranch?.production?.reduce((sum, p) => sum + p.productionCost, 0) || 0).toLocaleString("en-US", { notation: "compact" })} ৳
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                onChangeTab("production");
                onClose();
              }}
              className="w-full bg-slate-800 hover:bg-slate-950 text-white text-[9px] font-bold uppercase tracking-widest py-2 rounded-lg transition-all text-center cursor-pointer block mt-2"
            >
              Configure Run
            </button>
          </div>

          {activeBranch && onUpdatePettyCash && (
            <div className="mt-4 px-1">
              <PettyCashCard 
                branch={activeBranch} 
                onUpdatePettyCash={onUpdatePettyCash} 
                onUpdateAdvances={onUpdateAdvances}
              />
            </div>
          )}

          {activeBranch && (
            <div className="mt-4 px-1">
              <LowStockCard branch={activeBranch} />
            </div>
          )}
        </nav>

        {/* Footer actions inside sidebar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3">
          <button
            onClick={onOpenAddBranch}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-wider py-3 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-2xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Branch</span>
          </button>
          <div className="text-center pt-1 pb-1">
            <p className="text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">Alisha Beverage v1.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}
