// openaiService.ts
import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

// Initialize the language model
export const initializeChatModel = () => {
  return new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });
};

// Helper function to add a system message to the chat history
export const initializeChatHistory = () => {
  return [
    new SystemMessage("You are a helpful, friendly AI assistant. Be elaborative and engaging in your responses.")
  ];
};

// Helper function to get AI response
export const getAIResponse = async (model: ChatOpenAI, chatHistory: (SystemMessage | HumanMessage | AIMessage)[]) => {
  return await model.invoke(chatHistory);
};