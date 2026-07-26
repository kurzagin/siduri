"use client";

// Types for Speech Recognition Web API
export interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

export class SiduriVoiceEngine {
  private synth: SpeechSynthesis | null = null;
  private recognition: unknown = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.synth = window.speechSynthesis || null;
      const SpeechRecognitionClass =
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).SpeechRecognition ||
        (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const recognitionInstance = new (SpeechRecognitionClass as any)();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = "en-US";
        this.recognition = recognitionInstance;
      }
    }
  }

  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      rate?: number;
      pitch?: number;
    }
  ) {
    if (!this.synth) return;

    this.synth.cancel(); // Stop any ongoing speech
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options?.rate || 1.0;
    utterance.pitch = options?.pitch || 1.05;

    // Pick warm female / default voice if available
    const voices = this.synth.getVoices();
    const preferredVoice = voices.find(
      (v) =>
        v.name.includes("Natural") ||
        v.name.includes("Female") ||
        v.name.includes("Google") ||
        v.name.includes("Samantha") ||
        v.name.includes("Zira")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => options?.onStart?.();
    utterance.onend = () => options?.onEnd?.();
    utterance.onerror = () => options?.onEnd?.();

    this.synth.speak(utterance);
  }

  public listen(onResult: (transcript: string) => void, onError?: () => void) {
    if (!this.recognition) {
      console.warn("Web Speech Recognition is not supported in this browser.");
      onError?.();
      return;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rec = this.recognition as any;
      rec.onresult = (event: SpeechRecognitionEvent) => {
        const transcript = event.results[0][0].transcript;
        onResult(transcript);
        this.isListening = false;
      };
      rec.onerror = () => {
        this.isListening = false;
        onError?.();
      };
      rec.onend = () => {
        this.isListening = false;
      };
      rec.start();
      this.isListening = true;
    } catch (err) {
      console.error("Speech recognition start failed:", err);
      this.isListening = false;
      onError?.();
    }
  }

  public stopListening() {
    if (this.recognition && this.isListening) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.recognition as any).stop();
      this.isListening = false;
    }
  }

  public stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
  }
}

export const voiceEngine = new SiduriVoiceEngine();
