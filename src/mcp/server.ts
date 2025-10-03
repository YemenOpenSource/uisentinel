#!/usr/bin/env node

/**
 * UIsentinel MCP Server
 *
 * Model Context Protocol server that exposes UIsentinel browser extensions
 * as tools for AI coding agents (Claude, Copilot, Cursor, etc.)
 *
 * Usage:
 *   uisentinel-mcp
 *
 * Configure in Claude Desktop:
 *   ~/.config/Claude/claude_desktop_config.json
 *   {
 *     "mcpServers": {
 *       "uisentinel": {
 *         "command": "uisentinel-mcp"
 *       }
 *     }
 *   }
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { MCP_TOOLS } from './tools.js';
import {
  handleInspectElement,
  handleInspectMultiple,
  handleInspectWithAction,
  handleCheckAccessibility,
  handleCheckContrast,
  handleMeasureElement,
  handleShowGrid,
  handleDetectComponents,
  handleCheckBreakpoints,
  handleAnalyzeLayout,
  handleDetectProject,
} from './handlers.js';

/**
 * Create and configure the MCP server
 */
async function createServer() {
  const server = new Server(
    {
      name: 'uisentinel',
      version: '0.2.1',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  /**
   * Handler for listing available tools
   */
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: Object.values(MCP_TOOLS),
    };
  });

  /**
   * Handler for tool execution
   */
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      let result;

      switch (name) {
        // Element Inspection Tools
        case 'uisentinel_inspect_element':
          result = await handleInspectElement(args as any);
          break;

        case 'uisentinel_inspect_multiple':
          result = await handleInspectMultiple(args as any);
          break;

        case 'uisentinel_inspect_with_action':
          result = await handleInspectWithAction(args as any);
          break;

        // Accessibility Tools
        case 'uisentinel_check_accessibility':
          result = await handleCheckAccessibility(args as any);
          break;

        case 'uisentinel_check_contrast':
          result = await handleCheckContrast(args as any);
          break;

        // Layout & Measurement Tools
        case 'uisentinel_measure_element':
          result = await handleMeasureElement(args as any);
          break;

        case 'uisentinel_show_grid':
          result = await handleShowGrid(args as any);
          break;

        // Component Analysis Tools
        case 'uisentinel_detect_components':
          result = await handleDetectComponents(args as any);
          break;

        // Responsive Design Tools
        case 'uisentinel_check_breakpoints':
          result = await handleCheckBreakpoints(args as any);
          break;

        // Layout Analysis Tools
        case 'uisentinel_analyze_layout':
          result = await handleAnalyzeLayout(args as any);
          break;

        // Project Detection Tools
        case 'uisentinel_detect_project':
          result = await handleDetectProject(args as any);
          break;

        default:
          throw new Error(`Unknown tool: ${name}`);
      }

      // Format response for MCP
      if (!result.success) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${result.error}`,
            },
          ],
          isError: true,
        };
      }

      // Build response content
      const content: any[] = [
        {
          type: 'text',
          text: JSON.stringify(result.data, null, 2),
        },
      ];

      // Add file paths if available
      if (result.files) {
        const fileSummary = {
          screenshots: result.files.screenshots || [],
          json: result.files.json || [],
          reports: result.files.reports || [],
        };

        content.push({
          type: 'text',
          text: `\n\nGenerated files:\n${JSON.stringify(fileSummary, null, 2)}`,
        });
      }

      return {
        content,
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: `Error executing tool: ${error instanceof Error ? error.message : String(error)}`,
          },
        ],
        isError: true,
      };
    }
  });

  return server;
}

/**
 * Start the MCP server
 */
async function main() {
  const server = await createServer();
  const transport = new StdioServerTransport();

  await server.connect(transport);

  // Log to stderr (stdout is used for MCP communication)
  console.error('UIsentinel MCP server running');
  console.error('Available tools: 11');
  console.error('  - uisentinel_inspect_element');
  console.error('  - uisentinel_inspect_multiple');
  console.error('  - uisentinel_inspect_with_action');
  console.error('  - uisentinel_check_accessibility');
  console.error('  - uisentinel_check_contrast');
  console.error('  - uisentinel_measure_element');
  console.error('  - uisentinel_show_grid');
  console.error('  - uisentinel_detect_components');
  console.error('  - uisentinel_check_breakpoints');
  console.error('  - uisentinel_analyze_layout');
  console.error('  - uisentinel_detect_project');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
