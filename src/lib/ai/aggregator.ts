import { AnalysisResult, FinalReport } from "./types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "./utils";

export class Aggregator {
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
  }

  async aggregate(results: AnalysisResult[]): Promise<FinalReport> {
    // Collect all data from agents
    const functionalities = results
      .filter(r => r.agent === "Functionalities")
      .flatMap(r => r.funcionalidades || []);

    const gaps = results
      .filter(r => r.agent === "Business Rules")
      .flatMap(r => r.gaps || []);

    const integracoes = results
      .filter(r => r.agent === "Integrations")
      .flatMap(r => r.integracoes || []);

    const problemasUX = results
      .filter(r => r.agent === "Exceptions")
      .flatMap(r => r.problemas_ux || []);

    const conflitos = results
      .filter(r => r.agent === "Conflicts")
      .flatMap(r => r.conflitos || []);

    // Final prompt to synthesize everything into the expected format
    const prompt = `
      Você é um Arquiteto de Soluções Sênior. Sua tarefa é consolidar os resultados parciais de diversos agentes de análise de requisitos em um relatório final estruturado.
      
      DADOS COLETADOS:
      Funcionalidades: ${JSON.stringify(functionalities.slice(0, 50))}
      Gaps de Regra de Negócio: ${JSON.stringify(gaps.slice(0, 30))}
      Integrações: ${JSON.stringify(integracoes.slice(0, 30))}
      Problemas de UX/Exceções: ${JSON.stringify(problemasUX.slice(0, 30))}
      Conflitos/Inconsistências: ${JSON.stringify(conflitos.slice(0, 30))}

      OBJETIVO:
      1. Resumir o propósito do projeto.
      2. Consolidar as funcionalidades (remover duplicatas).
      3. Calcular métricas aproximadas baseadas nos gaps encontrados.
      4. Listar falhas lógicas e riscos.
      5. Dar um parecer técnico final.

      IMPORTANTE: Seja extremamente conciso e objetivo. Evite repetir informações. Vá direto ao ponto.
      Retorna estritamente um JSON válido e nada mais que isso.

      FORMATO OBRIGATÓRIO (JSON):
      {
        "projeto_resumo": "...",
        "funcionalidades_principais": ["..."],
        "metricas_qualidade": {
          "rn_satisfatorias": 0,
          "rn_com_gaps": 0,
          "rf_satisfatorios": 0,
          "rf_com_gaps": 0
        },
        "analise_integridade": "Nota de 0 a 10 com justificativa",
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
            "status_especificacao": "...",
            "detalhe": "..."
          }
        ],
        "gaps_regra_negocio": [
          {
            "regra": "...",
            "cenario_omitido": "...",
            "risco": "...",
            "pagina": "..."
          }
        ],
        "mensagens_e_estados_ausentes": ["..."],
        "conclusao_tecnica": "..."
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing final aggregation JSON:", e);
      // Fallback object
      return {
        projeto_resumo: "Erro na consolidação",
        funcionalidades_principais: functionalities.slice(0, 10),
        metricas_qualidade: { rn_satisfatorias: 0, rn_com_gaps: 0, rf_satisfatorios: 0, rf_com_gaps: 0 },
        analise_integridade: "0 - Falha sistêmica",
        falhas_logicas_e_excecoes: [],
        integracoes_e_dependencias: [],
        gaps_regra_negocio: [],
        mensagens_e_estados_ausentes: problemasUX.slice(0, 10),
        conclusao_tecnica: "Não foi possível gerar um parecer automático."
      };
    }
  }
}
