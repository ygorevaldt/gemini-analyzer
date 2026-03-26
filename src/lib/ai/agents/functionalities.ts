import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "../utils";

export class FunctionalitiesAgent implements Agent {
  name = "Functionalities";
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash-lite", // Using a stable version
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
  }

  async analyze(chunk: Chunk): Promise<AnalysisResult> {
    const prompt = `
      Você é um Analista de Requisitos Sênior.
      Seu objetivo é extrair TODAS as funcionalidades descritas no texto abaixo.
      
      Regras:
      1. Liste apenas o que está explicitamente no texto.
      2. Seja preciso e detalhado.
      3. Retorne no formato JSON sugerido.

      Texto do Documento (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${chunk.content}

      Retorne estritamente um JSON:
      {
        "funcionalidades": string[]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing functionalities JSON:", e);
      return { funcionalidades: [] };
    }
  }
}
