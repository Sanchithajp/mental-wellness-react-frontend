import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

// System prompt for the wellness chatbot
const SYSTEM_PROMPT = `You are a compassionate and supportive mental wellness companion named MindEase. 
Your role is to:
- Provide empathetic, non-judgmental support
- Offer gentle guidance on mental health and wellness
- Suggest appropriate coping strategies and exercises
- Listen actively and validate feelings
- Maintain a warm, caring, and professional tone
- Never provide medical advice or diagnose conditions
- Encourage users to seek professional help when appropriate

Keep responses concise, supportive, and focused on the user's wellbeing.`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body || !body.message) {
      return NextResponse.json(
        { error: "Missing 'message' field" },
        { status: 400 }
      );
    }

    const userMessage = body.message;
    const conversationHistory = Array.isArray(body.history) ? body.history : [];

    // Get Groq API key from environment
    const groqApiKey = process.env.GROQ_API_KEY;
    
    if (!groqApiKey || groqApiKey === 'your_groq_api_key_here') {
      return NextResponse.json(
        {
          error: "Groq API key not configured",
          message: "Please set GROQ_API_KEY in your .env.local file. Get your API key from https://console.groq.com/",
          response: "I'm sorry, but the AI service is not configured. Please contact the administrator to set up the Groq API key."
        },
        { status: 503 }
      );
    }

    // Initialize Groq client
    const groq = new Groq({
      apiKey: groqApiKey,
    });

    // Build messages array for Groq API
    const messages: Array<{ role: string; content: string }> = [
      { role: "system", content: SYSTEM_PROMPT }
    ];

    // Add conversation history (last 10 messages to avoid token limits)
    const recentHistory = Array.isArray(conversationHistory) 
      ? conversationHistory.slice(-10) 
      : [];
    
    for (const msg of recentHistory) {
      if (msg && typeof msg === 'object' && 'sender' in msg && 'text' in msg) {
        const role = msg.sender === "user" ? "user" : "assistant";
        messages.push({ role, content: String(msg.text || "") });
      }
    }

    // Add current user message
    messages.push({ role: "user", content: userMessage });

    // Call Groq API
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile", // You can change this to other Groq models
      messages: messages as any,
      temperature: 0.7,
      max_tokens: 500,
    });

    const botResponse = completion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

    return NextResponse.json({
      response: botResponse,
      success: true
    });

  } catch (error: any) {
    console.error("Error in chat endpoint:", error);
    return NextResponse.json(
      {
        error: "An error occurred while processing your message",
        details: error.message,
        response: "I'm sorry, I encountered an error. Please try again later."
      },
      { status: 500 }
    );
  }
}
