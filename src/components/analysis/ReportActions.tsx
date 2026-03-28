"use client";

import { Code, Download, ShieldAlert } from "lucide-react";

type ReportActionsProps = {
  onGenerateHTML: () => void;
  onGeneratePDF: () => void;
  onReset: () => void;
};

export function ReportActions({ onGenerateHTML, onGeneratePDF, onReset }: ReportActionsProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <h2 className="text-3xl font-bold flex items-center gap-3">
        <ShieldAlert className="w-8 h-8 text-blue-500" /> Auditoria Crítica do Documento
      </h2>
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        <button
          onClick={onGenerateHTML}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-200"
        >
          <Code className="w-5 h-5" /> Exportar HTML
        </button>
        <button
          onClick={onGeneratePDF}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-200"
        >
          <Download className="w-5 h-5" /> Exportar PDF
        </button>
        <button
          onClick={onReset}
          className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-sm"
        >
          Nova Análise
        </button>
      </div>
    </div>
  );
}
