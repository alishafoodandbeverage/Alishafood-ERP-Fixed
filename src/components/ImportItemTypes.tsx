import React, { useState } from "react";
import { UploadCloud, Loader2, FileText } from "lucide-react";

interface ImportItemTypesProps {
  onImportItemTypes: (types: string[]) => void;
}

export default function ImportItemTypes({ onImportItemTypes }: ImportItemTypesProps) {
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
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64File = reader.result as string;
        
        const response = await fetch("/api/gemini/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `You are an expert data entry assistant.
Analyze the provided image which is a list or table of inventory item types.
The text is in English or Bengali.
Carefully extract the names of ALL the item types listed in the image.
Return ONLY a JSON array of strings, for example: [ "Type 1", "Type 2", ... ]

Rules:
1. Include every type name found in the list, preserving its original language (Bengali or English).
2. Do not include headers, just the actual names of the types (e.g. Cutting, Cap 1.8, Cap 5.5, Lock, Handle, Preform, Bottle).
3. Return the raw JSON array ONLY. Do not include markdown formatting like \`\`\`json. Output nothing but the array starting with [ and ending with ]. 
If no types are found, return an empty array [].`,
            image: base64File,
          }),
        });

        if (!response.ok) throw new Error("Failed to parse file");
        
        const data = await response.json();
        
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
            const types = JSON.parse(text);
            if (Array.isArray(types) && types.length > 0) {
              onImportItemTypes(types);
              setStatus("Item types imported successfully!");
            } else if (Array.isArray(types) && types.length === 0) {
              throw new Error("No item types found in the image.");
            } else {
              throw new Error("Invalid format received.");
            }
        } catch (e: any) {
            console.error("Parse error", e);
            const jsonMatch = text.match(/\[.*\]/s);
            if (jsonMatch) {
               const types = JSON.parse(jsonMatch[0]);
               if (types.length > 0) {
                 onImportItemTypes(types);
                 setStatus("Item types imported successfully!");
               } else {
                 throw new Error("No item types found in the image.");
               }
            } else {
               throw new Error(e.message || "Could not extract item types.");
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
        Import Item Types from Image
      </h3>
      <input type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100" />
      <button 
        onClick={handleUpload}
        disabled={!file || loading}
        className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UploadCloud className="w-4 h-4" />}
        {loading ? "Processing..." : "Import Types"}
      </button>
      {status && <p className={`text-xs font-bold ${status.includes("Error") ? "text-red-500" : "text-emerald-600"}`}>{status}</p>}
    </div>
  );
}
