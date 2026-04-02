import { GoogleGenerativeAI, GenerativeModel } from "@google/generative-ai";
import { GoogleAICacheManager } from "@google/generative-ai/server";
import pLimit from "p-limit";
import crypto from "crypto";
import { AnalysisResult, Agent, Chunk } from "./types";

export class Pipeline {
  private agents: Agent[] = [];

  addAgent(agent: Agent) {
    this.agents.push(agent);
    return this;
  }

  async execute(chunks: Chunk[], apiKey: string): Promise<{ results: AnalysisResult[], cachedModel: GenerativeModel | null }> {
    const allResults: AnalysisResult[] = [];
    const limit = pLimit(4);
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 1. Prepare full text and generate hash IMMEDIATELY
    const fullText = chunks.map(c => c.content).join("\n");
    const contentHash = crypto.createHash("sha256").update(fullText).digest("hex");
    
    let cachedModel: GenerativeModel | null = null;
    let cacheName: string | null = null;

    try {
      console.log(`🔍 Checking cache for content hash: ${contentHash.slice(0, 100)}...`);
      const cacheManager = new GoogleAICacheManager(apiKey);
      
      // Try to find existing cache BEFORE counting tokens
      const listResponse = await cacheManager.list();
      const existingCache = listResponse.cachedContents?.find(c => c.displayName === contentHash);

      if (existingCache) {
        console.log(`♻️ Cache HIT! Reusing existing Google Context Cache: ${existingCache.name}`);
        // @ts-ignore
        cachedModel = genAI.getGenerativeModelFromCachedContent(existingCache);
        cacheName = existingCache.name ?? null;
      } else {
        // Cache MISS: Count tokens to see if we should create one
        const tempModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
        const { totalTokens } = await tempModel.countTokens(fullText);
        console.log(`Total tokens for analysis: ${totalTokens}`);

        if (totalTokens > 32768) {
          console.log("🚀 Document exceeds 32k tokens. Creating new Google Context Cache...");
          const cache = await cacheManager.create({
            model: "models/gemini-2.5-flash",
            displayName: contentHash,
            contents: [{ role: "user", parts: [{ text: fullText }] }],
            ttlSeconds: 3600,
          });
          console.log(`✅ Cache created successfully: ${cache.name}`);
          // @ts-ignore
          cachedModel = genAI.getGenerativeModelFromCachedContent(cache);
          cacheName = cache.name ?? null;
        } else {
          console.log("ℹ️ Document below 32k tokens. Using standard pipeline.");
        }
      }

      // Inject the cached model into all agents if we have one
      if (cachedModel) {
        for (const agent of this.agents) {
          if (agent.setModel) {
            agent.setModel(cachedModel);
          }
        }
      }
    } catch (cacheError) {
      console.error("⚠️ Cache system error. Falling back to standard pipeline:", cacheError);
    }

    const tasks = chunks.flatMap(chunk => 
      this.agents.map(agent => ({ chunk, agent }))
    );

    console.log(`🚀 Starting analysis with ${tasks.length} tasks concurrently...`);

    const results = await Promise.all(tasks.map(({ chunk, agent }) => 
      limit(async () => {
        try {
          console.log(`Running analysis: Agent ${agent.name} for ${chunk.id}...`);
          const startTime = Date.now();
          const result = await agent.analyze(chunk);
          const duration = ((Date.now() - startTime) / 1000).toFixed(1);
          console.log(`✅ Completed: Agent ${agent.name} for ${chunk.id} in ${duration}s`);
          
          return {
            agent: agent.name,
            chunkId: chunk.id,
            ...result
          };
        } catch (error) {
          console.error(`❌ Error in agent ${agent.name} for ${chunk.id}:`, error);
          return {
            agent: agent.name,
            chunkId: chunk.id,
            error: "Analysis failed"
          };
        }
      })
    ));

    allResults.push(...results);

    return { results: allResults, cachedModel };
  }
}