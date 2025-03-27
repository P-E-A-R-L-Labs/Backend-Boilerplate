import { ChatGroq } from "@langchain/groq";
import { SystemMessage, HumanMessage, AIMessage } from "@langchain/core/messages";

export const initializeGroqModel = () => {
  return new ChatGroq({
    model: "qwen-2.5-32b",
    temperature: 0.7,
    apiKey: process.env.GROQ_API_KEY,
  });
};

export const getGroqResponse = async (
    model: ChatGroq,
    chatHistory: (SystemMessage | HumanMessage | AIMessage)[]
) => {
    return await model.invoke(chatHistory);
}

export const initializeGroqChatHistory = () => [
    new SystemMessage("You are a helpful AI assistant"),
];