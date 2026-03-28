"use client";

import { FileText, Lightbulb, AlertTriangle, Activity, Link as LinkIcon, ShieldAlert, CheckCircle } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

type AnalysisSectionsProps = {
  result: AnalysisResult;
};

export function AnalysisSections({ result }: AnalysisSectionsProps) {
  return (
    <div id="report-content" className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
              <div className="w-full h-full">
                <div className="grid grid-cols-2 gap-4 h-full">
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">RNs Satisfatórias</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{result.metricas_qualidade.rn_satisfatorias}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">RNs com Gaps</p>
                    <p className="mt-3 text-3xl font-bold text-orange-600">{result.metricas_qualidade.rn_com_gaps}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">RFs Satisfatórios</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-slate-100">{result.metricas_qualidade.rf_satisfatorios}</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 dark:bg-slate-900 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">RFs com Gaps/Falhas</p>
                    <p className="mt-3 text-3xl font-bold text-red-600">{result.metricas_qualidade.rf_com_gaps}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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

      <div className="col-span-1 lg:col-span-2 bg-violet-50 dark:bg-violet-950/20 p-8 md:p-10 rounded-3xl border border-violet-200 dark:border-violet-900/50">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-violet-700 dark:text-violet-400 uppercase tracking-wide">
          <Activity className="w-6 h-6" /> Conflitos Document-Wide
        </h3>
        {result.conflitos_cruzados && result.conflitos_cruzados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.conflitos_cruzados.map((item, i) => (
              <div key={i} className="flex flex-col p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-sm border border-violet-100 dark:border-violet-900/40 hover:shadow-md transition">
                <p className="font-bold text-zinc-900 dark:text-zinc-100 mb-3 text-lg leading-relaxed">{item.descricao}</p>
                <div className="mb-4 text-violet-800 dark:text-violet-300 text-[0.95rem] bg-violet-50/50 dark:bg-violet-900/10 p-3 rounded-xl border border-violet-100 dark:border-violet-900/20">
                  <span className="block font-bold text-xs uppercase text-violet-600 dark:text-violet-500 mb-1">Recomendação de Correção</span>
                  {item.sugestao_correcao}
                </div>
                <div className="mt-auto grid grid-cols-2 gap-4 pt-4 border-t border-violet-50 dark:border-violet-900/30">
                  <p className="text-violet-700 dark:text-violet-400 text-sm font-medium">
                    <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-violet-500 mb-1">Tipo</span>
                    {item.tipo}
                  </p>
                  <p className="text-violet-700 dark:text-violet-400 text-sm font-medium">
                    <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-violet-500 mb-1">Página</span>
                    {item.pagina_referencia || '?'}
                  </p>
                  <p className="text-violet-700 dark:text-violet-400 text-sm col-span-2 font-medium">
                    <span className="block font-bold uppercase tracking-wide text-[0.7rem] text-violet-500 mb-1">Impacto</span>
                    {item.impacto}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-zinc-600 dark:text-zinc-400 p-4 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800">Nenhum conflito document-wide detectado.</p>
        )}
      </div>

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

      <div className="col-span-1 lg:col-span-2 bg-zinc-900 dark:bg-zinc-100 p-8 md:p-10 rounded-3xl border border-zinc-800 dark:border-zinc-200 shadow-xl">
        <h3 className="text-2xl font-bold mb-6 flex items-center gap-2 text-zinc-100 dark:text-zinc-900 uppercase tracking-wide">
          <ShieldAlert className="w-6 h-6" /> Parecer e Conclusão Técnica
        </h3>
        <p className="text-zinc-300 dark:text-zinc-700 text-lg leading-relaxed font-medium">
          {result.conclusao_tecnica}
        </p>
      </div>
    </div>
  );
}
