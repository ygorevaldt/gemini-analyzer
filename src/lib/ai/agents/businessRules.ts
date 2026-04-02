import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class BusinessRulesAgent implements Agent {
  name = "Business Rules";
  private model: GenerativeModel;

  private usingCache = false;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
        maxOutputTokens: 8192,
      },
    });
  }

  setModel(model: GenerativeModel) {
    this.model = model;
    this.usingCache = true;
  }

  async analyze(chunk: Chunk): Promise<AnalysisResult> {
    const prompt = `
      Você é um Consultor de Processos e Analista de Negócios Sênior. Sua tarefa é identificar GAPS DE REGRA DE NEGÓCIO.
      
      FOCO DA ANÁLISE (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : chunk.content}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      
      ESTRUTURA ESPERADA:
      {
        "gaps": [
          {
            "regra": "Descrição da regra impactada",
            "cenario_omitido": "O que não foi coberto?",
            "risco": "Impacto no negócio",
            "pagina": "${chunk.startPage}",
            "sugestao_correcao": "O que o BP deve escrever para corrigir"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ gaps?: any[] }>(text, "businessRules");

    if (!parsed || !Array.isArray(parsed.gaps)) {
      console.error("Error parsing business rules JSON or missing gaps array.", { text: text.slice(0, 1000) });
      return { gaps: [] };
    }

    return { gaps: parsed.gaps };
  }
}
