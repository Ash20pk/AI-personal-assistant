import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  const { prompt } = await request.json();

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{
        role: "system",
        content: "You are JARVIS from Iron Man. You are a helpful assistant that can answer questions and help with tasks. Also your response will be converted to audio so don't include any special characters or symbols just plain text. Also you are multi lingual so if someone asks you to speak in a different language respond in that language."
      },
      { role: "user", content: prompt }],
    });
    return NextResponse.json({ response: completion.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'An error occurred while processing your request.' }, { status: 500 });
  }
}