"use client";

import { UploadCloud, Search } from "lucide-react";

type UploadPanelProps = {
  file: File | null;
  error: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onDragOver: (event: React.DragEvent) => void;
  onDrop: (event: React.DragEvent) => void;
  onFileChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onAnalyze: () => void;
};

export function UploadPanel({
  file,
  error,
  fileInputRef,
  onDragOver,
  onDrop,
  onFileChange,
  onAnalyze,
}: UploadPanelProps) {
  return (
    <div
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors rounded-3xl p-16 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
      onClick={() => fileInputRef.current?.click()}
    >
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept=".pdf"
        onChange={onFileChange}
      />
      <UploadCloud className="w-20 h-20 text-blue-500 mb-6" />
      <h3 className="text-3xl font-semibold mb-3 text-zinc-800 dark:text-zinc-200 text-center">
        {file ? file.name : "Arraste seu PDF aqui ou clique para selecionar"}
      </h3>
      <p className="text-zinc-500 dark:text-zinc-400 text-lg text-center">
        Apenas arquivos PDF são suportados pelo modelo atualmente.
      </p>
      {error && <p className="text-red-500 mt-4 font-medium text-lg">{error}</p>}
      {file && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAnalyze();
          }}
          className="mt-10 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors shadow-lg hover:shadow-xl text-xl flex items-center gap-3"
        >
          Auditar Requisitos <Search className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}
