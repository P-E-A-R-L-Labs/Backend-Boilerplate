// chatThread.ts (updated)
import * as readline from "readline-sync";
import * as dotenv from "dotenv";
import { initializeOpenaiModel, getOpenaiResponse } from "../services/openaiService.ts";
import { initializeDeepSeekModel, getDeepSeekResponse } from "../services/deepseekService.ts";
import { initializeClaudeModel, getClaudeResponse } from "../services/anthropicService.ts";
import { initializeQwenModel, getQwenResponse } from "../services/qwenService.ts";
import { initializeLlamaModel, getLlamaResponse } from "../services/llamaService.ts";
import { initializeMistralModel, getMistralResponse } from "../services/mistralService.ts";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

import { ToolManager, EXAMPLE_TOOLS } from "../../config/toolconfig.ts";

import { createSendTransactionTool } from "../../tools/sendTransaction.ts";
import { createEnsRegistrationTool } from "../../tools/ens.ts";

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
  },
  mistral: {
    name: "Mistral",
    initialize: initializeMistralModel,
    getResponse: getMistralResponse,
    envKey: "MISTRAL_API_KEY"
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

function registerBlockchainTools(toolManager: ToolManager) {
  const MONAD_PRIVATE_KEY = process.env.MONAD_PRIVATE_KEY;
  const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY;
  
  if (MONAD_PRIVATE_KEY) {
    try {
      toolManager.registerTool(createSendTransactionTool(MONAD_PRIVATE_KEY));
      console.log('Blockchain transaction tool registered');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to register blockchain transaction tool:', errorMessage);
      console.warn('Blockchain transaction functionality will be disabled');
    }
  } else {
    console.warn('MONAD_PRIVATE_KEY not set - blockchain transaction tool disabled');
  }
  
  // Register ENS registration tool if ETH_PRIVATE_KEY is set
  if (ETH_PRIVATE_KEY) {
    try {
      toolManager.registerTool(createEnsRegistrationTool(ETH_PRIVATE_KEY));
      console.log('ENS registration tool registered');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to register ENS registration tool:', errorMessage);
      console.warn('ENS registration functionality will be disabled');
    }
  } else {
    console.warn('ETH_PRIVATE_KEY not set - ENS registration tool disabled');
  }
}

export async function chatThread() {
  const modelKey = await selectModel();
  const service = MODEL_SERVICES[modelKey];

  if (!process.env[service.envKey]) {
    console.error(`Missing ${service.name} API key (${service.envKey})`);
    process.exit(1);
  }

  // Initialize tool manager
  const toolManager = new ToolManager();
  
  // Register example tools (in a real app, you might load these dynamically)
  EXAMPLE_TOOLS.forEach(tool => toolManager.registerTool(tool));

  // Register blockchain tools if configured
  registerBlockchainTools(toolManager);

  const model = service.initialize();
  const chatHistory = [
    new SystemMessage(`You are a helpful AI assistant. ${toolManager.getToolsPrompt()}`)
  ];

  console.log(`\n${service.name} Chat Started. Type 'exit' to quit.\n`);

  // Initial response
  try {
    const firstReply = await service.getResponse(model, chatHistory);
    await processAIResponse(firstReply, chatHistory, toolManager, service, model);
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
      await processAIResponse(response, chatHistory, toolManager, service, model);
    } catch (error) {
      console.error("API Error:", error);
      chatHistory.pop();
    }
  }
}

async function processAIResponse(response: AIMessage, chatHistory: any[], toolManager: ToolManager, service: ModelService, model: any) {
  // Check if the response is a tool call
  const toolResult = await toolManager.processToolUse(response);
  
  if (toolResult) {
    console.log(`\nAI used tool: ${toolResult.toolName}`);
    console.log(`\nTool result: ${toolResult.output}`);
    
    // Add the tool result to the chat history
    chatHistory.push(new AIMessage({
      content: `Tool ${toolResult.toolName} was used with result: ${toolResult.output}`,
      tool_calls: response.tool_calls // Preserve the original tool calls metadata if any
    }));
    
    // Get a new response from the model with the tool result
    const followUp = await service.getResponse(model, chatHistory);
    await processAIResponse(followUp, chatHistory, toolManager, service, model);
  } else {
    // Regular response
    console.log(`\nAI: ${response.content}`);
    chatHistory.push(response);
  }
}