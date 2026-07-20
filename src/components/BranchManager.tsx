import React, { useState, useRef } from "react";
import { Branch } from "../types";
import { Building2, Plus, MapPin, Store, Upload, Image as ImageIcon, Sparkles } from "lucide-react";

interface BranchManagerProps {
  branches: Branch[];
  activeBranchId: string;
  onSwitchBranch: (id: string) => void;
  onAddBranch: (name: string, location: string, logoUrl?: string, themeColor?: string) => void;
}

export default function BranchManager({
  branches,
  activeBranchId,
  onSwitchBranch,
  onAddBranch,
}: BranchManagerProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [logoUrl, setLogoUrl] = useState<string | undefined>(undefined);
  const [themeColor, setThemeColor] = useState("#D31D1D");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setError("Logo image size must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
        setError("");
      };
      reader.onerror = () => {
        setError("Error reading file");
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Please enter a branch or factory name.");
      return;
    }
    if (!location.trim()) {
      setError("Please enter the branch location.");
      return;
    }
    onAddBranch(name.trim(), location.trim(), logoUrl, themeColor);
    setSuccess(`Branch "${name}" successfully registered!`);
    setName("");
    setLocation("");
    setLogoUrl(undefined);
    setThemeColor("#D31D1D");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setError("");

    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div id="branch-manager-panel" className="space-y-6">
      {/* Dynamic Branch Creation Header Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-slate-800">
        <div>
          <h2 className="text-xl font-extrabold flex items-center gap-2 tracking-tight text-white">
            <Building2 className="w-5 h-5 text-emerald-400" />
            Branch & Factory Registry
          </h2>
          <p className="text-xs text-slate-400 mt-1.5 max-w-xl leading-relaxed">
            You currently have <span className="text-emerald-400 font-bold">{branches.length} active branches</span>. Register new factories to isolate inventory, production logs, sales trends, and upload dedicated branch logos.
          </p>
        </div>
        <div className="bg-slate-800/80 px-4 py-2.5 rounded-xl border border-slate-700/60 flex items-center gap-2 self-start md:self-auto">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-[11px] font-mono text-slate-300">Clean Minimal Edition</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Branch Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs h-fit">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Add New Branch</h3>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Factory / Branch Name</label>
              <input
                type="text"
                placeholder="e.g., Alisha Packaging Unit"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-sm border border-slate-200 rounded-xl px-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Location Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <MapPin className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  placeholder="e.g., BSCIC Area, Bogura"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full text-sm border border-slate-200 rounded-xl pl-10 pr-3.5 py-2.5 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
              <p className="text-xs font-bold text-emerald-800">Authentication is managed centrally</p>
              <p className="text-[11px] text-emerald-700 mt-1 leading-relaxed">New branches use the secure administrator account configured on the server. Passwords are never stored in branch data or browser storage.</p>
            </div>

            {/* Branch Logo Upload Form Widget */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch Logo</label>
              <div className="space-y-3">
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-slate-50/30 hover:bg-emerald-50/10 transition-all flex flex-col items-center justify-center gap-2"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  {logoUrl ? (
                    <div className="relative group">
                      <img 
                        src={logoUrl} 
                        className="h-16 w-16 object-contain rounded-lg border border-slate-200 bg-white p-1" 
                        alt="Branch Logo Preview" 
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center text-white text-[10px] font-bold">
                        Change
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                        <Upload className="w-4 h-4 text-slate-400" />
                      </div>
                      <p className="text-xs text-slate-600 font-medium">Click to select branch logo image</p>
                      <p className="text-[10px] text-slate-400">JPG, PNG or SVG under 2MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Branch Accent Color Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Branch Accent Color</label>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                {[
                  { hex: "#D31D1D", name: "Alisha Red" },
                  { hex: "#D97706", name: "Amber" },
                  { hex: "#4F46E5", name: "Indigo" },
                  { hex: "#059669", name: "Emerald" },
                  { hex: "#E11D48", name: "Rose" },
                  { hex: "#7C3AED", name: "Violet" }
                ].map((color) => (
                  <button
                    key={color.hex}
                    type="button"
                    onClick={() => setThemeColor(color.hex)}
                    className={`w-7 h-7 rounded-full transition-all relative border cursor-pointer ${
                      themeColor === color.hex 
                        ? "ring-2 ring-offset-2 ring-slate-800 scale-110" 
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: color.hex, borderColor: "rgba(0,0,0,0.1)" }}
                    title={color.name}
                  >
                    {themeColor === color.hex && (
                      <span className="absolute inset-0 flex items-center justify-center text-white text-[10px] font-bold">
                        ✓
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs font-medium rounded-xl border border-red-100">
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs font-medium rounded-xl border border-emerald-100">
                {success}
              </div>
            )}

            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs uppercase tracking-wider py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>Create Branch</span>
            </button>
          </form>
        </div>

        {/* Existing Branches List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Factory List</h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {branches.map((b) => {
              const isActive = b.id === activeBranchId;
              return (
                 <div
                  key={b.id}
                  className={`bg-white rounded-2xl border p-5 flex flex-col justify-between gap-5 transition-all ${
                    isActive 
                      ? "ring-4 shadow-xs" 
                      : "border-slate-100 hover:border-slate-200/80 hover:shadow-xs"
                  }`}
                  style={isActive ? { 
                    borderColor: b.themeColor || "#059669", 
                    boxShadow: `0 0 0 4px ${(b.themeColor || "#059669")}15`
                  } : {}}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div 
                          className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center border transition-colors"
                          style={isActive ? {
                            backgroundColor: `${b.themeColor || "#059669"}10`,
                            color: b.themeColor || "#059669",
                            borderColor: `${b.themeColor || "#059669"}30`
                          } : {
                            backgroundColor: "#f8fafc",
                            color: "#64748b",
                            borderColor: "#e2e8f0"
                          }}
                        >
                          {b.logoUrl ? (
                            <img 
                              src={b.logoUrl} 
                              className="w-10 h-10 object-contain rounded-lg p-0.5" 
                              alt={`${b.name} Logo`} 
                            />
                          ) : (
                            <Store className="w-5 h-5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 text-sm truncate">{b.name}</h4>
                          <span className="flex items-center gap-0.5 text-[11px] text-slate-400 mt-0.5 truncate">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                            {b.location}
                          </span>
                        </div>
                      </div>
                      {isActive && (
                        <span 
                          className="text-white text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider shrink-0"
                          style={{ backgroundColor: b.themeColor || "#059669" }}
                        >
                          Active
                        </span>
                      )}
                    </div>

                    {/* Stats Summary */}
                    <div className="grid grid-cols-3 gap-2 mt-5 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50">
                      <div className="text-center min-w-0">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Sales</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block font-mono">
                          {b.sales.toLocaleString()} ৳
                        </span>
                      </div>
                      <div className="text-center min-w-0 border-x border-slate-100">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Items</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block font-mono">
                          {b.items.length} Pcs
                        </span>
                      </div>
                      <div className="text-center min-w-0">
                        <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Log Cost</span>
                        <span className="text-xs font-extrabold text-slate-800 truncate block font-mono">
                          {b.production.reduce((sum, p) => sum + p.productionCost, 0).toLocaleString()} ৳
                        </span>
                      </div>
                    </div>
                  </div>

                  {!isActive && (
                    <button
                      onClick={() => onSwitchBranch(b.id)}
                      className="w-full bg-slate-50 hover:bg-emerald-50 hover:text-emerald-700 text-slate-600 font-extrabold text-xs py-2.5 rounded-xl transition-all border border-slate-100/80 active:scale-[0.98]"
                    >
                      Switch to Factory
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
