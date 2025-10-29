import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { templateEngine } from "@/lib/templateEngine";
import { getTemplateById } from "@/lib/templates";
import { ChatRequest, ChatResponse } from "@/types";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const body: ChatRequest = await request.json();
    const {
      message,
      templateId,
      templateVariables = {},
      conversationHistory = [],
    } = body;

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    // Build messages array
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];

    // Add system message from template if provided
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        try {
          const templateResult = templateEngine.render(
            template,
            templateVariables
          );
          messages.push({ role: "system", content: templateResult.content });
        } catch (error) {
          console.error("Template rendering error:", error);
          return NextResponse.json(
            {
              error: `Template error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
            { status: 400 }
          );
        }
      } else {
        return NextResponse.json(
          { error: `Template not found: ${templateId}` },
          { status: 404 }
        );
      }
    } else {
      // Default system message
      messages.push({
        role: "system",
        content: "You are a helpful assistant.",
      });
    }

    // Add conversation history
    conversationHistory.forEach((msg) => {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    });

    // Add current user message
    messages.push({ role: "user", content: message });

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error("No reply from model");
    }

    const processingTime = Date.now() - startTime;
    const response: ChatResponse = {
      response: reply,
      templateId,
      metadata: {
        model: "gpt-3.5-turbo",
        tokensUsed: completion.usage?.total_tokens,
        processingTime,
      },
    };

    return NextResponse.json(response);
  } catch (err: unknown) {
    console.error("OpenAI error:", err);
    return NextResponse.json(
      { error: "Error communicating with OpenAI API." },
      { status: 500 }
    );
  }
}
