# PoSH Knowledge MCP Server (scaffold)

This package exposes ConductOS' PoSH knowledge base to MCP-compatible clients. It ships as a scaffold so engineers can hook up live database connectivity and embeddings without blocking the rest of the stack.

## Getting Started

1. Install dependencies inside the package directory.
2. Provide `DATABASE_URL` and `OPENAI_API_KEY` environment variables.
3. Run `npm run dev` to start the stdio MCP server locally.

The server registers tools for Act and Rules search, case law retrieval, playbook guidance, templates, compliance checks, and semantic search.
