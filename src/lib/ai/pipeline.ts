import pLimit from "p-limit";
import { AnalysisResult, Agent, Chunk } from "./types";

export class Pipeline {
  private agents: Agent[] = [];

  addAgent(agent: Agent) {
    this.agents.push(agent);
    return this;
  }

  async execute(chunks: Chunk[]): Promise<AnalysisResult[]> {
    const allResults: AnalysisResult[] = [];

    const limit = pLimit(2);

    for (const chunk of chunks) {
      console.log(`Running pipeline for ${chunk.id}...`);

      const agentPromises = this.agents.map((agent) =>
        limit(async () => {
          try {
            const result = await agent.analyze(chunk);
            return {
              agent: agent.name,
              chunkId: chunk.id,
              ...result
            };
          } catch (error) {
            console.error(`Error in agent ${agent.name} for ${chunk.id}:`, error);
            return {
              agent: agent.name,
              chunkId: chunk.id,
              error: "Analysis failed"
            };
          }
        })
      );

      const chunkResults = await Promise.all(agentPromises);
      allResults.push(...chunkResults);

      await new Promise((r) => setTimeout(r, 800));
    }

    return allResults;
  }
}