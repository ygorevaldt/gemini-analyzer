import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "../utils";

export class ConflictsAgent implements Agent {
  name = "Conflicts";
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
      Você é um Auditor de Sistemas e Especialista em Garantia de Qualidade.
      Seu objetivo é identificar contradições, ambiguidades ou conflitos lógicos no texto abaixo.
      
      Regras:
      1. Procure por trechos que dizem uma coisa em um lugar e outra diferente em outro.
      2. Identifique termos ambíguos que podem ter múltiplas interpretações.
      3. Aponte conflitos entre requisitos funcionais e regras de negócio.
      4. Retorne no formato JSON sugerido.

      Texto do Documento (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${chunk.content}

      Retorne estritamente um JSON:
      {
        "conflitos": string[]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing conflicts JSON:", e);
      return { conflitos: [] };
    }
  }
}
