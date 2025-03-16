import OpenAI from "openai";
import * as dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

// Configure OpenAI client for DeepSeek
const deepseekClient = new OpenAI({
  baseURL: process.env.DEEPSEEK_BASE_URL,
  apiKey: process.env.DEEPSEEK_OFFICIAL_KEY,
});

// Function to call DeepSeek directly
async function callDeepseek(prompt: string) {
  try {
    const completion = await deepseekClient.chat.completions.create({
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: prompt },
      ],
      model: "deepseek-chat",
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("Error calling DeepSeek API:", error);
    throw error;
  }
}

// Function to call OpenRouter with any supported model
async function callOpenRouter(
  prompt: string,
  model: string = "deepseek/deepseek-r1-zero:free"
) {
  try {
    const response = await fetch(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_DEEPSEEK_API_KEY}`,
          "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
          "X-Title": process.env.SITE_NAME || "AI Integration App",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error calling OpenRouter API:", error);
    throw error;
  }
}

// Example usage
async function main() {
  const prompt = "Rank the top 5 cities to live in the world.";

  try {
    // Choose which service to use
    const useOpenRouter = true; // Change to false to use DeepSeek directly

    if (useOpenRouter) {
      console.log("Using OpenRouter with DeepSeek model:");
      const openRouterResponse = await callOpenRouter(prompt);
      console.log(openRouterResponse);
    } else {
      console.log("Using DeepSeek directly:");
      const deepseekResponse = await callDeepseek(prompt);
      console.log(deepseekResponse);
    }
  } catch (error) {
    console.error("Error in main:", error);
  }
}

main();
