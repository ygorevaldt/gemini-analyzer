import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "../utils";

export class BusinessRulesAgent implements Agent {
  name = "Business Rules";
  private model: GenerativeModel;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });
  }

  async analyze(chunk: Chunk): Promise<AnalysisResult> {
    const prompt = `
      Você é um Consultor de Processos e Analista de Negócios Sênior.
      Seu objetivo é identificar gaps, contradições ou regras de negócio incompletas no texto abaixo.
      
      Regras:
      1. Foque em situações onde o fluxo de negócio não está claro.
      2. Identifique regras que dependem de informações não fornecidas.
      3. Retorne no formato JSON sugerido.

      Texto do Documento (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${chunk.content}

      Retorne estritamente um JSON:
      {
        "gaps": string[]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing business rules JSON:", e);
      return { gaps: [] };
    }
  }
}
