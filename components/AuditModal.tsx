
import React, { useEffect, useState } from 'react';
import { Audit, AuditType, VoiceAudit, ChatAudit, Language, RubricItem } from '../types';
import { X, FileDown, Trash2, Tag, Hash, ChevronDown, FileText, Edit } from 'lucide-react';
import { Button } from './ui/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { translations } from '../utils/translations';
import { getAppSettings, getRubric, downloadCSV } from '../services/storageService';
import { toast } from 'react-hot-toast';

interface AuditModalProps {
  audit: Audit | null;
  onClose: () => void;
  onDelete?: (id: string) => void; 
  onEdit?: (audit: Audit) => void;
  lang: Language;
}

export const AuditModal: React.FC<AuditModalProps> = ({ audit, onClose, onDelete, onEdit, lang }) => {
  const t = translations[lang];
  const [rubric, setRubric] = useState<RubricItem[]>([]);
  const [showExportMenu, setShowExportMenu] = useState(false);

  useEffect(() => {
    setRubric(getRubric());
  }, []);

  if (!audit) return null;

  const getRubricLabel = (id: string) => {
      const item = rubric.find(r => r.id === id);
      if (!item) return id;
      return t[item.id] || item.label;
  };

  const formatDuration = (minutes: number) => {
      if(!minutes) return "0m";
      const m = Math.floor(minutes);
      const s = Math.round((minutes - m) * 60);
      return `${m}m ${s}s`;
  };

  const handleDelete = () => {
    if (onDelete && audit) {
        onDelete(audit.id);
        onClose();
    }
  };
  
  const handleEdit = () => {
      if(onEdit && audit) {
          onEdit(audit);
          onClose();
      }
  };

  const handleExportCSV = () => {
      downloadCSV([audit]);
      setShowExportMenu(false);
  }

  const handleExportJSON = () => {
      const blob = new Blob([JSON.stringify(audit, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ACPIA_${audit.readableId}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setShowExportMenu(false);
  }

  const handleExportPDF = () => {
    try {
        const doc = new jsPDF('p', 'pt', 'a4'); 
        const settings = getAppSettings();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        const primaryColor: [number, number, number] = [15, 23, 42]; 
        const accentColor: [number, number, number] = [79, 70, 229]; 
        
        const marginLeft = 40;
        const marginRight = 40;
        const contentWidth = pageWidth - marginLeft - marginRight;
        
        // Header Curve
        doc.setFillColor(...primaryColor);
        doc.path([
            ['M', 0, 0],
            ['L', pageWidth, 0],
            ['L', pageWidth, 90],
            ['C', pageWidth, 90, pageWidth / 2, 140, 0, 90], 
            ['Z']
        ]);
        doc.fill();

        // Logo Handling with validation
        if (settings.logoBase64 && settings.logoBase64.startsWith('data:image')) {
            try {
                const imgProps = doc.getImageProperties(settings.logoBase64);
                const ratio = imgProps.width / imgProps.height;
                const h = 40; 
                const w = h * ratio;
                doc.addImage(settings.logoBase64, 'PNG', marginLeft, 25, w, h);
            } catch (e) { 
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(20);
                doc.text(settings.companyName || "ACPIA", marginLeft, 55);
            }
        } else {
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(24);
            doc.setFont("helvetica", "bold");
            doc.text(settings.companyName || "ACPIA", marginLeft, 60);
        }

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.text("REPORTE DE CALIDAD", pageWidth - marginRight, 50, { align: 'right' });
        doc.setFontSize(10);
        doc.text(`Ticket #${audit.readableId}`, pageWidth - marginRight, 65, { align: 'right' });
        doc.text(audit.date, pageWidth - marginRight, 78, { align: 'right' });

        const drawFooter = (pageNumber: number) => {
            const footerH = 40;
            const footerY = pageHeight - footerH;
            doc.setFillColor(...primaryColor);
            doc.rect(0, footerY, pageWidth, footerH, 'F');
            doc.setTextColor(255, 255, 255);
            doc.setFontSize(9);
            doc.text(`${settings.companyName} | Gestión de Calidad`, marginLeft, footerY + 25);
            doc.text(`Pagina ${pageNumber}`, pageWidth - marginRight, footerY + 25, { align: 'right' });
        };

        let y = 160;

        // Agent Summary Card
        doc.setDrawColor(230, 230, 230);
        doc.setFillColor(252, 252, 252);
        doc.roundedRect(marginLeft, y, contentWidth, 70, 5, 5, 'FD');
        
        doc.setFillColor(...accentColor);
        doc.circle(marginLeft + 35, y + 35, 20, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(16);
        doc.text(audit.agentName.charAt(0), marginLeft + 35, y + 41, { align: 'center' });

        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(audit.agentName, marginLeft + 70, y + 25);
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.text(`Proyecto: ${audit.project} | Canal: ${audit.type === AuditType.VOICE ? 'Voz' : 'Chat'}`, marginLeft + 70, y + 45);

        const scoreColor = audit.qualityScore >= 90 ? [34, 197, 94] : audit.qualityScore >= 70 ? [234, 179, 8] : [239, 68, 68];
        doc.setTextColor(scoreColor[0], scoreColor[1], scoreColor[2] as number);
        doc.setFontSize(28);
        doc.text(`${audit.qualityScore}%`, pageWidth - marginRight - 30, y + 45, { align: 'right' });
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text("SCORE FINAL", pageWidth - marginRight - 30, y + 15, { align: 'right' });

        y += 90;

        // Metrics Table using explicit autoTable
        const tableRows: any[][] = [];
        if (audit.customData) {
            Object.entries(audit.customData).forEach(([key, val]) => {
                tableRows.push([getRubricLabel(key), val ? (lang === 'es' ? 'CUMPLE' : 'PASS') : (lang === 'es' ? 'NO CUMPLE' : 'FAIL')]);
            });
        }
        if (audit.type === AuditType.VOICE) {
            tableRows.push([t.perception, t[(audit as VoiceAudit).perception] || (audit as VoiceAudit).perception]);
            tableRows.push([t.duration, formatDuration((audit as VoiceAudit).duration)]);
        } else {
            tableRows.push([t.response5min, (audit as ChatAudit).responseUnder5Min ? (lang === 'es' ? 'SÍ' : 'YES') : 'NO']);
        }

        autoTable(doc, {
            startY: y,
            head: [[t.metric.toUpperCase(), t.result.toUpperCase()]],
            body: tableRows,
            theme: 'grid',
            margin: { left: marginLeft, right: marginRight },
            headStyles: { fillColor: primaryColor, textColor: [255, 255, 255] },
            columnStyles: { 1: { cellWidth: 100, halign: 'center' } },
            didParseCell: (data) => {
                if (data.section === 'body' && data.column.index === 1) {
                    const txt = data.cell.raw as string;
                    if (['NO CUMPLE', 'FAIL', 'Poor', 'Deficiente', 'NO'].includes(txt)) {
                        data.cell.styles.textColor = [220, 38, 38];
                    } else if (['CUMPLE', 'PASS', 'Optimal', 'Óptimo', 'SÍ', 'YES'].includes(txt)) {
                        data.cell.styles.textColor = [22, 163, 74];
                    }
                }
            }
        });

        y = (doc as any).lastAutoTable.finalY + 30;

        // Notes and AI Feedback
        if (audit.notes) {
            if (y + 100 > pageHeight - 60) { doc.addPage(); y = 50; }
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.setFont("helvetica", "bold");
            doc.text(t.auditorNotes, marginLeft, y);
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            const splitNotes = doc.splitTextToSize(audit.notes, contentWidth);
            doc.text(splitNotes, marginLeft, y + 15);
            y += (splitNotes.length * 12) + 30;
        }

        if (audit.aiNotes) {
            if (y + 100 > pageHeight - 60) { doc.addPage(); y = 50; }
            const aiText = doc.splitTextToSize(audit.aiNotes, contentWidth - 30);
            const boxH = (aiText.length * 12) + 40;
            doc.setFillColor(240, 245, 255);
            doc.roundedRect(marginLeft, y, contentWidth, boxH, 5, 5, 'F');
            doc.setTextColor(...accentColor);
            doc.setFont("helvetica", "bold");
            doc.text(t.aiFeedback, marginLeft + 15, y + 20);
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            doc.text(aiText, marginLeft + 15, y + 35);
        }

        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            drawFooter(i);
        }
        
        doc.save(`ACPIA_${audit.readableId}_${audit.agentName}.pdf`);
        toast.success("PDF generado.");
        setShowExportMenu(false);
    } catch (err) {
        console.error(err);
        toast.error("Error al generar PDF.");
    }
  };

  const renderBool = (val: boolean) => (
    <span className={`px-2 py-1 rounded text-xs font-bold ${val ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
        {val ? 'YES' : 'NO'}
    </span>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850">
            <div>
                <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{audit.agentName}</h3>
                    {audit.readableId && <span className="px-2 py-0.5 bg-indigo-500/20 text-indigo-500 text-xs rounded font-mono font-bold">#{audit.readableId}</span>}
                </div>
                <p className="text-slate-500 text-sm">{audit.project} • {audit.date}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400">
                <X className="w-6 h-6" />
            </button>
        </div>
        
        <div className="p-6 overflow-y-auto">
             <div className="mb-6 flex items-center gap-4 bg-slate-100 dark:bg-slate-800/50 p-4 rounded-lg">
                <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase">{t.csat}</span>
                    <span className="text-2xl font-bold dark:text-white">{audit.csat}/5</span>
                </div>
                <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                <div className="flex flex-col">
                    <span className="text-slate-500 text-xs uppercase">{t.score}</span>
                    <span className={`text-2xl font-bold ${audit.qualityScore >= 80 ? 'text-green-500' : 'text-yellow-500'}`}>{audit.qualityScore || 0}%</span>
                </div>
             </div>

            <div className="grid grid-cols-1 gap-2">
                 {audit.customData && Object.entries(audit.customData).map(([key, val]) => (
                     <div key={key} className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 py-2 text-slate-700 dark:text-slate-300">
                         <span className="text-sm">{getRubricLabel(key)}</span>
                         {renderBool(val as boolean)}
                     </div>
                 ))}

                 {audit.type === AuditType.VOICE && (
                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 py-2 text-slate-700 dark:text-slate-300">
                        <span className="text-sm">{t.duration}</span> 
                        <span className="text-sm font-medium dark:text-white">{formatDuration((audit as VoiceAudit).duration)}</span>
                    </div>
                 )}
                 
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {audit.notes && (
                        <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">{t.auditorNotes}</h4>
                            <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{audit.notes}</div>
                        </div>
                    )}
                    {audit.aiNotes && (
                        <div>
                            <h4 className="text-xs font-bold text-indigo-500 uppercase mb-2">{t.aiFeedback}</h4>
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-sm text-slate-600 dark:text-slate-300 italic">{audit.aiNotes}</div>
                        </div>
                    )}
                 </div>
            </div>
        </div>

        <div className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 flex justify-between gap-3">
             <div className="flex gap-2">
                 {onDelete && <Button variant="danger" onClick={handleDelete} icon={<Trash2 className="w-4 h-4" />}>{t.delete}</Button>}
                 {onEdit && <Button variant="primary" onClick={handleEdit} icon={<Edit className="w-4 h-4" />}>Edit</Button>}
             </div>
             <div className="flex gap-3 relative">
                <Button variant="secondary" onClick={onClose}>{t.close}</Button>
                <div className="relative">
                    <Button onClick={() => setShowExportMenu(!showExportMenu)} icon={<FileDown className="w-4 h-4" />}>
                        {t.exportOptions} <ChevronDown className="w-4 h-4 ml-1" />
                    </Button>
                    {showExportMenu && (
                        <div className="absolute bottom-full right-0 mb-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden z-20">
                            <button onClick={handleExportPDF} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-red-500" /> {t.exportPdf}
                            </button>
                            <button onClick={handleExportCSV} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm">
                                <FileDown className="w-4 h-4 text-green-500" /> {t.exportCsv}
                            </button>
                            <button onClick={handleExportJSON} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2 text-sm">
                                <Tag className="w-4 h-4 text-blue-500" /> {t.exportJson}
                            </button>
                        </div>
                    )}
                </div>
             </div>
        </div>
      </div>
    </div>
  );
};
