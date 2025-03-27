// deepseekService.ts
import { ChatOpenAI } from "@langchain/openai"; // Assuming DeepSeek is compatible with LangChain
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Initialize the DeepSeek model (replace with actual DeepSeek config)
export const initializeDeepSeekModel = () => {
  return new ChatOpenAI({
    modelName: "deepseek-llm", // Replace with actual DeepSeek model name
    temperature: 0.7,
    openAIApiKey: process.env.DEEPSEEK_API_KEY, // Set in .env
    configuration: {
      baseURL: process.env.DEEPSEEK_BASE_URL, // Replace with DeepSeek's API URL
    },
  });
};

// Initialize chat history for DeepSeek
export const initializeDeepSeekChatHistory = () => {
  return [
    new SystemMessage("You are a helpful AI assistant powered by DeepSeek."),
  ];
};

// Get AI response from DeepSeek
export const getDeepSeekResponse = async (
  model: ChatOpenAI,
  chatHistory: (SystemMessage | HumanMessage | AIMessage)[]
) => {
  return await model.invoke(chatHistory);
};