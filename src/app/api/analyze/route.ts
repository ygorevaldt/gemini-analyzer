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

    // 1. Extract pages from PDF
    const parser = new pdfParse({ data: arrayBuffer });
    const pdfData = await parser.getText() as any;
    
    let pages: string[] = [];
    if (pdfData.pages && Array.isArray(pdfData.pages)) {
        pages = pdfData.pages.map((p: any) => String(p.text || p));
    } else if (pdfData.text) {
        pages = String(pdfData.text).split('\f');
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

    // 4. Aggregate results
    const aggregator = new Aggregator(apiKey);
    const finalReport = await aggregator.aggregate(intermediateResults);

    return NextResponse.json(finalReport, { status: 200 });
  } catch (error: any) {
    console.error("Error analyzing PDF:", error);
    return NextResponse.json(
      { error: "Failed to analyze PDF", details: error.message },
      { status: 500 }
    );
  }
}
