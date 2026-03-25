"use client";

import { useState, useRef, useEffect } from "react";
import { FileText, AlertTriangle, CheckCircle, Search, UploadCloud, Download, Lightbulb, ShieldAlert, Link as LinkIcon, Activity } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";

type AnalysisResult = {
  projeto_resumo: string;
  funcionalidades_principais: string[];
  metricas_qualidade?: {
    rn_satisfatorias: number;
    rn_com_gaps: number;
    rf_satisfatorios: number;
    rf_com_gaps: number;
  };
  analise_integridade: string;
  falhas_logicas_e_excecoes: {
    problema: string;
    impacto: string;
    sessao: string;
    pagina: string;
    sugestao_correcao: string;
  }[];
  integracoes_e_dependencias: {
    sistema: string;
    status_especificacao: string;
    detalhe: string;
  }[];
  gaps_regra_negocio: {
    regra: string;
    cenario_omitido: string;
    risco: string;
    pagina: string;
  }[];
  mensagens_e_estados_ausentes: string[];
  conclusao_tecnica: string;
};

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

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type === "application/pdf") {
      setFile(droppedFile);
    } else {
      setError("Por favor, envie um arquivo PDF válido.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
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
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro inesperado.");
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePDF = () => {
    if (!result) return;

    // Default format A4
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let startY = 20;

    // Header superior
    doc.setFontSize(24);
    doc.setTextColor(37, 99, 235); // text-blue-600
    doc.text("Lupa de Requisitos", pageWidth / 2, startY, { align: "center" });

    startY += 8;
    doc.setFontSize(12);
    doc.setTextColor(100, 116, 139); // text-slate-500
    doc.text(`Relatório de Análise Crítica - ${new Date().toLocaleDateString()}`, pageWidth / 2, startY, { align: "center" });

    startY += 20;

    // Seção Resumo e Conclusão
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text("Resumo do Projeto", 14, startY);
    startY += 8;

    doc.setFontSize(11);
    doc.setTextColor(51, 65, 85); // slate-700
    let splitText = doc.splitTextToSize(result.projeto_resumo, pageWidth - 28);
    doc.text(splitText, 14, startY);
    startY += (splitText.length * 5) + 6;

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Análise de Integridade", 14, startY);
    startY += 6;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    splitText = doc.splitTextToSize(result.analise_integridade, pageWidth - 28);
    doc.text(splitText, 14, startY);
    startY += (splitText.length * 5) + 6;

    if (result.metricas_qualidade) {
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Métricas Quantitativas", 14, startY);
      startY += 6;
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85);
      doc.text(`RNs Satisfatórias: ${result.metricas_qualidade.rn_satisfatorias}  |  RNs com Gaps: ${result.metricas_qualidade.rn_com_gaps}`, 14, startY);
      startY += 5;
      doc.text(`RFs Satisfatórios: ${result.metricas_qualidade.rf_satisfatorios}  |  RFs com Gaps/Falhas: ${result.metricas_qualidade.rf_com_gaps}`, 14, startY);
      startY += 8;
    }

    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text("Conclusão Técnica", 14, startY);
    startY += 6;
    doc.setFontSize(10);
    doc.setTextColor(51, 65, 85);
    splitText = doc.splitTextToSize(result.conclusao_tecnica, pageWidth - 28);
    doc.text(splitText, 14, startY);
    startY += (splitText.length * 5) + 12;

    // Tabela: Funcionalidades Principais
    autoTable(doc, {
      startY,
      head: [["Core Features / Funcionalidades Principais"]],
      body: result.funcionalidades_principais.map(f => [f]),
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] }, // emerald-500
      styles: { fontSize: 10 }
    });
    startY = (doc as any).lastAutoTable.finalY + 15;

    // Tabela: Falhas Lógicas e Exceções
    if (result.falhas_logicas_e_excecoes && result.falhas_logicas_e_excecoes.length > 0) {
      if (startY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); startY = 20; }
      autoTable(doc, {
        startY,
        head: [["Problema / Exceção Ausente", "Impacto", "Seção", "Pág", "Sugestão de Correção"]],
        body: result.falhas_logicas_e_excecoes.map(f => [f.problema, f.impacto, f.sessao || "-", f.pagina || "-", f.sugestao_correcao]),
        theme: 'grid',
        headStyles: { fillColor: [239, 68, 68] }, // red-500
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 20 },
          2: { cellWidth: 30 },
          3: { cellWidth: 15, halign: 'center' },
          4: { cellWidth: 65 }
        },
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tabela: Gaps de Regra de Negócio
    if (result.gaps_regra_negocio && result.gaps_regra_negocio.length > 0) {
      if (startY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); startY = 20; }
      autoTable(doc, {
        startY,
        head: [["Regra Incompleta", "Cenário Omitido", "Risco", "Pág"]],
        body: result.gaps_regra_negocio.map(g => [g.regra, g.cenario_omitido, g.risco, g.pagina || "-"]),
        theme: 'grid',
        headStyles: { fillColor: [249, 115, 22] }, // orange-500
        columnStyles: {
          0: { cellWidth: 50 },
          1: { cellWidth: 70 },
          2: { cellWidth: 40 },
          3: { cellWidth: 20, halign: 'center' }
        },
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tabela: Integrações e Dependências
    if (result.integracoes_e_dependencias && result.integracoes_e_dependencias.length > 0) {
      if (startY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); startY = 20; }
      autoTable(doc, {
        startY,
        head: [["Sistema / API", "Status Especificação", "Detalhe do que falta"]],
        body: result.integracoes_e_dependencias.map(sys => [sys.sistema, sys.status_especificacao, sys.detalhe]),
        theme: 'grid',
        headStyles: { fillColor: [59, 130, 246] }, // blue-500
        columnStyles: {
          0: { cellWidth: 40 },
          1: { cellWidth: 40 },
          2: { cellWidth: 100 }
        },
        styles: { fontSize: 9 }
      });
      startY = (doc as any).lastAutoTable.finalY + 15;
    }

    // Tabela: Mensagens e Estados Ausentes
    if (result.mensagens_e_estados_ausentes && result.mensagens_e_estados_ausentes.length > 0) {
      if (startY > doc.internal.pageSize.getHeight() - 40) { doc.addPage(); startY = 20; }
      autoTable(doc, {
        startY,
        head: [["Mensagens e Estados Ausentes (Resiliência & UX)"]],
        body: result.mensagens_e_estados_ausentes.map(s => [s]),
        theme: 'grid',
        headStyles: { fillColor: [99, 102, 241] }, // indigo-500
        styles: { fontSize: 10 }
      });
    }

    // Action final do PDF!
    doc.save("Relatorio_AnaliseCritica_LupaDeRequisitos.pdf");
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

        {/* Upload Section */}
        {!loading && !result && (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors rounded-3xl p-16 flex flex-col items-center justify-center bg-white dark:bg-zinc-900 shadow-sm cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept=".pdf"
              onChange={handleFileChange}
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
                  handleAnalyze();
                }}
                className="mt-10 px-10 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors shadow-lg hover:shadow-xl text-xl flex items-center gap-3"
              >
                Auditar Requisitos <Search className="w-6 h-6" />
              </button>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="relative w-24 h-24 mb-10">
              <div className="absolute inset-0 border-4 border-blue-200/50 dark:border-blue-900/50 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 dark:border-blue-500 rounded-full border-t-transparent dark:border-t-transparent animate-spin"></div>
            </div>
            <p className="text-3xl lg:text-4xl font-medium animate-pulse text-zinc-700 dark:text-zinc-300 tracking-tight text-center">
              {loadingMessages[messageIndex]}
            </p>
            <p className="text-zinc-500 mt-5 text-xl text-center">Isso pode levar alguns segundos dependendo da quantidade de páginas e complexidade do documento.</p>
          </div>
        )}

        {/* Results Section */}
        {result && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <h2 className="text-3xl font-bold flex items-center gap-3">
                <ShieldAlert className="w-8 h-8 text-blue-500" /> Auditoria Crítica do Documento
              </h2>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleGeneratePDF}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold bg-white border border-zinc-200 dark:border-zinc-700 dark:bg-zinc-800 rounded-full hover:bg-zinc-50 dark:hover:bg-zinc-700 transition shadow-sm flex items-center justify-center gap-2 text-zinc-700 dark:text-zinc-200"
                >
                  <Download className="w-5 h-5" /> Exportar PDF
                </button>
                <button
                  onClick={() => {
                    setResult(null);
                    setFile(null);
                  }}
                  className="flex-1 sm:flex-none px-6 py-3 text-sm font-semibold bg-blue-600 text-white rounded-full hover:bg-blue-700 transition shadow-sm"
                >
                  Nova Análise
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Resumo Card & Integridade / Conclusão */}
              <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-1 md:col-span-2 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                  <h3 className="text-2xl font-bold mb-4 flex items-center gap-2 text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                    <FileText className="w-6 h-6 text-blue-500" /> Propósito Central
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
                    {result.projeto_resumo}
                  </p>
                </div>

                <div className="col-span-1 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col">
                  <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                    <Activity className="w-5 h-5 text-indigo-500" /> Análise de Integridade
                  </h3>
                  <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed font-medium mb-4">
                    {result.analise_integridade}
                  </p>

                  {result.metricas_qualidade && (
                    <div className="h-44 w-full mt-auto">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={[
                            { name: 'RNs', satisfatorio: result.metricas_qualidade.rn_satisfatorias, comFalhas: result.metricas_qualidade.rn_com_gaps },
                            { name: 'RFs', satisfatorio: result.metricas_qualidade.rf_satisfatorios, comFalhas: result.metricas_qualidade.rf_com_gaps }
                          ]}
                          margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#52525b" opacity={0.2} />
                          <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 11, fill: '#71717a' }} axisLine={false} tickLine={false} />
                          <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '5px' }} />
                          <Bar dataKey="satisfatorio" name="OK" stackId="a" fill="#10b981" radius={[0, 0, 4, 4]} maxBarSize={40} />
                          <Bar dataKey="comFalhas" name="Gaps" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Funcionalidades */}
              <div className="col-span-1 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                  <CheckCircle className="w-6 h-6 text-emerald-500" /> Funcionalidades
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.funcionalidades_principais.map((func, i) => (
                    <span key={i} className="px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800/50 rounded-xl text-[0.95rem] font-medium">
                      {func}
                    </span>
                  ))}
                </div>
              </div>

              {/* Mensagens e Estados Ausentes */}
              <div className="col-span-1 bg-white dark:bg-zinc-900 p-8 rounded-3xl shadow-sm border border-zinc-200 dark:border-zinc-800">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                  <Lightbulb className="w-6 h-6 text-indigo-500" /> Estados e Feedbacks Ausentes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {result.mensagens_e_estados_ausentes?.map((sug, i) => (
                    <span key={i} className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-200 border border-indigo-200 dark:border-indigo-800/50 rounded-xl text-[0.95rem] font-medium">
                      {sug}
                    </span>
                  ))}
                </div>
              </div>

              {/* Falhas Lógicas e Exceções */}
              <div className="col-span-1 lg:col-span-2 bg-red-50 dark:bg-red-950/20 p-8 md:p-10 rounded-3xl border border-red-200 dark:border-red-900/50">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-red-700 dark:text-red-400 uppercase tracking-wide">
                  <AlertTriangle className="w-6 h-6" /> Fluxos de Exceção e Falhas Lógicas
                </h3>
                {result.falhas_logicas_e_excecoes && result.falhas_logicas_e_excecoes.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.falhas_logicas_e_excecoes.map((falha, i) => (
                      <div key={i} className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/40 hover:shadow-md transition">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-lg leading-relaxed">{falha.problema}</p>

                        <div className="mb-4 text-zinc-700 dark:text-zinc-300 text-[0.95rem] bg-zinc-50 dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-zinc-800">
                          <span className="block font-bold text-xs uppercase text-zinc-500 dark:text-zinc-400 mb-1">Como Sugerida a Correção</span>
                          {falha.sugestao_correcao}
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-red-50 dark:border-red-900/30">
                          <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                            <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-red-500 mb-1">Seção</span>
                            {falha.sessao || 'N/A'}
                          </p>
                          <p className="text-red-700 dark:text-red-400 text-sm font-medium">
                            <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-red-500 mb-1">Página</span>
                            {falha.pagina || '?'}
                          </p>
                          <p className="text-red-700 dark:text-red-400 text-sm col-span-2 font-medium">
                            <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-red-500 mb-1">Impacto Previsto</span>
                            {falha.impacto}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">Nenhum problema grave de exceção encontrado.</p>
                )}
              </div>

              {/* Gaps de Regra de Negócio */}
              <div className="col-span-1 lg:col-span-2 bg-orange-50 dark:bg-orange-950/20 p-8 md:p-10 rounded-3xl border border-orange-200 dark:border-orange-900/50">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-orange-700 dark:text-orange-400 uppercase tracking-wide">
                  <AlertTriangle className="w-6 h-6" /> Gaps de Regra de Negócio
                </h3>
                {result.gaps_regra_negocio && result.gaps_regra_negocio.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {result.gaps_regra_negocio.map((g, i) => (
                      <div key={i} className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-orange-100 dark:border-orange-900/40 hover:shadow-md transition">
                        <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-2 text-lg leading-relaxed">{g.regra}</p>

                        <div className="mb-4 text-orange-800 dark:text-orange-300 text-[0.95rem] bg-orange-50/50 dark:bg-orange-900/10 p-3 rounded-xl border border-orange-100 dark:border-orange-900/20">
                          <span className="block font-bold text-xs uppercase text-orange-600 dark:text-orange-500 mb-1">Cenário Omitido</span>
                          {g.cenario_omitido}
                        </div>

                        <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-orange-50 dark:border-orange-900/30">
                          <p className="text-orange-700 dark:text-orange-400 text-sm font-medium col-span-2">
                            <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-orange-500 mb-1">Risco</span>
                            {g.risco}
                          </p>
                          <p className="text-orange-700 dark:text-orange-400 text-sm font-medium">
                            <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-orange-500 mb-1">Página</span>
                            {g.pagina || '?'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">Nenhum gap de negócio estrutural encontrado.</p>
                )}
              </div>

              {/* Integrações e Dependências */}
              <div className="col-span-1 lg:col-span-2 bg-blue-50/50 dark:bg-blue-950/20 p-8 md:p-10 rounded-3xl border border-blue-200 dark:border-blue-900/50">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-blue-700 dark:text-blue-400 uppercase tracking-wide">
                  <LinkIcon className="w-6 h-6" /> Integrações e Dependências Ocultas
                </h3>
                {result.integracoes_e_dependencias && result.integracoes_e_dependencias.length > 0 ? (
                  <ul className="space-y-4">
                    {result.integracoes_e_dependencias.map((sys, i) => (
                      <li key={i} className="flex flex-col gap-2 items-start text-zinc-800 dark:text-zinc-200 p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-blue-100 dark:border-blue-900/40">
                        <div className="flex justify-between items-center w-full mb-2">
                          <span className="text-[1.1rem] font-bold text-blue-700 dark:text-blue-400">{sys.sistema}</span>
                          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-200 dark:border-blue-800">{sys.status_especificacao}</span>
                        </div>
                        <span className="text-zinc-600 dark:text-zinc-400 text-[0.95rem] leading-relaxed">{sys.detalhe}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-600 dark:text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200">Nenhuma integração oculta detectada.</p>
                )}
              </div>

              {/* Conclusão Técnica */}
              <div className="col-span-1 lg:col-span-2 bg-zinc-900 dark:bg-zinc-100 p-8 md:p-10 rounded-3xl border border-zinc-800 dark:border-zinc-200 shadow-xl">
                <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-100 dark:text-zinc-900 uppercase tracking-wide">
                  <ShieldAlert className="w-6 h-6" /> Parecer e Conclusão Técnica
                </h3>
                <p className="text-zinc-300 dark:text-zinc-700 text-lg leading-relaxed font-medium">
                  {result.conclusao_tecnica}
                </p>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
