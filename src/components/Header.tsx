import { useState, useRef, useEffect } from "react";
import { Branch } from "../types";
import AlishaLogo from "./AlishaLogo";
import { Menu, ChevronDown, Check, Building2, User, LogOut, Plus, Share2 } from "lucide-react";

interface HeaderProps {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
  onToggleSidebar: () => void;
  onOpenAddBranchModal: () => void;
  onLogout?: () => void;
}

export default function Header({
  branches,
  activeBranchId,
  onSwitchBranch,
  onToggleSidebar,
  onOpenAddBranchModal,
  onLogout,
}: HeaderProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const activeBranch = branches.find((b) => b.id === activeBranchId) || branches[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header id="app-header" className="sticky top-0 z-40 bg-white border-b border-slate-200/80 px-4 py-3 flex items-center justify-between shadow-xs">
      {/* Left Section: Sidebar Toggle for mobile & active branch indicator */}
      <div className="flex items-center gap-3">
        <button
          id="toggle-sidebar-btn"
          onClick={onToggleSidebar}
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-50 rounded-xl transition-all cursor-pointer focus:outline-hidden"
          title="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="hidden md:flex items-center gap-2 bg-emerald-50/50 text-emerald-800 border border-emerald-100/60 px-3 py-1.5 rounded-xl text-xs font-bold">
          {activeBranch.logoUrl ? (
            <img 
              src={activeBranch.logoUrl} 
              className="w-4 h-4 object-contain rounded-sm" 
              alt={`${activeBranch.name} Logo`} 
            />
          ) : (
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
          )}
          <span>Active: {activeBranch.name}</span>
        </div>
      </div>

      {/* Middle Section: Center Alisha Food & Beverage Brand Logo */}
      <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
        <AlishaLogo size="lg" />
      </div>

      {/* Right Section: Multi-branch Switcher Dropdown */}
      <div className="flex items-center gap-2" ref={dropdownRef}>
        <button
          onClick={() => {
            const shareData = {
              title: "Alisha Food & Beverage - Factory ERP",
              text: "Check out the new Factory ERP & Inventory Management App for Alisha Food & Beverage. Log in to see active branches, manage sales, and overview expenses.",
              url: window.location.href,
            };
            if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
              navigator.share(shareData).catch(console.error);
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert("App link copied to clipboard!");
            }
          }}
          className="p-2 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all cursor-pointer"
          title="Share Application"
        >
          <Share2 className="w-4 h-4" />
        </button>
        <button
          id="branch-switcher-btn"
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-slate-950 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider transition-colors shadow-xs focus:outline-hidden cursor-pointer"
        >
          {activeBranch.logoUrl && (
            <img 
              src={activeBranch.logoUrl} 
              className="w-4 h-4 object-contain rounded-xs bg-white p-0.5" 
              alt="Logo" 
            />
          )}
          <span className="max-w-[120px] sm:max-w-[180px] truncate">{activeBranch.name}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-250 ${dropdownOpen ? "rotate-180" : ""}`} />
        </button>

        {dropdownOpen && (
          <div
            id="branch-switcher-dropdown"
            className="absolute right-4 top-14 w-68 bg-white rounded-2xl shadow-xl border border-slate-100 py-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
          >
            {/* Header / Profile info */}
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <User className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Welcome Admin</p>
                <p className="text-xs font-semibold text-slate-700 truncate">alisha@beverage.com</p>
              </div>
            </div>

            {/* Profile & Sign out links */}
            <div className="py-1 border-b border-slate-100">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  alert("Profile settings is a premium management component.");
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <User className="w-4 h-4 text-slate-400" />
                Profile Settings
              </button>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  if (onLogout) {
                    onLogout();
                  } else {
                    alert("Sign out is simulated for this sandboxed prototype.");
                  }
                }}
                className="w-full text-left px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>

            {/* Switch Branch section header */}
            <div className="px-4 py-2 bg-slate-50/50 flex items-center justify-between border-b border-slate-100/50">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Switch Branch</span>
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  onOpenAddBranchModal();
                }}
                className="text-xs text-emerald-600 hover:text-emerald-800 font-bold flex items-center gap-0.5 cursor-pointer"
                title="Add New Factory / Branch"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>

            {/* Branch listing with checkmarks */}
            <div className="max-h-60 overflow-y-auto py-1">
              {branches.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    onSwitchBranch(b.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                    b.id === activeBranchId
                      ? "bg-emerald-50/70 text-emerald-800 font-bold"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 shrink-0 rounded bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200/50">
                      {b.logoUrl ? (
                        <img 
                          src={b.logoUrl} 
                          className="w-full h-full object-contain p-0.5" 
                          alt="logo" 
                        />
                      ) : (
                        <Building2 className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                    <div className="flex flex-col truncate min-w-0">
                      <span className="truncate">{b.name}</span>
                      <span className="text-[9px] text-slate-400 truncate font-normal">{b.location}</span>
                    </div>
                  </div>
                  {b.id === activeBranchId && <Check className="w-3.5 h-3.5 shrink-0 text-emerald-600" />}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
