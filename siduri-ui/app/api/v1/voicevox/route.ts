import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const VOICEVOX_URL = "http://127.0.0.1:50021";

export async function POST(req: NextRequest) {
  try {
    const { text, speaker } = await req.json();

    if (!text) {
      return new NextResponse("Text is required", { status: 400 });
    }

    const hash = crypto.createHash('md5').update(`${speaker}_${text}`).digest('hex');
    const publicDir = path.join(process.cwd(), 'public', 'voices');
    const filePath = path.join(publicDir, `${hash}.wav`);
    const fileUrl = `/voices/${hash}.wav`;

    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    if (fs.existsSync(filePath)) {
      return NextResponse.json({ url: fileUrl });
    }

    // 1. Generate audio query from the local Voicevox engine
    const queryUrl = `${VOICEVOX_URL}/audio_query?text=${encodeURIComponent(text)}&speaker=${speaker}`;
    const queryRes = await fetch(queryUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    
    if (!queryRes.ok) {
      throw new Error(`Voicevox audio_query failed: ${queryRes.statusText}`);
    }
    
    const queryJson = await queryRes.json();
    
    // Maintain the slower, more natural pacing
    queryJson.speedScale = 0.85;

    // 2. Synthesize audio
    const synthUrl = `${VOICEVOX_URL}/synthesis?speaker=${speaker}`;
    const synthRes = await fetch(synthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "audio/wav"
      },
      body: JSON.stringify(queryJson)
    });
    
    if (!synthRes.ok) {
      throw new Error(`Voicevox synthesis failed: ${synthRes.statusText}`);
    }
    
    const arrayBuffer = await synthRes.arrayBuffer();
    
    // 3. Save the WAV buffer to the public directory
    fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

    return NextResponse.json({ url: fileUrl });

  } catch (error) {
    console.error("Voicevox API Proxy Error:", error);
    return new NextResponse("Internal Server Error communicating with Voicevox", { status: 500 });
  }
}
