import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry } from "../utils";

export class IntegrationsAgent implements Agent {
  name = "Integrations";
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

  async analyze(chunk: Chunk): Promise<AnalysisResult> {
    const prompt = `
      Você é um Arquiteto de Software Especialista em Integrações.
      Seu objetivo é extrair todas as menções a sistemas externos, APIs, webservices ou bancos de dados de terceiros no texto abaixo.
      
      Regras:
      1. Identifique o nome do sistema ou serviço.
      2. Verifique se há detalhes técnicos (URL, formato, autenticação).
      3. Aponte se a especificação está ausente ou incompleta.
      4. Retorne no formato JSON sugerido.

      Texto do Documento (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${chunk.content}

      Retorne estritamente um JSON:
      {
        "integracoes": {
          "sistema": string,
          "status": "Completo" | "Incompleto" | "Ausente",
          "detalhes": string
        }[]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error("Error parsing integrations JSON:", e);
      return { integracoes: [] };
    }
  }
}
