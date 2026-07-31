import 'dotenv/config';

// Test 1: fetch direct to OpenRouter
const url = 'https://openrouter.ai/api/v1/chat/completions';
console.log('Testing fetch to', url);

try {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: 'hello' }],
      max_tokens: 10,
    }),
  });
  const data = await res.json();
  console.log('SUCCESS:', JSON.stringify(data.choices?.[0]?.message?.content ?? 'no content').slice(0, 100));
} catch (e) {
  console.error('FETCH ERROR:', e.code, e.message);
}
