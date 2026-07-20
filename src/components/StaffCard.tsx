import React, { useState } from "react";
import { Users, Phone, Mail, DownloadCloud, CloudUpload, Loader2, Edit2, Trash2 } from "lucide-react";
import { jsPDF } from "jspdf";
import { uploadPdfToDrive } from "../utils/googleDrive";
import { Staff } from "../types";

interface StaffCardProps {
  branchName?: string;
  staff?: Staff[];
  onAdd?: () => void;
  onEdit?: (staff: Staff) => void;
  onDelete?: (id: string) => void;
}

export default function StaffCard({ branchName, staff = [], onAdd, onEdit, onDelete }: StaffCardProps) {
  const [isUploading, setIsUploading] = useState(false);

  const generatePDFBlob = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });
    
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 20, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text(`ALISHA FACTORY STAFF DIRECTORY: ${branchName || "All Branches"}`, 10, 14);
    
    doc.setTextColor(50, 50, 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    
    let y = 30;
    staff.forEach(s => {
      doc.setFont("helvetica", "bold");
      doc.text(`Name: ${s.name}`, 10, y);
      doc.setFont("helvetica", "normal");
      doc.text(`Role: ${s.role}`, 10, y + 6);
      doc.text(`Phone: ${s.phone}`, 10, y + 12);
      if (s.email) {
        doc.text(`Email: ${s.email}`, 10, y + 18);
      }
      y += 28;
    });
    
    return doc.output("blob");
  };

  const handleDownload = () => {
    const blob = generatePDFBlob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Staff_Directory_${branchName?.replace(/ /g, "_") || "All"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDriveUpload = async () => {
    setIsUploading(true);
    try {
      const blob = generatePDFBlob();
      const link = await uploadPdfToDrive(blob, `Staff_Directory_${branchName?.replace(/ /g, "_") || "All"}.pdf`, "Alisha Factory Exports");
      alert(`Successfully uploaded to Google Drive!\nLink: ${link}`);
    } catch (error: any) {
      alert(`Drive upload failed: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col h-full group relative">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-black text-slate-800 tracking-tight uppercase flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-600" />
            Key Staff
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">
            {branchName || "All Branches"} Directory
          </p>
        </div>
      </div>
      
      {/* Action Buttons */}
      <div className="absolute top-4 right-4 flex gap-2">
        <button 
          onClick={handleDownload}
          className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded border border-slate-100 transition-colors cursor-pointer"
          title="Download PDF"
        >
          <DownloadCloud className="w-4 h-4" />
        </button>
        <button 
          onClick={handleDriveUpload}
          disabled={isUploading}
          className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-500 hover:text-blue-700 rounded border border-blue-100 transition-colors cursor-pointer disabled:opacity-50"
          title="Upload to Google Drive"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CloudUpload className="w-4 h-4" />}
        </button>
      </div>

      <div className="space-y-3 flex-1 overflow-y-auto pr-1">
        {staff.map((member) => (
          <div key={member.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50 hover:bg-white hover:border-slate-200 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-sm uppercase">
                {member.name.substring(0, 2)}
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">{member.name}</p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">{member.role}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a href={`tel:${member.phone}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Call">
                <Phone className="w-4 h-4" />
              </a>
              {member.email && (
                <a href={`mailto:${member.email}`} className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer" title="Email">
                  <Mail className="w-4 h-4" />
                </a>
              )}
              {onEdit && (
                <button onClick={() => onEdit(member)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer" title="Edit">
                  <Edit2 className="w-4 h-4" />
                </button>
              )}
              {onDelete && (
                <button onClick={() => onDelete(member.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      
      <button onClick={onAdd} className="w-full mt-4 py-2.5 border-2 border-dashed border-slate-200 text-slate-500 hover:border-emerald-500 hover:text-emerald-600 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer">
        + Add Staff Member
      </button>
    </div>
  );
}
