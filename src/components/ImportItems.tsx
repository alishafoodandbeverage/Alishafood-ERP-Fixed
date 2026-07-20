import React, { useState } from "react";
import { UploadCloud, Loader2, CheckCircle, FileText } from "lucide-react";

interface ImportItemsProps {
  onImportItems: (items: any[]) => void;
}

export default function ImportItems({ onImportItems }: ImportItemsProps) {
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
    setStatus("Analyzing file...");

    try {
      if (file.name.toLowerCase().endsWith('.csv')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          try {
            const text = reader.result as string;
            const lines = text.split('\n').map(l => l.trim()).filter(l => l);
            if (lines.length < 2) throw new Error("CSV is empty or invalid.");
            
            const parseCSVRow = (str: string) => {
              const arr = [];
              let quote = false;
              let col = '';
              for (let i = 0; i < str.length; i++) {
                  const c = str[i];
                  if (c === '"' && str[i+1] === '"') { col += '"'; i++; }
                  else if (c === '"') { quote = !quote; }
                  else if (c === ',' && !quote) { arr.push(col.trim()); col = ''; }
                  else { col += c; }
              }
              arr.push(col.trim());
              return arr;
            };

            const headers = parseCSVRow(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
            const parsedItems = [];
            
            for (let i = 1; i < lines.length; i++) {
               const rowObj: any = {};
               const values = parseCSVRow(lines[i]);
               headers.forEach((h, idx) => {
                 rowObj[h] = values[idx] ? values[idx].replace(/^"|"$/g, '').trim() : '';
               });
               
               const name = rowObj["Type Name"] || rowObj["Name"] || rowObj["Item Name"] || "Unknown";
               const sku = rowObj["Type Barcode"] || rowObj["Barcode"] || rowObj["SKU"] || "";
               const costStr = rowObj["Expenses Price"] || rowObj["capital of item"] || rowObj["Buy Price"] || rowObj["Cost"] || "0";
               const priceStr = rowObj["Price"] || rowObj["Sale Price"] || "0";
               const stockStr = rowObj["Quantity"] || rowObj["Stock"] || "0";
               
               const cost = parseFloat(costStr.replace(/,/g, '')) || 0;
               const price = parseFloat(priceStr.replace(/,/g, '')) || 0;
               const stock = parseFloat(stockStr.replace(/,/g, '')) || 0;
               const type = rowObj["Type"] || rowObj["Category"] || "";
               const productionDate = rowObj["Production Date"] || "";
               const expirationDate = rowObj["Expiration Date"] || "";

               parsedItems.push({
                 name,
                 sku,
                 cost,
                 price,
                 stock,
                 unit: "Pcs",
                 type,
                 productionDate,
                 expirationDate
               });
            }
            
            if (parsedItems.length > 0) {
              onImportItems(parsedItems);
              setStatus("CSV imported successfully!");
            } else {
              throw new Error("No items extracted from CSV.");
            }
          } catch(err: any) {
            console.error("CSV Parse error", err);
            setStatus("Error parsing CSV: " + (err.message || ""));
          } finally {
            setLoading(false);
            setTimeout(() => setStatus(""), 3000);
          }
        };
        reader.readAsText(file);
        return;
      }

      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `You are an expert data entry assistant.
Analyze the provided image of an inventory table.
The table contains columns such as: ITEM NAME, TYPE, BUY PRICE, SALE PRICE, QUANTITY, BARCODE.
The names are often in Bengali.
Carefully extract every row from the table and return ONLY a JSON array of objects.
Each object must have exactly this structure:
{ "name": "...", "sku": "...", "cost": 0, "price": 0, "stock": 0, "unit": "...", "type": "..." }

Rules:
1. Map 'ITEM NAME' to 'name' (keep in Bengali).
2. Map 'BARCODE' to 'sku' (if missing, use "").
3. Map 'BUY PRICE' or 'PURCHASE PRICE' to 'cost' (MUST be a number, remove commas).
4. Map 'SALE PRICE' or 'SELL PRICE' to 'price' (MUST be a number, remove commas).
5. Map 'QUANTITY' to 'stock' (MUST be a number, remove commas).
6. Map 'TYPE' to 'type'.
7. Use 'Pcs' for 'unit'.
8. If any numerical value is missing, empty, or unreadable, output 0.
Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ].`,
            image: base64File,
          }),
        });

        if (!response.ok) throw new Error("Failed to parse file");
        
        const data = await response.json();
        
        // Clean up response if it has markdown formatting
        let text = data.text.trim();
        if (text.startsWith("\`\`\`json")) {
            text = text.replace(/^\`\`\`json/, "");
        }
        if (text.startsWith("\`\`\`")) {
            text = text.replace(/^\`\`\`/, "");
        }
        if (text.endsWith("\`\`\`")) {
            text = text.replace(/\`\`\`$/, "");
        }
        text = text.trim();

        try {
            const items = JSON.parse(text);
            if (Array.isArray(items) && items.length > 0) {
              onImportItems(items);
              setStatus("Items imported successfully!");
            } else if (Array.isArray(items) && items.length === 0) {
               throw new Error("No items matched your criteria.");
            } else {
               throw new Error("Invalid format received.");
            }
        } catch (e: any) {
            console.error("Parse error", e);
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
              const items = JSON.parse(jsonMatch[0]);
              if (items.length > 0) {
                onImportItems(items);
                setStatus("Items imported successfully!");
              } else {
                throw new Error("No items matched your criteria.");
              }
            } else {
               throw new Error(e.message || "Could not extract items.");
            }
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setStatus("Error parsing file.");
    } finally {
      setLoading(false);
      setTimeout(() => setStatus(""), 3000);
    }
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
      <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
        <FileText className="w-4 h-4 text-emerald-600" />
        Import Items from CSV, PDF, or Image
      </h3>
      <input type="file" accept=".csv,text/csv,application/pdf,image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      <button 
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        {loading ? "Processing..." : "Import Items"}
      </button>
      {status && <p className={`text-xs font-bold ${status.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>{status}</p>}
    </div>
  );
}
