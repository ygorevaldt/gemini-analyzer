"use client";

import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { UploadPanel } from "@/components/analysis/UploadPanel";
import { AnalysisSummary } from "@/components/analysis/AnalysisSummary";
import { AnalysisCharts } from "@/components/analysis/AnalysisCharts";
import { AnalysisSections } from "@/components/analysis/AnalysisSections";
import { ReportActions } from "@/components/analysis/ReportActions";
import { generatePDF, generateHTML } from "@/lib/pdf/report";
import type { AnalysisResult } from "@/types/analysis";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageIndex, setMessageIndex] = useState(0);

  const loadingMessages = [
    "Lendo os requisitos e paginando o texto...",
    "Procurando por bugs e brechas na lógica...",
    "Mapeando integrações ocultas e dependências...",
    "Avaliando fluxos de exceção e estados vazios...",
    "Quase lá! Preparando o dossiê da análise crítica..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (loading) {
      interval = setInterval(() => {
        setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
      }, 3000);
    } else {
      setMessageIndex(0);
    }

    return () => clearInterval(interval);
  }, [loading]);

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    const droppedFile = event.dataTransfer.files[0];

    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
      setError(null);
    } else {
      setError("Por favor, envie um arquivo PDF válido.");
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!file) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Falha ao analisar o documento.");
      }

      const data: AnalysisResult = await response.json();
      setResult(data);
    } catch (error: any) {
      setError(error.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!result) return;
    generatePDF(result);
  };

  const handleGenerateHTML = () => {
    if (!result) return;
    generateHTML(result);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 p-4 md:p-8 font-sans">
      <main className="max-w-7xl mx-auto space-y-12">
        <header className="relative text-center space-y-4 pt-8 md:pt-12">
          <div className="absolute top-2 right-2 md:top-4 md:right-4">
            <ThemeToggle />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-blue-600 dark:text-blue-400">
            Lupa de Requisitos
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
            Auditoria Crítica de Requisitos, Fluxos de Exceção e Mapeamento de Falhas Sistêmicas.
          </p>
        </header>

        {!loading && !result && (
          <UploadPanel
            file={file}
            error={error}
            fileInputRef={fileInputRef}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onFileChange={handleFileChange}
            onAnalyze={handleAnalyze}
          />
        )}

        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-24 h-24 mb-10">
              <div className="absolute inset-0 border-4 border-blue-200/50 dark:border-blue-900/50 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent dark:border-t-transparent animate-spin"></div>
            </div>
            <p className="text-3xl lg:text-4xl font-medium animate-pulse text-zinc-700 dark:text-zinc-300 tracking-tight text-center">
              {loadingMessages[messageIndex]}
            </p>
            <p className="text-zinc-500 mt-5 text-xl text-center">
              Isso pode levar alguns segundos dependendo da quantidade de páginas e complexidade do documento.
            </p>
          </div>
        )}

        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <AnalysisSummary result={result} />
            <AnalysisCharts result={result} />
            <ReportActions
              onGenerateHTML={handleGenerateHTML}
              onGeneratePDF={handleGeneratePDF}
              onReset={() => {
                setResult(null);
                setFile(null);
              }}
            />
            <AnalysisSections result={result} />
          </div>
        )}
      </main>
    </div>
  );
}
