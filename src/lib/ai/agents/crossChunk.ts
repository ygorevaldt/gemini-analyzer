import { AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class CrossChunkAgent {
  name = "CrossChunk";
  private model: GenerativeModel;

  private usingCache = false;

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
    this.usingCache = true;
  }

  async analyzeDocument(chunks: Chunk[], results: AnalysisResult[]): Promise<AnalysisResult> {
    const prompt = `
      Você é um Auditor de Requisitos e Arquiteto de Sistemas. Sua tarefa é identificar CONFLITOS CRUZADOS E INCONSISTÊNCIAS GLOBAIS.
      
      CONTEXTO DO DOCUMENTO:
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : "CHUNKS: " + JSON.stringify(chunks.map(c => ({ id: c.id, pages: `${c.startPage}-${c.endPage}`, content: c.content })))}

      RESULTADOS PARCIAIS DOS AGENTES:
      Funcionalidades: ${JSON.stringify(results.filter((r) => r.agent === "Functionalities").flatMap((r) => r.funcionalidades || []))}
      Gaps de Regra de Negócio: ${JSON.stringify(results.filter((r) => r.agent === "Business Rules").flatMap((r) => r.gaps || []))}
      Integrações: ${JSON.stringify(results.filter((r) => r.agent === "Integrations").flatMap((r) => r.integracoes || []))}
      Problemas de UX/Exceções: ${JSON.stringify(results.filter((r) => r.agent === "Exceptions").flatMap((r) => r.problemas_ux || []))}
      Conflitos: ${JSON.stringify(results.filter((r) => r.agent === "Conflicts").flatMap((r) => r.conflitos || []))}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      Se houver contradições entre diferentes páginas (ex: página 2 diz X, página 10 diz Y), registre aqui.
      
      ESTRUTURA ESPERADA E EXEMPLO:
      {
        "conflitos_cruzados": [
          {
            "descricao": "O requisito X na pág 2 contrasta com o requisito Y na pág 15",
            "pagina_referencia": "2 e 15",
            "impacto": "Alto" | "Médio" | "Baixo",
            "tipo": "Contradição" | "Ambiguidade" | "Inconsistência",
            "sugestao_correcao": "Definir se o comportamento padrão é X ou Y"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ conflitos_cruzados?: any[] }>(text, "crossChunk");

    if (!parsed || !Array.isArray(parsed.conflitos_cruzados)) {
      console.error("Error parsing cross-chunk JSON or missing conflitos_cruzados array.", {
        text: text.slice(0, 1000),
      });
      return { conflitos_cruzados: [] };
    }

    return { conflitos_cruzados: parsed.conflitos_cruzados };
  }
}
