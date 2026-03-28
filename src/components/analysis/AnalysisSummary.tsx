"use client";

import { CheckCircle, Lightbulb, ShieldAlert, Activity } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

type AnalysisSummaryProps = {
  result: AnalysisResult;
};

export function AnalysisSummary({ result }: AnalysisSummaryProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Funcionalidades mapeadas</p>
        <p className="mt-4 text-4xl font-bold text-zinc-900 dark:text-zinc-100">{result.funcionalidades_principais.length}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Itens que descrevem o comportamento do sistema e validações.</p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Gaps de RN/RF</p>
        <p className="mt-4 text-4xl font-bold text-orange-600">{result.gaps_regra_negocio?.length ?? 0}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Regras de negócio e requisitos incompletos ou ambíguos.</p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Falhas e exceções</p>
        <p className="mt-4 text-4xl font-bold text-red-600">{result.falhas_logicas_e_excecoes?.length ?? 0}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Fluxos de erro e estados indefinidos encontrados.</p>
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <p className="text-sm uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">Dependências detectadas</p>
        <p className="mt-4 text-4xl font-bold text-blue-600">{result.integracoes_e_dependencias?.length ?? 0}</p>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">Sistemas e integrações com especificação incompleta.</p>
      </div>
    </div>
  );
}
