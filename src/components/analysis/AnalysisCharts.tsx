"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { AnalysisResult } from "@/types/analysis";

type AnalysisChartsProps = {
  result: AnalysisResult;
};

export function AnalysisCharts({ result }: AnalysisChartsProps) {
  const issueSummaryData = [
    { name: "Funcionalidades", value: result.funcionalidades_principais.length, color: "#22c55e" },
    { name: "Gaps de Negócio", value: result.gaps_regra_negocio?.length ?? 0, color: "#f97316" },
    { name: "Falhas e Exceções", value: result.falhas_logicas_e_excecoes?.length ?? 0, color: "#ef4444" },
    { name: "Feedback Ausente", value: result.mensagens_e_estados_ausentes?.length ?? 0, color: "#6366f1" },
    { name: "Integrações", value: result.integracoes_e_dependencias?.length ?? 0, color: "#3b82f6" },
    { name: "Conflitos Cruzados", value: result.conflitos_cruzados?.length ?? 0, color: "#a855f7" }
  ];

  const riskDistributionData = (() => {
    const counts = { Alto: 0, Médio: 0, Baixo: 0, Outros: 0 };
    result.gaps_regra_negocio?.forEach((gap) => {
      const risk = String(gap.risco || "").toLowerCase();
      if (risk.includes("alto")) counts.Alto += 1;
      else if (risk.includes("médio") || risk.includes("medio")) counts.Médio += 1;
      else if (risk.includes("baixo")) counts.Baixo += 1;
      else if (risk.trim()) counts.Outros += 1;
    });
    return [
      { name: "Alto", value: counts.Alto, color: "#dc2626" },
      { name: "Médio", value: counts.Médio, color: "#f59e0b" },
      { name: "Baixo", value: counts.Baixo, color: "#16a34a" },
      { name: "Outros", value: counts.Outros, color: "#4f46e5" }
    ];
  })();

  const crossChunkChartData = (() => {
    const counts: Record<string, number> = {};
    result.conflitos_cruzados?.forEach((item) => {
      const label = item.tipo || "Não Identificado";
      counts[label] = (counts[label] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value], index) => ({
      name,
      value,
      color: ["#8b5cf6", "#ec4899", "#0ea5e9", "#f59e0b", "#14b8a6"][index % 5],
    }));
  })();

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Distribuição da Auditoria</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Panorama geral</p>
          </div>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={issueSummaryData}
                dataKey="value"
                nameKey="name"
                innerRadius={56}
                outerRadius={90}
                paddingAngle={4}
              >
                {issueSummaryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <RechartsTooltip formatter={(value) => `${value ?? ""}`} />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Gaps por Risco</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Classificação de risco</p>
          </div>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={riskDistributionData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 30px -15px rgba(15, 23, 42, 0.25)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {riskDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-3xl bg-white dark:bg-zinc-900 p-6 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Conflitos Cross-Chunk</h3>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Tipos de inconsistência</p>
          </div>
        </div>
        <div className="w-full h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={crossChunkChartData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} axisLine={false} tickLine={false} />
              <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 30px -15px rgba(15, 23, 42, 0.25)' }} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {crossChunkChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
