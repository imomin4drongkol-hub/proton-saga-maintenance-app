import { Download, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface ExportButtonsProps {
  onCSV: () => void;
  onPDF: () => void;
  disabled?: boolean;
  label?: string;
}

export default function ExportButtons({
  onCSV,
  onPDF,
  disabled,
  label = 'Export',
}: ExportButtonsProps) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={disabled}
        className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <Download className="h-4 w-4" />
        {label}
      </button>

      {open && !disabled && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            <button
              onClick={() => {
                onCSV();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <FileSpreadsheet className="h-4 w-4 text-green-600" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => {
                onPDF();
                setOpen(false);
              }}
              className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 transition hover:bg-slate-50"
            >
              <FileText className="h-4 w-4 text-red-600" />
              <span>Export PDF</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
