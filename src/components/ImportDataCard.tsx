import React, { useState } from "react";
import { UploadCloud, Loader2, FileText } from "lucide-react";

interface ImportDataCardProps {
  entityType: "customers" | "suppliers" | "expenses" | "production";
  onImportData: (data: any[]) => void;
}

export default function ImportDataCard({ entityType, onImportData }: ImportDataCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const getPrompt = () => {
    switch (entityType) {
      case "customers":
        return `You are an expert data entry assistant. Analyze the provided image of a customer list. The text might be in Bengali or English.
Carefully extract every row of the customers and return ONLY a JSON array of objects.
Each object must have exactly this structure:
{ "name": "...", "email": "...", "phone": "...", "due": 0, "totalSales": 0 }

Rules:
1. Map customer name to 'name' (keep original language).
2. Map email to 'email' (if missing, use "").
3. Map phone number to 'phone' (if missing, use "").
4. Map due amount to 'due' (MUST be a number, remove commas, default to 0).
5. Map total sales/purchases to 'totalSales' (MUST be a number, remove commas, default to 0).
6. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`;

      case "suppliers":
        return `You are an expert data entry assistant. Analyze the provided image of a supplier/vendor list. The text might be in Bengali or English.
Carefully extract every row of the suppliers and return ONLY a JSON array of objects.
Each object must have exactly this structure:
{ "name": "...", "email": "...", "phone": "...", "outstanding": 0 }

Rules:
1. Map supplier name to 'name' (keep original language).
2. Map email to 'email' (if missing, use "").
3. Map phone number to 'phone' (if missing, use "").
4. Map outstanding/due amount to 'outstanding' (MUST be a number, remove commas, default to 0).
5. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`;

      case "expenses":
        return `You are an expert data entry assistant. Analyze the provided image of an expense ledger, receipt, or bill (e.g. electric bill, purchase voucher). The text might be in Bengali or English.
Carefully extract the expense data. If it's a single receipt/bill, return an array with ONE object. If it's a ledger, return an array of all rows.
Each object must have exactly this structure:
{ "category": "...", "amount": 0, "date": "YYYY-MM-DD", "description": "..." }

Rules:
1. Map expense category/type to 'category' (e.g. "Electric Bill", "Transport", keep original language if needed).
2. Map total amount to 'amount' (MUST be a number, remove commas). If missing, output 0.
3. Map date to 'date' (format as YYYY-MM-DD). If missing, use today's date (${new Date().toISOString().split('T')[0]}).
4. Map description/details to 'description'.
5. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`;

      case "production":
        return `You are an expert data entry assistant. Analyze the provided image of a production run ledger or report. The text might be in Bengali or English.
Carefully extract every row of the production records and return ONLY a JSON array of objects.
Each object must have exactly this structure:
{ "itemName": "...", "cost": 0, "date": "YYYY-MM-DD" }

Rules:
1. Map item/product name to 'itemName' (keep original language).
2. Map production cost/amount to 'cost' (MUST be a number, remove commas). If missing, output 0.
3. Map date to 'date' (format as YYYY-MM-DD). If missing, use today's date (${new Date().toISOString().split('T')[0]}).
4. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`;

      default:
        return "";
    }
  };

  const getTitle = () => {
    switch (entityType) {
      case "customers": return "Upload Customer List (কাস্টমার লিস্ট আপলোড)";
      case "suppliers": return "Upload Supplier List (সাপ্লায়ার লিস্ট আপলোড)";
      case "expenses": return "Upload Expense Voucher (খরচের ভাউচার আপলোড)";
      case "production": return "Upload Production Ledger (প্রোডাকশন লেজার আপলোড)";
      default: return "Upload Image";
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setStatus("Analyzing image...");

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: getPrompt(),
            image: base64File,
          }),
        });

        if (!response.ok) throw new Error("Failed to parse file");
        
        const data = await response.json();
        
        let text = data.text.trim();
        if (text.startsWith("\`\`\`json")) text = text.replace(/^\`\`\`json/, "");
        if (text.startsWith("\`\`\`")) text = text.replace(/^\`\`\`/, "");
        if (text.endsWith("\`\`\`")) text = text.replace(/\`\`\`$/, "");
        text = text.trim();

        try {
            const parsedData = JSON.parse(text);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              onImportData(parsedData);
              setStatus("Data imported successfully!");
            } else {
               throw new Error("No data extracted.");
            }
        } catch (e: any) {
            console.error("Parse error", e);
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
              const parsedData = JSON.parse(jsonMatch[0]);
              if (parsedData.length > 0) {
                onImportData(parsedData);
                setStatus("Data imported successfully!");
              } else {
                throw new Error("No data matched your criteria.");
              }
            } else {
               throw new Error(e.message || "Could not extract data.");
            }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setStatus("Error parsing image.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4 mb-6">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        {getTitle()}
      </h3>
      <p className="text-xs text-slate-500 mb-2">Upload a picture of your previous software list or manual register to automatically extract and log the entries.</p>
      
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
          {loading ? "Processing..." : "Extract Data"}
        </button>
      </div>
      {status && <p className={`text-xs font-bold ${status.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>{status}</p>}
    </div>
  );
}
