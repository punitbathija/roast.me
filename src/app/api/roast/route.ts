import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export type RoastAnswer = {
  question: string;
  answer: string;
};

type RoastRequestBody = {
  resumeText: string;
  answers: RoastAnswer[];
};

const SYSTEM_INSTRUCTIONS = `You are the headline act at a comedy roast, and tonight's subject is
the resume you're given. Your job is to roast it — sharp, witty, a little
merciless, but never cruel in a way that would actually hurt someone.

Rules:
- Roast the CHOICES on the resume (buzzwords, gaps, vague titles, generic
  bullet points, the answers they gave you) — not the person's identity,
  appearance, race, gender, religion, disability, or anything they didn't
  choose.
- Make it India-centric and relatable: use playful Indian workplace and life
  references like chai breaks, traffic, WhatsApp forwards, aunties, wedding
  card-style ambitions, local train energy, cousin's "just one more" startup,
  and the chaos of Indian job-hunting — but keep it clever, not offensive.
- Write like a dramatic Indian stand-up comic delivering the verdict with a
  mock-serious, over-the-top, highly entertaining tone.
- Be genuinely funny. Specific beats generic — reference actual lines from
  the resume and their actual answers.
- Keep it to 4-6 short punchy paragraphs. Comedy timing, not an essay.
- End on one backhanded compliment that's actually a little bit true.
- No slurs, no punching down at protected characteristics, no medical or
  mental health mockery.`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server isn't configured with a Gemini key yet." },
      { status: 500 }
    );
  }

  let body: RoastRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { resumeText, answers } = body;

  if (!resumeText || resumeText.trim().length < 20) {
    return NextResponse.json(
      { error: "No usable resume text was provided." },
      { status: 400 }
    );
  }
  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json(
      { error: "No question answers were provided." },
      { status: 400 }
    );
  }

  const answersBlock = answers
    .map((a, i) => `${i + 1}. ${a.question}\n   Answer: ${a.answer}`)
    .join("\n");

  const prompt = `Here is the resume text (extracted from a PDF, formatting lost):
"""
${resumeText.slice(0, 6000)}
"""

Here's how they answered the pre-show questions:
${answersBlock}

Roast this resume.`;

  try {
    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: { systemInstruction: SYSTEM_INSTRUCTIONS },
    });

    const roastText = result.text;
    if (!roastText) {
      throw new Error("Empty response from Gemini");
    }

    return NextResponse.json({ roast: roastText });
  } catch (err) {
    console.error("Gemini roast generation failed:", err);
    return NextResponse.json(
      { error: "The comedian bombed. Try again in a moment." },
      { status: 502 }
    );
  }
}
