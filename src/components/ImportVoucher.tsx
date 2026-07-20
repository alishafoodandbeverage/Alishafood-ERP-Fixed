import React, { useState } from "react";
import { UploadCloud, Loader2, FileText } from "lucide-react";
import { Sale } from "../types";

interface ImportVoucherProps {
  onImportSales: (sales: { itemName: string; quantity: number; price: number; date: string; customerName: string }[]) => void;
}

export default function ImportVoucher({ onImportSales }: ImportVoucherProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus("Analyzing voucher...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `You are an expert data entry assistant. Analyze the provided image of a sales voucher/receipt.
The voucher contains items sold, quantity, price, customer name, and date. The text might be in Bengali or English.
Carefully extract every row of the sold items and return ONLY a JSON array of objects.
Each object must have exactly this structure:
{ "itemName": "...", "quantity": 0, "price": 0, "date": "YYYY-MM-DD", "customerName": "..." }

Rules:
1. Map the item name to 'itemName' (keep the original language, Bengali or English).
2. Map the quantity sold to 'quantity' (MUST be a number, remove commas). If missing, output 0.
3. Map the sale price per unit to 'price' (MUST be a number, remove commas). If missing, output 0.
4. If a date is visible on the voucher, format it as YYYY-MM-DD. If missing, use today's date (e.g. 2026-07-18).
5. Extract the customer name or shop name if visible and map it to 'customerName'. If missing, use "Unknown".
6. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`,
            image: base64File,
          }),
        });

        if (!response.ok) throw new Error("Failed to parse file");
        
        const data = await response.json();
        
        // Clean up response if it has markdown formatting
        let text = data.text.trim();
        if (text.startsWith("\`\`\`json")) text = text.replace(/^\`\`\`json/, "");
        if (text.startsWith("\`\`\`")) text = text.replace(/^\`\`\`/, "");
        if (text.endsWith("\`\`\`")) text = text.replace(/\`\`\`$/, "");
        text = text.trim();

        try {
            const items = JSON.parse(text);
            if (Array.isArray(items) && items.length > 0) {
              onImportSales(items);
              setStatus("Sales imported successfully!");
            } else {
               throw new Error("No sales extracted.");
            }
        } catch (e: any) {
            console.error("Parse error", e);
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
              const items = JSON.parse(jsonMatch[0]);
              if (items.length > 0) {
                onImportSales(items);
                setStatus("Sales imported successfully!");
              } else {
                throw new Error("No sales matched your criteria.");
              }
            } else {
               throw new Error(e.message || "Could not extract sales.");
            }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setStatus("Error parsing voucher.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        Upload Voucher Image (ভাউচার আপলোড করুন)
      </h3>
      <p className="text-xs text-slate-500 mb-2">Upload a picture of a sales voucher to automatically log the sales and deduct stock.</p>
      
      <div className="flex flex-col sm:flex-row gap-3">
        <input 
          type="file" 
          accept="image/png,image/jpeg,image/jpg" 
          onChange={handleFileChange} 
          className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer" 
        />
        <button 
          onClick={handleUpload}
          disabled={!file || loading}
          className="shrink-0 py-2 px-6 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
          {loading ? "Processing..." : "Generate Sales"}
        </button>
      </div>
      {status && <p className={`text-xs font-bold ${status.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>{status}</p>}
    </div>
  );
}
