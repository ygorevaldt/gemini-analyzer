import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class FunctionalitiesAgent implements Agent {
  name = "Functionalities";
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
      Você é um Analista de Requisitos Sênior. Sua tarefa é extrair FUNCIONALIDADES PRINCIPAIS do texto abaixo.
      
      FOCO DA ANÁLISE (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : chunk.content}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      
      ESTRUTURA ESPERADA:
      {
        "funcionalidades": [
          {
            "title": "Título Curto",
            "description": "Explicação detalhada do comportamento",
            "page_reference": "21",
            "type": "functionality" | "validation"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ funcionalidades?: any[] }>(text, "functionalities");

    if (!parsed || !Array.isArray(parsed.funcionalidades)) {
      console.error("Error parsing functionalities JSON or missing array.", { text: text.slice(0, 1000) });
      return { funcionalidades: [] };
    }

    return { funcionalidades: parsed.funcionalidades };
  }
}
