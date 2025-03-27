// chatThread.ts
import * as readline from "readline-sync";
import * as dotenv from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
import { ChatAnthropic } from "@langchain/anthropic";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";

dotenv.config();

type ModelConfig = {
  name: string;
  initializer: () => any;
  history: () => (SystemMessage | HumanMessage | AIMessage)[];
};

const MODEL_CHOICES: Record<string, ModelConfig> = {
  openai: {
    name: "OpenAI (GPT-40-mini)",
    initializer: () => new ChatOpenAI({
      modelName: "gpt-40-mini",
      temperature: 0.7,
      openAIApiKey: process.env.OPENAI_API_KEY,
    }),
    history: () => [new SystemMessage("You are a helpful AI assistant.")],
  },
  deepseek: {
    name: "DeepSeek",
    initializer: () => new ChatOpenAI({
      modelName: "deepseek-chat",
      temperature: 0.7,
      openAIApiKey: process.env.DEEPSEEK_API_KEY,
      configuration: {
        baseURL: process.env.DEEPSEEK_BASE_URL,
      },
    }),
    history: () => [new SystemMessage("You are a helpful AI assistant.")],
  },
  claude: {
    name: "Claude (Anthropic)",
    initializer: () => new ChatAnthropic({
      modelName: "claude-3-sonnet-20240229",
      temperature: 0.7,
      anthropicApiKey: process.env.CLAUDE_API_KEY,
      maxTokens: 1024,
    }),
    history: () => [new SystemMessage("You are a helpful AI assistant.")],
  },
};

async function selectModel(): Promise<string> {
  console.log("Select which AI model to use:");
  Object.entries(MODEL_CHOICES).forEach(([key, config], index) => {
    console.log(`${index + 1}. ${config.name}`);
  });

  while (true) {
    const input = readline.question(`Enter your choice (1-${Object.keys(MODEL_CHOICES).length}): `);
    const choice = parseInt(input) - 1;
    const modelKeys = Object.keys(MODEL_CHOICES);
    
    if (choice >= 0 && choice < modelKeys.length) {
      return modelKeys[choice];
    }
    console.log(`Invalid choice. Please enter 1-${modelKeys.length}.`);
  }
}

export async function chatThread() {
  // Model selection
  const modelKey = await selectModel();
  const modelConfig = MODEL_CHOICES[modelKey];

  // API key verification
  if (
    (modelKey === "openai" && !process.env.OPENAI_API_KEY) ||
    (modelKey === "deepseek" && !process.env.DEEPSEEK_API_KEY) ||
    (modelKey === "claude" && !process.env.CLAUDE_API_KEY)
  ) {
    console.error(`Missing API key for ${modelConfig.name} in .env`);
    process.exit(1);
  }

  // Initialize
  const model = modelConfig.initializer();
  let chatHistory = modelConfig.history();

  console.log(`\nWelcome to the ${modelConfig.name} Chat!`);
  console.log("Type 'exit' to quit.\n");

  // Initial response
  try {
    const initialResponse = await model.invoke(chatHistory);
    console.log(`AI: ${initialResponse.content}`);
    chatHistory.push(initialResponse);
  } catch (error) {
    console.error("Initialization error:", error);
    process.exit(1);
  }

  // Chat loop
  while (true) {
    const userInput = readline.question("\nYou: ");
    if (userInput.toLowerCase() === "exit") {
      console.log(`\n${modelConfig.name}: Goodbye!`);
      break;
    }

    chatHistory.push(new HumanMessage(userInput));
    
    try {
      const response = await model.invoke(chatHistory);
      console.log(`\n${modelConfig.name}: ${response.content}`);
      chatHistory.push(response);
    } catch (error) {
      console.error("API Error:", error);
      chatHistory.pop();
    }
  }
}