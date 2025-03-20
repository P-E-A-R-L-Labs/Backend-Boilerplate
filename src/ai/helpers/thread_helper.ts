import * as readline from "readline-sync";
import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { HumanMessage, AIMessage, SystemMessage } from "@langchain/core/messages";
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export async function chatThread() {
  // Check if API key is set
  if (!process.env.OPENAI_API_KEY) {
    console.error("Please set your OPENAI_API_KEY in the .env file");
    process.exit(1);
  }

  // Initialize the language model
  const model = new ChatOpenAI({
    modelName: "gpt-3.5-turbo",
    temperature: 0.7,
  });

  console.log("Welcome to the AI Chat Assistant!");
  console.log("Type 'exit' to end the conversation.\n");

  // Initialize chat history with a system message
  const chatHistory = [
    new SystemMessage("You are a helpful, friendly AI assistant. Be ellaborative and engaging in your responses.")
  ];

  // Display a greeting from the AI
  const initialResponse = await model.invoke(chatHistory);
  console.log(`AI: ${initialResponse.content}`);
  chatHistory.push(initialResponse);

  // Start conversation loop
  while (true) {
    // Get user input
    const userInput = readline.question("\nYou: ");
    
    // Check if user wants to exit
    if (userInput.toLowerCase() === 'exit') {
      console.log("AI: Goodbye! Have a great day!");
      break;
    }
    
    // Add user message to history
    chatHistory.push(new HumanMessage(userInput));
    
    // Get AI response
    try {
      const response = await model.invoke(chatHistory);
      console.log(`\nAI: ${response.content}`);
      
      // Add AI response to history
      chatHistory.push(response);
    } catch (error) {
      console.error("Error getting AI response:", error);
      chatHistory.pop(); // Remove the user message if there was an error
    }
  }
}

