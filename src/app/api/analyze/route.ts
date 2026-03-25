import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { PDFParse as pdfParse } from "pdf-parse";

// Configure Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();

    // Extract text from PDF in memory
    const parser = new pdfParse({ data: arrayBuffer });
    const pdfData = await parser.getText() as any;
    
    let textContext = "";
    if (pdfData.pages && Array.isArray(pdfData.pages)) {
        textContext = pdfData.pages.map((p: any, i: number) => `\n--- PÁGINA ${i + 1} ---\n${p.text || p}`).join('\n');
    } else if (pdfData.text) {
        // Fallback usando page break character \f
        const pages = String(pdfData.text).split('\f');
        textContext = pages.map((text: string, i: number) => `\n--- PÁGINA ${i + 1} ---\n${text}`).join('\n');
    } else {
        textContext = String(pdfData.text || pdfData);
    }

    // Set up Gemini prompt
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    
    const prompt = `
Você é um Arquiteto de Soluções e Auditor de QA Sênior especialista no ecossistema Citsmart com foco em sistemas governamentais e missão crítica. 
Sua tarefa é realizar uma análise destrutiva e crítica do documento de requisitos fornecido para garantir que ele esteja pronto para ser desenvolvido por uma equipe que utiliza AngularJS, bootstrap (Frontend), Node.js (Backend), bancos de dados PostgreSQL ou Oracle Exadata e tem recursos no citsmart para trabalhar com envio de e-mails e execução de scripts cron.

O objetivo não é apenas resumir, mas identificar o que NÃO está escrito e as falhas que farão o sistema falhar em produção ou gerar chamados de suporte excessivos.

O relatório final será entregue a um Business Partner (BP), que será responsável por ajustar o documento original. Portanto, a linguagem deve ser profissional, clara e instrutiva.

### CRITÉRIOS DE ANÁLISE:
1. **Funcionalidades da Aplicação:** Liste com alta precisão e detalhamento todas as funcionalidades previstas, abordando telas, ações de usuário final e painéis administrativos.
2. **Fluxos de Exceção:** Identifique funcionalidades onde não há definição do que ocorre se a API cair, se o dado for inválido ou se o usuário cancelar a ação.
3. **Integrações Ocultas:** Identifique menções a sistemas externos (ex: Gov.br, bases de dados de servidores, APIs de terceiros). Verifique se o documento detalha o nome e link da documentação do serviço para que a equipe de desenvolvimento possa implementar a integração.
4. **Resiliência e UX:** Procure por falta de "Empty States" (o que mostrar quando não há registros) e falta de feedback (mensagens de erro, sucesso, carregamento).
5. **Gaps de Regra de Negócio:** Encontre contradições ou situações onde o status de um registro fica em um "limbo" sem definição de próximo passo.
6. **Métricas de Qualidade (RNs e RFs):** Conte quantas Regras de Negócio (RNs) e Requisitos Funcionais (RFs) estão descritos de forma satisfatória e quantos apresentam gaps, falta de informação ou contradições lógicas.

### RETORNO OBRIGATÓRIO (JSON):
Retorne estritamente um JSON com esta estrutura:
{
  "projeto_resumo": "Breve descrição focando no propósito central",
  "funcionalidades_principais": ["Listagem precisa e detalhada das funcionalidades (ex: Autenticação SSO, CRUD de Usuários, Geração de Relatórios)"],
  "metricas_qualidade": {
    "rn_satisfatorias": 0,
    "rn_com_gaps": 0,
    "rf_satisfatorios": 0,
    "rf_com_gaps": 0
  },
  "analise_integridade": "Uma nota de 0 a 10 sobre quão 'à prova de falhas' o documento está, com uma breve justificativa",
  "falhas_logicas_e_excecoes": [
    {
      "problema": "Descrição da falha ou fluxo de exceção ausente",
      "impacto": "Alto/Médio/Baixo",
      "sessao": "Nome da seção no doc",
      "pagina": "X",
      "sugestao_correcao": "Como o fluxo deveria ter sido especificado"
    }
  ],
  "integracoes_e_dependencias": [
    {
      "sistema": "Nome da integração/webservice/api mencionada",
      "status_especificacao": "Omissão Total / Parcialmente Especificado",
      "detalhe": "O que falta incluir no documento. Ex: Falta link da documentação e nome oficial do serviço."
    }
  ],
  "gaps_regra_negocio": [
    {
      "regra": "A regra que está incompleta",
      "cenario_omitido": "O caso de borda que não foi tratado",
      "risco": "Risco para o projeto",
      "pagina": "X"
    }
  ],
  "mensagens_e_estados_ausentes": ["Lista de feedbacks ou telas de 'vazio' que não foram previstos"],
  "conclusao_tecnica": "Parecer final se o documento pode ou não seguir para desenvolvimento"
}

Importante: 
1. Ao sugerir correções, limite-se a propor a solução lógica ou arquitetural. **NÃO afirme e NÃO presuma** o que a plataforma Citsmart pode ou não implementar.
2. Baseie os números de página estritamente nos marcadores '--- PÁGINA X ---'.

TEXTO DO DOCUMENTO:
${textContext}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let textResult = response.text();
    
    // Clean up potential markdown formatting from Gemini's response
    textResult = textResult.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    
    // Attempt to parse JSON to validate it, and send it as response
    const jsonResult = JSON.parse(textResult);

    return NextResponse.json(jsonResult, { status: 200 });
  } catch (error: any) {
    console.error("Error analyzing PDF:", error);
    return NextResponse.json(
      { error: "Failed to analyze PDF", details: error.message },
      { status: 500 }
    );
  }
}
