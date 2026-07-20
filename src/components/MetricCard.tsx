import { ReactNode, useState } from "react";
import { DownloadCloud, CloudUpload, Loader2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { uploadPdfToDrive } from "../utils/googleDrive";

interface MetricCardProps {
  id: string;
  label: string;
  value: string | number;
  icon: ReactNode;
  isCurrency?: boolean;
}

export default function MetricCard({ id, label, value, icon, isCurrency = false }: MetricCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const generatePDFBlob = () => {
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [100, 60] // small card size
    });
    
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 100, 15, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("ALISHA FACTORY METRIC", 5, 10);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(label.toUpperCase(), 5, 25);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    const displayValue = typeof value === "number" ? value.toLocaleString() : value;
    doc.text(`${displayValue} ${isCurrency ? "BDT" : ""}`, 5, 35);
    
    return doc.output("blob");
  };

  const handleDownload = () => {
    const blob = generatePDFBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.replace(/ /g, "_")}_Metric.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDriveUpload = async () => {
    setIsUploading(true);
    try {
      const blob = generatePDFBlob();
      const link = await uploadPdfToDrive(blob, `${label.replace(/ /g, "_")}_Metric.pdf`, "Alisha Factory Exports");
      alert(`Successfully uploaded to Google Drive!\nLink: ${link}`);
    } catch (error: any) {
      alert(`Drive upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div
      id={`metric-card-${id}`}
      className="bg-white rounded-2xl border border-slate-100 p-5 flex items-center gap-4.5 shadow-xs transition-all duration-300 hover:shadow-md hover:border-slate-200/80 hover:-translate-y-0.5 group relative"
    >
      {/* Icon Wrapper */}
      <div className="w-11 h-11 shrink-0 rounded-xl flex items-center justify-center bg-slate-50 text-slate-500 border border-slate-100/60 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:border-emerald-100/60">
        {icon}
      </div>

      {/* Metric details */}
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-black text-slate-800 tracking-tight truncate font-sans">
            {typeof value === "number" ? value.toLocaleString() : value}
          </span>
          {isCurrency && <span className="text-xs font-extrabold text-slate-500 font-sans">৳</span>}
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="absolute top-2 right-2 flex gap-1">
        <button 
          onClick={handleDownload}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded border border-slate-100 transition-colors cursor-pointer"
          title="Download PDF"
        >
          <DownloadCloud className="w-3.5 h-3.5" />
        </button>
        <button 
          onClick={handleDriveUpload}
          disabled={isUploading}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded border border-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          title="Upload to Google Drive"
        >
          {isUploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
        </button>
      </div>
    </div>
  );
}
