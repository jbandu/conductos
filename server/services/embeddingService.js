import OpenAI from 'openai';

// Initialize OpenAI client only if API key is present
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

export async function generateEmbedding(text) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not configured. Embedding features require an OpenAI API key.');
  }
  const input = text ? text.slice(0, 8000) : '';
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input
  });
  return response.data[0].embedding;
}

export async function batchGenerateEmbeddings(texts) {
  if (!openai) {
    throw new Error('OPENAI_API_KEY not configured. Embedding features require an OpenAI API key.');
  }
  const cleaned = texts.map((snippet) => (snippet ? snippet.slice(0, 8000) : ''));
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: cleaned
  });
  return response.data.map((row) => row.embedding);
}
