import OpenAI from 'openai';

/**
 * Generic Brain that supports multiple AI providers.
 * It will try providers in order: OpenAI -> Local Ollama -> Gaianet
 */
export async function generateMemeIdea(trendingCasts, config) {
  const prompt = `
    Based on the following trending Farcaster casts, invent a new meme token for the Base network.
    The goal is to capture the "vibe" and be highly viral.
    
    Casts:
    ${trendingCasts.map(c => `- ${c.text}`).join('\n')}
    
    Output JSON:
    {
      "name": "Creative Meme Name",
      "symbol": "MEME",
      "manifesto": "A short, viral description for the social post.",
      "reasoning": "Why this matches the current sentiment."
    }
  `;

  // 1. Try OpenAI if key is present
  if (config.openaiKey) {
    try {
      console.log("🧠 Thinking with OpenAI GPT-4...");
      const openai = new OpenAI({ apiKey: config.openaiKey });
      const response = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      return JSON.parse(response.choices[0].message.content);
    } catch (e) {
      console.warn("⚠️ OpenAI failed, falling back...");
    }
  }

  // 2. Try Ollama (Local) or Gaianet (Decentralized) via standard OpenAI-compatible fetch
  const localEndpoint = config.ollamaUrl || "http://localhost:11434/v1";
  try {
    console.log(`🧠 Trying local/decentralized brain at ${localEndpoint}...`);
    const response = await fetch(`${localEndpoint}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.localModel || "llama3",
        messages: [{ role: "user", content: prompt + " (Return only valid JSON)" }],
        stream: false
      })
    });
    const data = await response.json();
    // Some local models might return markdown blocks, we attempt to clean it
    let content = data.choices[0].message.content;
    if (content.includes('```json')) {
      content = content.split('```json')[1].split('```')[0].trim();
    }
    return JSON.parse(content);
  } catch (e) {
    console.error("❌ All brains failed. Please provide an OpenAI key or run Ollama.");
    throw new Error("No brain available to think.");
  }
}
