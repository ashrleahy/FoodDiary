import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { description, type } = await req.json();

    if (!description) {
      return NextResponse.json({ error: 'Description required' }, { status: 400 });
    }

    const typeContext = type === 'alcohol'
      ? 'alcoholic drink or beverage'
      : type === 'drink'
      ? 'non-alcoholic drink or beverage'
      : type === 'water'
      ? 'water or hydrating drink'
      : 'meal or food item';

    const prompt = `You are a nutrition expert. Estimate the calories and protein for this ${typeContext}: "${description}"

Respond with ONLY a JSON object in this exact format (no markdown, no explanation):
{
  "calories": <number>,
  "protein": <number - grams of protein>,
  "confidence": "low" | "medium" | "high",
  "notes": "<brief one-sentence note about your estimate>",
  "ml": <number or null - liquid volume in ml if this is a drink>,
  "alcoholUnits": <number or null - standard Australian drinks (10g alcohol each) if alcoholic>
}

Use realistic Australian portion sizes. For meals, estimate a typical serving. Be conservative but realistic.`;

    const message = await client.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    const clean = text.replace(/```json\n?|```\n?/g, '').trim();
    const result = JSON.parse(clean);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Calorie estimate error:', error);
    return NextResponse.json({ error: 'Failed to estimate calories' }, { status: 500 });
  }
}
