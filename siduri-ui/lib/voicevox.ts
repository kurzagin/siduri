export const NURSE_ROBO_TYPE_T_NORMAL = 47;

/**
 * Synthesizes speech using the local Voicevox engine, proxied through a Next.js API route 
 * to bypass localhost network blocks when testing on mobile devices.
 * @param text The text to synthesize
 * @param speakerId The Voicevox speaker ID (defaults to Nurse Robo Type T Normal)
 * @returns A blob URL containing the WAV audio, or null if failed
 */
export async function synthesizeVoice(text: string, speakerId: number = NURSE_ROBO_TYPE_T_NORMAL): Promise<string | null> {
  if (!text.trim()) return null;

  try {
    const res = await fetch("/api/v1/voicevox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, speaker: speakerId })
    });
    
    if (!res.ok) throw new Error(`Voicevox proxy failed: ${res.statusText}`);
    
    const data = await res.json();
    return data.url;
  } catch (error) {
    console.error("Voicevox Synthesis Error:", error);
    return null;
  }
}
