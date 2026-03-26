import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "../utils";

export class ExceptionsAgent implements Agent {
  name = "Exceptions";
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
      Você é um Especialista em UX e QA Sênior.
      Seu objetivo é identificar a ausência de tratamentos de erro, estados vazios (empty states) e feedbacks de usuário no texto abaixo.
      
      Regras:
      1. Procure por ações que não definem o que acontece em caso de erro.
      2. Identifique listagens que não tratam o caso de "nenhum registro encontrado".
      3. Aponte falta de mensagens de confirmação ou sucesso.
      4. Retorne no formato JSON sugerido.

      Texto do Documento (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${chunk.content}

      Retorne estritamente um JSON:
      {
        "problemas_ux": string[]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing exceptions JSON:", e);
      return { problemas_ux: [] };
    }
  }
}
