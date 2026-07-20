import React, { useState } from "react";
import UnitCalculator from "./UnitCalculator";

export default function IntegratedCalculator() {
  const [activeTab, setActiveTab] = useState<"unit" | "normal">("unit");
  const [display, setDisplay] = useState("0");

  const handleButtonClick = (value: string) => {
    if (value === "C") setDisplay("0");
    else if (value === "=") {
      try {
        setDisplay(eval(display).toString());
      } catch {
        setDisplay("Error");
      }
    } else {
      setDisplay(display === "0" ? value : display + value);
    }
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 shadow-sm">
      <div className="flex bg-slate-100 p-1 rounded-lg mb-4">
        <button
          onClick={() => setActiveTab("unit")}
          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${activeTab === "unit" ? "bg-white text-emerald-600 shadow" : "text-slate-500"}`}
        >
          Unit Calc
        </button>
        <button
          onClick={() => setActiveTab("normal")}
          className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${activeTab === "normal" ? "bg-white text-emerald-600 shadow" : "text-slate-500"}`}
        >
          Calc
        </button>
      </div>

      {activeTab === "unit" ? (
        <div className="scale-75 origin-top -my-8">
           <UnitCalculator />
        </div>
      ) : (
        <div className="bg-white p-4 rounded-xl border">
          <div className="text-right text-lg font-mono mb-2 bg-slate-100 p-2 rounded">{display}</div>
          <div className="grid grid-cols-4 gap-2">
            {["7", "8", "9", "/", "4", "5", "6", "*", "1", "2", "3", "-", "0", "C", "=", "+"].map((btn) => (
              <button 
                key={btn}
                onClick={() => handleButtonClick(btn)}
                className="bg-slate-200 hover:bg-slate-300 p-2 rounded font-bold text-xs"
              >
                {btn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
