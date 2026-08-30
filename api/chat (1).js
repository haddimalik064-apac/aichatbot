export const config = {
  runtime: "edge",
};

const SYSTEM_PROMPT = "You are a helpful, intelligent AI assistant.";

export default async function handler(req) {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  let body;
  try {
    body = await req.json();
  } catch (e) {
    return new Response("Invalid request body", { status: 400 });
  }

  const history = Array.isArray(body.messages) ? body.messages : [];
  const messages = [{ role: "system", content: SYSTEM_PROMPT }, ...history];

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return new Response("Server misconfigured: GROQ_API_KEY not set", { status: 500 });
  }

  let groqRes;
  try {
    groqRes = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.7,
        max_tokens: 1024,
        stream: false, 
      }),
    });
  } catch (e) {
    return new Response("Failed to reach Groq API", { status: 502 });
  }

  if (!groqRes.ok) {
    const errText = await groqRes.text();
    return new Response(errText || "Groq API error", { status: groqRes.status });
  }

  const data = await groqRes.json();
  const replyText = data.choices?.[0]?.message?.content || "No response text found.";

  return new Response(replyText, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
