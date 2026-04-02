import { AnalysisResult, FinalReport } from "./types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "./utils";

export class Aggregator {
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });
  }

  setModel(model: GenerativeModel) {
    this.model = model;
  }

  async aggregate(results: AnalysisResult[]): Promise<FinalReport> {
    // Collect all data from agents
    const uniqueByJson = <T>(items: T[]) => {
      const seen = new Set<string>();
      return items.filter((item) => {
        const key = JSON.stringify(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const functionalities = results
      .filter((r) => r.agent === "Functionalities")
      .flatMap((r) => r.funcionalidades || []);
    const uniqueFunctionalities = uniqueByJson(functionalities);

    const gaps = results.filter((r) => r.agent === "Business Rules").flatMap((r) => r.gaps || []);
    const uniqueGaps = uniqueByJson(gaps);

    const integracoes = results.filter((r) => r.agent === "Integrations").flatMap((r) => r.integracoes || []);
    const uniqueIntegracoes = uniqueByJson(integracoes);

    const problemasUX = results.filter((r) => r.agent === "Exceptions").flatMap((r) => r.problemas_ux || []);
    const uniqueProblemasUX = uniqueByJson(problemasUX);

    const conflitos = results.filter((r) => r.agent === "Conflicts").flatMap((r) => r.conflitos || []);
    const uniqueConflitos = uniqueByJson(conflitos);

    const crossChunkFindings = results
      .filter((r) => r.agent === "CrossChunk")
      .flatMap((r) => r.conflitos_cruzados || []);
    const uniqueCrossChunkFindings = uniqueByJson(crossChunkFindings);

    // Final prompt to synthesize everything into the expected format
    const prompt = `
      Você é um Arquiteto de Soluções Sênior. Sua tarefa é consolidar os resultados de diversos agentes em um único RELATÓRIO TÉCNICO.
      
      DADOS COLETADOS:
      Funcionalidades: ${JSON.stringify(uniqueFunctionalities)}
      Gaps de Regra de Negócio: ${JSON.stringify(uniqueGaps)}
      Integrações: ${JSON.stringify(uniqueIntegracoes)}
      Problemas de UX/Exceções: ${JSON.stringify(uniqueProblemasUX)}
      Conflitos/Inconsistências: ${JSON.stringify(uniqueConflitos)}
      Conflitos Cruzados: ${JSON.stringify(uniqueCrossChunkFindings)}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne um JSON válido e COMPLETO. O campo "conclusao_tecnica" é OBRIGATÓRIO e deve conter sua visão profissional final.
      
      ESTRUTURA ESPERADA (JSON):
      {
        "projeto_resumo": "...",
        "funcionalidades_principais": ["..."],
        "metricas_qualidade": {
          "rn_satisfatorias": 0,
          "rn_com_gaps": 0,
          "rf_satisfatorios": 0,
          "rf_com_gaps": 0
        },
        "analise_integridade": "...",
        "falhas_logicas_e_excecoes": [
          {
            "problema": "...",
            "impacto": "Alto/Médio/Baixo",
            "sessao": "...",
            "pagina": "...",
            "sugestao_correcao": "..."
          }
        ],
        "integracoes_e_dependencias": [
          {
            "sistema": "...",
            "status_especificacao": "Completo/Incompleto/Ausente",
            "detalhe": "...",
            "pagina": "...",
            "impacto": "..."
          }
        ],
        "gaps_regra_negocio": [
          {
            "regra": "...",
            "cenario_omitido": "...",
            "risco": "...",
            "pagina": "...",
            "sugestao_correcao": "..."
          }
        ],
        "mensagens_e_estados_ausentes": ["..."],
        "conflitos_cruzados": [
          {
            "descricao": "...",
            "pagina_referencia": "...",
            "impacto": "Alto/Médio/Baixo",
            "tipo": "...",
            "sugestao_correcao": "..."
          }
        ],
        "conclusao_tecnica": "SUMÁRIO TÉCNICO FINAL: Sua análise profissional aqui."
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<Partial<FinalReport>>(text, "aggregator");

    // Fallback logic check if empty
    const ensureString = (val: any) => (typeof val === "string" ? val : JSON.stringify(val));

    if (!parsed || typeof parsed !== "object") {
      console.error("Error parsing final aggregation JSON.", { text: text.slice(0, 1000) });
      return {
        projeto_resumo: "Erro na consolidação automática.",
        funcionalidades_principais: uniqueFunctionalities.map(f => f.title || "Sem título"),
        metricas_qualidade: { rn_satisfatorias: 0, rn_com_gaps: uniqueGaps.length, rf_satisfatorios: 0, rf_com_gaps: uniqueProblemasUX.length },
        analise_integridade: "Não foi possível sintetizar a inteligência.",
        falhas_logicas_e_excecoes: uniqueProblemasUX,
        integracoes_e_dependencias: uniqueIntegracoes,
        gaps_regra_negocio: uniqueGaps,
        mensagens_e_estados_ausentes: uniqueProblemasUX.map((p: any) => p.problema || "Não identificado"),
        conflitos_cruzados: uniqueCrossChunkFindings,
        conclusao_tecnica: "O modelo de agregação falhou ao processar a resposta completa. Verifique os dados detalhados acima.",
      };
    }

    return {
      projeto_resumo: ensureString(parsed.projeto_resumo || "Não disponível."),
      funcionalidades_principais: Array.isArray(parsed.funcionalidades_principais) && parsed.funcionalidades_principais.length > 0
        ? parsed.funcionalidades_principais
        : uniqueFunctionalities.map(f => f.title || "Sem título"),
      metricas_qualidade: parsed.metricas_qualidade || {
        rn_satisfatorias: 0,
        rn_com_gaps: uniqueGaps.length,
        rf_satisfatorios: 0,
        rf_com_gaps: uniqueProblemasUX.length,
      },
      analise_integridade: ensureString(parsed.analise_integridade || "Verificar dados abaixo."),
      falhas_logicas_e_excecoes: (Array.isArray(parsed.falhas_logicas_e_excecoes) && parsed.falhas_logicas_e_excecoes.length > 0)
        ? parsed.falhas_logicas_e_excecoes
        : uniqueProblemasUX,
      integracoes_e_dependencias: (Array.isArray(parsed.integracoes_e_dependencias) && parsed.integracoes_e_dependencias.length > 0)
        ? parsed.integracoes_e_dependencias
        : uniqueIntegracoes,
      gaps_regra_negocio: (Array.isArray(parsed.gaps_regra_negocio) && parsed.gaps_regra_negocio.length > 0)
        ? parsed.gaps_regra_negocio
        : uniqueGaps,
      mensagens_e_estados_ausentes: (Array.isArray(parsed.mensagens_e_estados_ausentes) && parsed.mensagens_e_estados_ausentes.length > 0)
        ? parsed.mensagens_e_estados_ausentes
        : uniqueProblemasUX.map((p: any) => p.problema || "Não identificado"),
      conflitos_cruzados: (Array.isArray(parsed.conflitos_cruzados) && parsed.conflitos_cruzados.length > 0)
        ? parsed.conflitos_cruzados
        : uniqueCrossChunkFindings,
      conclusao_tecnica: ensureString(parsed.conclusao_tecnica || "Análise completa disponível nos detalhes acima."),
    };
  }
}
