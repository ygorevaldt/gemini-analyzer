import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class IntegrationsAgent implements Agent {
  name = "Integrations";
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
      Você é um Arquiteto de Software Especialista em Integrações. Sua tarefa é extrair SISTEMAS, APIs e DEPENDÊNCIAS.
      
      FOCO DA ANÁLISE (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : chunk.content}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      
      ESTRUTURA ESPERADA:
      {
        "integracoes": [
          {
            "sistema": "Nome do sistema/serviço",
            "status_especificacao": "Completo" | "Incompleto" | "Ausente",
            "detalhe": "O que é integrado?",
            "pagina": "${chunk.startPage}",
            "impacto": "Risco técnico se faltar detalhamento"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ integracoes?: any[] }>(text, "integrations");

    if (!parsed || !Array.isArray(parsed.integracoes)) {
      console.error("Error parsing integrations JSON or missing integracoes array.", { text: text.slice(0, 1000) });
      return { integracoes: [] };
    }

    return { integracoes: parsed.integracoes };
  }
}
