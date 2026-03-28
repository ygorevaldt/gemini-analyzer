import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Chunker } from "@/lib/ai/chunker";
import { Pipeline } from "@/lib/ai/pipeline";
import { Aggregator } from "@/lib/ai/aggregator";
import { FunctionalitiesAgent } from "@/lib/ai/agents/functionalities";
import { BusinessRulesAgent } from "@/lib/ai/agents/businessRules";
import { IntegrationsAgent } from "@/lib/ai/agents/integrations";
import { ExceptionsAgent } from "@/lib/ai/agents/exceptions";
import { ConflictsAgent } from "@/lib/ai/agents/conflicts";
import { CrossChunkAgent } from "@/lib/ai/agents/crossChunk";
import { PDFParse as pdfParse } from "pdf-parse";

// Configure Gemini
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || "");

function buildPartialFinalReport(results: any[]) {
  const uniqueByJson = <T>(items: T[]) => {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = JSON.stringify(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  };

  const funcionalidades = uniqueByJson(
    results.filter((r) => r.agent === "Functionalities").flatMap((r) => r.funcionalidades || []),
  );
  const gaps = uniqueByJson(results.filter((r) => r.agent === "Business Rules").flatMap((r) => r.gaps || []));
  const integracoes = uniqueByJson(
    results.filter((r) => r.agent === "Integrations").flatMap((r) => r.integracoes || []),
  );
  const problemasUX = uniqueByJson(
    results.filter((r) => r.agent === "Exceptions").flatMap((r) => r.problemas_ux || []),
  );
  const conflitos = uniqueByJson(results.filter((r) => r.agent === "Conflicts").flatMap((r) => r.conflitos || []));
  const conflitos_cruzados = uniqueByJson(
    results.filter((r) => r.agent === "CrossChunk").flatMap((r) => r.conflitos_cruzados || []),
  );

  return {
    projeto_resumo: "Relatório parcial gerado devido a falha na agregação final.",
    funcionalidades_principais: funcionalidades,
    metricas_qualidade: {
      rn_satisfatorias: 0,
      rn_com_gaps: gaps.length,
      rf_satisfatorios: 0,
      rf_com_gaps: gaps.length,
    },
    analise_integridade: "Análise parcial disponível.",
    falhas_logicas_e_excecoes: problemasUX,
    integracoes_e_dependencias: integracoes,
    gaps_regra_negocio: gaps,
    mensagens_e_estados_ausentes: problemasUX.slice(0, 10).map((item: any) => item.problema || "Não identificado"),
    conflitos_cruzados: conflitos_cruzados,
    conclusao_tecnica:
      "A agregação final falhou, mas há resultados parciais disponíveis. Refaça a análise assim que possível.",
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Read the file buffer
    const arrayBuffer = await file.arrayBuffer();

    // 1. Extract pages from PDF
    const parser = new pdfParse({ data: arrayBuffer });
    const pdfData = (await parser.getText()) as any;

    let pages: string[] = [];
    if (pdfData.pages && Array.isArray(pdfData.pages)) {
      pages = pdfData.pages.map((p: any) => String(p.text || p));
    } else if (pdfData.text) {
      pages = String(pdfData.text).split("\f");
    } else {
      pages = [String(pdfData.text || pdfData)];
    }

    // 2. Generate chunks
    const chunker = new Chunker();
    const chunks = chunker.chunkDocument(pages);

    // 3. Setup and execute pipeline
    const apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
    const pipeline = new Pipeline();

    pipeline
      .addAgent(new FunctionalitiesAgent(apiKey))
      .addAgent(new BusinessRulesAgent(apiKey))
      .addAgent(new IntegrationsAgent(apiKey))
      .addAgent(new ExceptionsAgent(apiKey))
      .addAgent(new ConflictsAgent(apiKey));

    console.log(`Starting analysis for ${chunks.length} chunks...`);
    const intermediateResults = await pipeline.execute(chunks);

    // 4. Cross-chunk review of the whole document
    const crossChunkAgent = new CrossChunkAgent(apiKey);
    const crossChunkResult = await crossChunkAgent.analyzeDocument(chunks, intermediateResults);
    intermediateResults.push({
      agent: crossChunkAgent.name,
      chunkId: "document",
      ...crossChunkResult,
    });

    // 5. Aggregate results
    const aggregator = new Aggregator(apiKey);
    let finalReport;

    try {
      finalReport = await aggregator.aggregate(intermediateResults);
    } catch (aggregateError) {
      console.error("Error during final aggregation:", aggregateError);
      finalReport = buildPartialFinalReport(intermediateResults);
    }

    return NextResponse.json(finalReport, { status: 200 });
  } catch (error: any) {
    console.error("Error analyzing PDF:", error);
    return NextResponse.json({ error: "Failed to analyze PDF", details: error.message }, { status: 500 });
  }
}
