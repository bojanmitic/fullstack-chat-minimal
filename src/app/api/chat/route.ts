import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    // Debug logging
    console.log("API Key exists:", !!process.env.OPENAI_API_KEY);
    console.log("API Key length:", process.env.OPENAI_API_KEY?.length || 0);
    
    const { message } = await request.json();

    if (!message) {
      return NextResponse.json(
        { error: "No message provided" },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        { role: "user", content: message },
      ],
    });

    const reply = completion.choices[0]?.message?.content;
    if (!reply) {
      throw new Error("No reply from model");
    }

    return NextResponse.json({ response: reply });
  } catch (err: unknown) {
    console.error("OpenAI error:", err);
    return NextResponse.json(
      { error: "Error communicating with OpenAI API." },
      { status: 500 }
    );
  }
}
