import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { searchLegalProvisions } from './tools/searchLegal.js';
import { getCaseLaw } from './tools/getCaselaw.js';
import { getPlaybookGuidance } from './tools/getPlaybook.js';
import { getTemplate } from './tools/getTemplate.js';
import { checkCompliance } from './tools/checkCompliance.js';
import { semanticSearch } from './tools/semanticSearch.js';

const server = new Server({ name: 'posh-knowledge-mcp', version: '1.0.0' }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'search_posh_act',
      description: 'Search the PoSH Act 2013 for relevant sections.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          section_number: { type: 'string' }
        },
        required: ['query']
      }
    },
    {
      name: 'search_posh_rules',
      description: 'Search the PoSH Rules 2013 for procedural requirements.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          rule_number: { type: 'string' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_case_law',
      description: 'Find relevant case law interpreting PoSH provisions.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          section: { type: 'string' },
          max_results: { type: 'number' }
        },
        required: ['query']
      }
    },
    {
      name: 'get_playbook_guidance',
      description: 'Get practical guidance from KelpHR playbooks.',
      inputSchema: {
        type: 'object',
        properties: {
          scenario: { type: 'string' },
          category: { type: 'string' },
          max_results: { type: 'number' }
        },
        required: ['scenario']
      }
    },
    {
      name: 'get_template',
      description: 'Retrieve document templates for IC proceedings.',
      inputSchema: {
        type: 'object',
        properties: {
          template_type: { type: 'string' },
          case_code: { type: 'string' }
        },
        required: ['template_type']
      }
    },
    {
      name: 'check_compliance',
      description: 'Check compliance status for a case or organization.',
      inputSchema: {
        type: 'object',
        properties: {
          check_type: { type: 'string' },
          case_code: { type: 'string' },
          organization_id: { type: 'string' }
        },
        required: ['check_type']
      }
    },
    {
      name: 'semantic_search',
      description: 'Semantic search across the knowledge base.',
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string' },
          sources: {
            type: 'array',
            items: { type: 'string' }
          },
          max_results: { type: 'number' }
        },
        required: ['query']
      }
    }
  ]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  try {
    switch (name) {
      case 'search_posh_act':
        return { content: [{ type: 'text', text: JSON.stringify(await searchLegalProvisions('act', args.query, args.section_number), null, 2) }] };
      case 'search_posh_rules':
        return { content: [{ type: 'text', text: JSON.stringify(await searchLegalProvisions('rules', args.query, args.rule_number), null, 2) }] };
      case 'get_case_law':
        return { content: [{ type: 'text', text: JSON.stringify(await getCaseLaw(args.query, args.section, args.max_results || 3), null, 2) }] };
      case 'get_playbook_guidance':
        return { content: [{ type: 'text', text: JSON.stringify(await getPlaybookGuidance(args.scenario, args.category, args.max_results || 3), null, 2) }] };
      case 'get_template':
        return { content: [{ type: 'text', text: JSON.stringify(await getTemplate(args.template_type, args.case_code), null, 2) }] };
      case 'check_compliance':
        return { content: [{ type: 'text', text: JSON.stringify(await checkCompliance(args.check_type, args.case_code, args.organization_id), null, 2) }] };
      case 'semantic_search':
        return { content: [{ type: 'text', text: JSON.stringify(await semanticSearch(args.query, args.sources, args.max_results || 5), null, 2) }] };
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return { content: [{ type: 'text', text: `Error: ${error.message}` }], isError: true };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('PoSH Knowledge MCP Server running on stdio');
}

main().catch((error) => console.error('Failed to start MCP server', error));
