import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text.slice(0, 8000)
  });
  return response.data[0].embedding;
}
