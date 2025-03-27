// chatThread.ts
import * as readline from "readline-sync";
import * as dotenv from "dotenv";
import { initializeOpenaiModel, getOpenaiResponse } from "../services/openaiService.ts";
import { initializeDeepSeekModel, getDeepSeekResponse } from "../services/deepseekService.ts";
import { initializeClaudeModel, getClaudeResponse } from "../services/anthropicService.ts";
import { initializeQwenModel, getQwenResponse } from "../services/groqService.ts";
import { initializeLlamaModel, getLlamaResponse } from "../services/llamaService.ts";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

dotenv.config();

type ModelService = {
  name: string;
  initialize: () => any;
  getResponse: (model: any, history: any[]) => Promise<AIMessage>;
  envKey: string;
};

const MODEL_SERVICES: Record<string, ModelService> = {
  openai: {
    name: "OpenAI",
    initialize: initializeOpenaiModel,
    getResponse: getOpenaiResponse,
    envKey: "OPENAI_API_KEY"
  },
  deepseek: {
    name: "DeepSeek",
    initialize: initializeDeepSeekModel,
    getResponse: getDeepSeekResponse,
    envKey: "DEEPSEEK_API_KEY"
  },
  claude: {
    name: "Claude",
    initialize: initializeClaudeModel,
    getResponse: getClaudeResponse,
    envKey: "CLAUDE_API_KEY"
  },
  qwen: {
    name: "Qwen",
    initialize: initializeQwenModel,
    getResponse: getQwenResponse,
    envKey: "QWEN_API_KEY"
  },
  llama: {
    name: "Llama",
    initialize: initializeLlamaModel,
    getResponse: getLlamaResponse,
    envKey: "LLAMA_API_KEY"
  }
};

async function selectModel(): Promise<string> {
  console.log("Select AI Model:");
  Object.entries(MODEL_SERVICES).forEach(([key, service], index) => {
    console.log(`${index + 1}. ${service.name}`);
  });

  while (true) {
    const input = readline.question(`Choice (1-${Object.keys(MODEL_SERVICES).length}): `);
    const choice = parseInt(input) - 1;
    const modelKeys = Object.keys(MODEL_SERVICES);
    
    if (choice >= 0 && choice < modelKeys.length) {
      return modelKeys[choice];
    }
    console.log(`Invalid. Enter 1-${modelKeys.length}`);
  }
}

export async function chatThread() {
  const modelKey = await selectModel();
  const service = MODEL_SERVICES[modelKey];

  if (!process.env[service.envKey]) {
    console.error(`Missing ${service.name} API key (${service.envKey})`);
    process.exit(1);
  }

  const model = service.initialize();
  const chatHistory = [new SystemMessage("You are a helpful AI assistant.")];

  console.log(`\n${service.name} Chat Started. Type 'exit' to quit.\n`);

  // Initial response
  try {
    const firstReply = await service.getResponse(model, chatHistory);
    console.log(`AI: ${firstReply.content}`);
    chatHistory.push(firstReply);
  } catch (error) {
    console.error("Startup error:", error);
    process.exit(1);
  }

  // Chat loop
  while (true) {
    const userInput = readline.question("\nYou: ");
    if (userInput.toLowerCase() === "exit") break;

    chatHistory.push(new HumanMessage(userInput));
    
    try {
      const response = await service.getResponse(model, chatHistory);
      console.log(`\nAI: ${response.content}`);
      chatHistory.push(response);
    } catch (error) {
      console.error("API Error:", error);
      chatHistory.pop();
    }
  }
}