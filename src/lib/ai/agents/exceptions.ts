import { Agent, AnalysisResult, Chunk } from "../types";
import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { withRetry, safeParseJson } from "../utils";

export class ExceptionsAgent implements Agent {
  name = "Exceptions";
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
      Você é um Especialista em UX e QA Sênior. Sua tarefa é identificar ESTADOS DE ERRO E EXCEÇÕES AUSENTES.
      
      FOCO DA ANÁLISE (Páginas ${chunk.startPage} a ${chunk.endPage}):
      ${this.usingCache ? "(O conteúdo completo está disponível no contexto de cache)" : chunk.content}

      REQUISITO CRÍTICO DE FORMATO:
      Retorne APENAS um objeto JSON no formato abaixo, sem Markdown, sem preâmbulo.
      
      ESTRUTURA ESPERADA:
      {
        "problemas_ux": [
          {
            "problema": "O que está faltando? (ex: feedback de erro, empty state)",
            "impacto": "Alto" | "Médio" | "Baixo",
            "sessao": "Nome da seção/tela",
            "pagina": "${chunk.startPage}",
            "sugestao_correcao": "O que deve ser adicionado no documento"
          }
        ]
      }
    `;

    const result = await withRetry(() => this.model.generateContent(prompt));
    const response = await result.response;
    const text = response.text().trim();
    const parsed = safeParseJson<{ problemas_ux?: any[] }>(text, "exceptions");

    if (!parsed || !Array.isArray(parsed.problemas_ux)) {
      console.error("Error parsing exceptions JSON or missing problemas_ux array.", { text: text.slice(0, 1000) });
      return { problemas_ux: [] };
    }

    return { problemas_ux: parsed.problemas_ux };
  }
}
