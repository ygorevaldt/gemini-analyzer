import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class ConflictsAgent implements Agent {
  name = "Conflicts";
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
      Você é um Auditor de Sistemas e Especialista em Garantia de Qualidade. Sua tarefa é identificar CONFLITOS E CONTRADIÇÕES.
      
      FOCO DA ANÁLISE (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : chunk.content}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      
      ESTRUTURA ESPERADA:
      {
        "conflitos": [
          {
            "problema": "O que está em conflito?",
            "gravidade": "Crítica" | "Média" | "Baixa",
            "pagina": "${chunk.startPage}",
            "sugestao_correcao": "Como o BP deve unificar a regra"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ conflitos?: any[] }>(text, "conflicts");

    if (!parsed || !Array.isArray(parsed.conflitos)) {
      console.error("Error parsing conflicts JSON or missing conflitos array.", { text: text.slice(0, 1000) });
      return { conflitos: [] };
    }

    return { conflitos: parsed.conflitos };
  }
}
