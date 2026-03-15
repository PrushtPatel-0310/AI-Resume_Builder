import { generateAiContent } from "@/Services/resumeAPI";

// Create a chat session-like interface
let chatHistory = [];

export const AIChatSession = {
  sendMessage: async (message) => {
    // Add user message to history
    chatHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Build the full conversation context
    const contents = chatHistory.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: msg.parts
    }));

    const result = await generateAiContent({ contents });
    const assistantMessage = result?.data?.text;

    if (!assistantMessage || typeof assistantMessage !== "string") {
      throw new Error("AI service returned an invalid response.");
    }

    // Add assistant response to history
    chatHistory.push({
      role: "model",
      parts: [{ text: assistantMessage }],
    });

    return {
      response: {
        text: () => assistantMessage,
      },
    };
  }
};