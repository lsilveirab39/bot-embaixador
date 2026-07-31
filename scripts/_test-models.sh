echo "=== Testing main model ==="
wget -q -O- --timeout=15 --header="Content-Type: application/json" --header="Authorization: Bearer $(printenv OPENROUTER_API_KEY)" --post-data='{"model":"google/gemini-2.5-flash","messages":[{"role":"user","content":"oi"}],"max_tokens":10}' https://openrouter.ai/api/v1/chat/completions 2>&1 | head -c 200
echo ""
echo "=== Testing embedding model ==="
wget -q -O- --timeout=15 --header="Content-Type: application/json" --header="Authorization: Bearer $(printenv OPENROUTER_API_KEY)" --post-data='{"model":"openai/text-embedding-3-small","input":"test"}' https://openrouter.ai/api/v1/embeddings 2>&1 | head -c 200
echo ""
echo "=== Done ==="
