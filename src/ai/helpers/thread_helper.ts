import express from "express";
import { ChatOpenAI } from "langchain/chat_models/openai";
import { ChatAnthropic } from "langchain/chat_models/anthropic";
import { ChatMistral } from "langchain/chat_models/mistral";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { BaseChatModel } from "langchain/chat_models/base";
import { LlamaModel } from "langchain/llms/llama";

const app = express();
app.use(express.json());

// Store active threads
const activeThreads = new Map();

// LLM provider factory
class LLMFactory {
  static createModel(provider: string, options: any = {}): BaseChatModel {
    switch (provider.toLowerCase()) {
      case "openai":
        return new ChatOpenAI({
          modelName: options.model || "gpt-4",
          temperature: options.temperature || 0.7,
          apiKey: process.env.OPENAI_API_KEY,
        });
      case "anthropic":
        return new ChatAnthropic({
          modelName: options.model || "claude-3-sonnet-20240229",
          temperature: options.temperature || 0.7,
          apiKey: process.env.ANTHROPIC_API_KEY,
        });
      case "mistral":
        return new ChatMistral({
          modelName: options.model || "mistral-large",
          temperature: options.temperature || 0.7,
          apiKey: process.env.MISTRAL_API_KEY,
        });
      case "llama":
        return new LlamaModel({
          modelPath: options.modelPath || "./models/llama-2-13b-chat.gguf",
          temperature: options.temperature || 0.7,
        });
      case "deepseek":
        // Implementation depends on how Deepseek is accessed
        // This is just an example using OpenAI's format
        return new ChatOpenAI({
          modelName: options.model || "deepseek-coder", 
          temperature: options.temperature || 0.7,
          apiKey: process.env.DEEPSEEK_API_KEY,
          basePath: "https://api.deepseek.com/v1",  // Example URL
        });
      default:
        throw new Error(`Unsupported LLM provider: ${provider}`);
    }
  }
}

// Create a new thread
app.post("/threads", (req, res) => {
  const { provider, model, temperature } = req.body;
  
  try {
    const llm = LLMFactory.createModel(provider, { model, temperature });
    
    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: "history",
    });
    
    const conversation = new ConversationChain({
      llm: llm,
      memory: memory,
    });
    
    const threadId = Date.now().toString();
    activeThreads.set(threadId, {
      conversation,
      provider,
      model: model || "default",
      createdAt: new Date(),
    });
    
    res.json({ 
      threadId, 
      provider, 
      model: model || "default" 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Send message and get response
app.post("/threads/:threadId/messages", async (req, res) => {
  const { threadId } = req.params;
  const { content } = req.body;
  
  const thread = activeThreads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  try {
    const response = await thread.conversation.call({
      input: content,
    });
    
    res.json({ 
      message: response.response,
      provider: thread.provider,
      model: thread.model
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change LLM for existing thread
app.patch("/threads/:threadId", async (req, res) => {
  const { threadId } = req.params;
  const { provider, model, temperature } = req.body;
  
  const thread = activeThreads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  try {
    // Create new LLM
    const newLLM = LLMFactory.createModel(provider, { model, temperature });
    
    // Update the conversation chain with new LLM but keep memory
    thread.conversation.llm = newLLM;
    thread.provider = provider;
    thread.model = model || "default";
    
    res.json({ 
      threadId, 
      provider, 
      model: model || "default" 
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get thread info
app.get("/threads/:threadId", (req, res) => {
  const { threadId } = req.params;
  
  const thread = activeThreads.get(threadId);
  if (!thread) {
    return res.status(404).json({ error: "Thread not found" });
  }
  
  res.json({
    threadId,
    provider: thread.provider,
    model: thread.model,
    createdAt: thread.createdAt
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});