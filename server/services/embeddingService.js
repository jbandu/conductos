import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text) {
  const input = text ? text.slice(0, 8000) : '';
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input
  });
  return response.data[0].embedding;
}

export async function batchGenerateEmbeddings(texts) {
  const cleaned = texts.map((snippet) => (snippet ? snippet.slice(0, 8000) : ''));
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: cleaned
  });
  return response.data.map((row) => row.embedding);
}
