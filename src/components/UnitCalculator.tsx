import React, { useState } from "react";

export default function UnitCalculator() {
  const [totalWeight, setTotalWeight] = useState("");
  const [pieceWeight, setPieceWeight] = useState("");
  const [showResult, setShowResult] = useState(false);
  const [totalPieces, setTotalPieces] = useState(0);

  const calculatePieces = () => {
    const weight = parseFloat(totalWeight);
    const piece = parseFloat(pieceWeight);

    if (isNaN(weight) || isNaN(piece) || weight <= 0 || piece <= 0) {
      alert("Please enter valid Weight (KG) and Weight Per Piece (Gram).");
      return;
    }

    const pieces = (weight * 1000) / piece;
    setTotalPieces(Math.round(pieces));
    setShowResult(true);
  };

  const resetCalculator = () => {
    setTotalWeight("");
    setPieceWeight("");
    setShowResult(false);
    setTotalPieces(0);
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-100 p-6 max-w-lg mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-black text-emerald-600 mb-1">Unit Calculator</h2>
        <p className="text-sm font-bold text-slate-500">Alisha Food & Beverage</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Total Weight (KG)</label>
          <input
            type="number"
            value={totalWeight}
            onChange={(e) => setTotalWeight(e.target.value)}
            placeholder="Example: 1400"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg"
            onKeyDown={(e) => e.key === "Enter" && calculatePieces()}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-1.5">Weight Per Piece (Gram)</label>
          <input
            type="number"
            value={pieceWeight}
            onChange={(e) => setPieceWeight(e.target.value)}
            placeholder="Example: 90"
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-emerald-500 transition-colors font-mono text-lg"
            onKeyDown={(e) => e.key === "Enter" && calculatePieces()}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={calculatePieces}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            CALCULATE
          </button>
          <button
            onClick={resetCalculator}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-4 rounded-xl transition-colors cursor-pointer"
          >
            RESET
          </button>
        </div>

        {showResult && (
          <div className="mt-6 bg-emerald-50 border-l-4 border-emerald-500 p-5 rounded-r-xl animate-in fade-in slide-in-from-bottom-4 duration-300">
            <h3 className="text-center font-bold text-emerald-700 mb-4">Total Calculation</h3>
            
            <div className="text-sm text-slate-600 mb-4 font-mono bg-white/60 p-2 rounded text-center">
              Formula: <span className="font-bold text-emerald-700">({totalWeight} × 1000) ÷ {pieceWeight}</span>
            </div>

            <div className="text-center">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Total Pieces</p>
              <h1 className="text-4xl font-black text-emerald-600">{totalPieces.toLocaleString("en-US")} Pcs</h1>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
