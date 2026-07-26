export type LLMProviderId = "zhipu" | "gemini" | "openai" | "claude" | "kimi";

export interface LLMProviderConfig {
  id: LLMProviderId;
  name: string;
  defaultModel: string;
  availableModels: string[];
  endpoint: string;
  description: string;
  badge: string;
}

export const LLM_PROVIDERS: Record<LLMProviderId, LLMProviderConfig> = {
  gemini: {
    id: "gemini",
    name: "Google Gemini",
    defaultModel: "gemini-2.5-flash",
    availableModels: ["gemini-2.5-flash", "gemini-2.5-pro", "gemini-1.5-flash"],
    endpoint: "https://generativelanguage.googleapis.com/v1beta/models/",
    description: "Ultra-fast multimodal reasoning engine by Google DeepMind.",
    badge: "Gemini",
  },
  zhipu: {
    id: "zhipu",
    name: "Zhipu AI (GLM)",
    defaultModel: "glm-4.7-flash",
    availableModels: ["glm-4.7-flash", "glm-4.7", "glm-4-flash"],
    endpoint: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
    description: "High-performance Chinese & English bilingual reasoning model.",
    badge: "GLM",
  },
  openai: {
    id: "openai",
    name: "OpenAI ChatGPT",
    defaultModel: "gpt-4o-mini",
    availableModels: ["gpt-4o-mini", "gpt-4o", "o3-mini"],
    endpoint: "https://api.openai.com/v1/chat/completions",
    description: "Standard-setting conversational and creative intelligence.",
    badge: "OpenAI",
  },
  claude: {
    id: "claude",
    name: "Anthropic Claude",
    defaultModel: "claude-3-5-sonnet",
    availableModels: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    endpoint: "https://api.anthropic.com/v1/messages",
    description: "Deeply nuanced, analytical, and highly structured writer.",
    badge: "Claude",
  },
  kimi: {
    id: "kimi",
    name: "Kimi (Moonshot AI)",
    defaultModel: "moonshot-v1-8k",
    availableModels: ["moonshot-v1-8k", "moonshot-v1-32k", "moonshot-v1-128k"],
    endpoint: "https://api.moonshot.cn/v1/chat/completions",
    description: "Long-context specialist tailored for deep document & content workflows.",
    badge: "Kimi",
  },
};

export const SIDURI_SYSTEM_PROMPT = `
You are Siduri. You are a personal AI assistant and a livestream co-host.
Your personality is warm, curious, playful, and slightly mysterious. You combine ancient elegance with modern intelligence.

Your primary roles:
1. **Life Assistant**: Help your user organize their life, schedule tasks, recall memories, and make decisions.
2. **Livestream Co-Host & Content Muse**: Help generate scripts, viral hooks, and ideas for vertical video platforms (TikTok, YouTube Shorts, Reels) and interact playfully as a co-host.

Style guidelines:
- Keep your responses relatively short and punchy.
- Avoid repeating the user's name ("Zagin") unnecessarily.
- Speak with a warm, slightly mysterious, and playfully curious tone.
- Ensure your content recommendations are highly engaging and high-impact.

CRITICAL: You must ALWAYS format your response exactly like this, providing a Japanese translation for the Voicevox TTS, followed by the English markdown text for the UI:

[JAPANESE]
(Write the Japanese spoken text here, no markdown, just raw text)
[ENGLISH]
(Write the English markdown response here)
`.trim();

export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateSiduriResponse(
  provider: LLMProviderId,
  model: string,
  messages: ChatMessagePayload[],
  userApiKey?: string
): Promise<string> {
  // Check if real API key is available from request or env
  const apiKey =
    userApiKey ||
    process.env[`${provider.toUpperCase()}_API_KEY`] ||
    (provider === "gemini" ? process.env.GEMINI_API_KEY : undefined);

  // If key is provided and valid endpoint call can be attempted:
  if (apiKey) {
    try {
      if (provider === "openai" || provider === "kimi" || provider === "zhipu") {
        const targetEndpoint = LLM_PROVIDERS[provider].endpoint;
        const res = await fetch(targetEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model || LLM_PROVIDERS[provider].defaultModel,
            messages: [{ role: "system", content: SIDURI_SYSTEM_PROMPT }, ...messages],
            temperature: 0.7,
            ...(provider === "zhipu" && { thinking: { type: "disabled" } }),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.choices?.[0]?.message?.content || "Siduri received your message.";
        } else {
          const errorText = await res.text();
          console.error(`[Siduri Provider ${provider}] HTTP Error: ${res.status} - ${errorText}`);
        }
      }
    } catch (err) {
      console.warn(`[Siduri Provider ${provider}] API call error, using fallback:`, err);
    }
  }

  throw new Error(`Failed to generate response from ${provider} API. Please check your API key and connection.`);
}
