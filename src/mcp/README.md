# MCP Server Implementation

This directory contains the Model Context Protocol (MCP) server implementation for UIsentinel.

## Architecture

```
src/mcp/
├── types.ts       # TypeScript interfaces for tool parameters
├── tools.ts       # MCP tool definitions (schemas, descriptions)
├── handlers.ts    # Tool execution handlers
├── server.ts      # MCP server entry point
└── README.md      # This file
```

## Files

### `types.ts`
Defines TypeScript interfaces for all tool parameters:
- `InspectElementParams`
- `InspectMultipleParams`
- `InspectWithActionParams`
- `CheckAccessibilityParams`
- `CheckContrastParams`
- `MeasureElementParams`
- `DetectComponentsParams`
- `ShowGridParams`
- `ShowBreakpointsParams`

### `tools.ts`
Exports `MCP_TOOLS` object containing tool definitions with:
- Tool name
- Description (what it does, when to use it)
- Input schema (JSON Schema for parameters)

These definitions are used by MCP clients to discover available tools.

### `handlers.ts`
Implements handler functions for each tool:
- Creates UISentinel instance
- Starts browser
- Registers appropriate extension
- Executes extension methods
- Returns structured results

Each handler follows this pattern:
1. Create `UISentinel` instance
2. Start browser and create page
3. Register and inject extension
4. Execute extension method
5. Capture screenshots if needed
6. Clean up and return results

### `server.ts`
Main MCP server implementation using `@modelcontextprotocol/sdk`:
- Sets up stdio transport
- Registers tool list handler
- Registers tool execution handler
- Routes tool calls to appropriate handlers
- Formats responses for MCP protocol

## Adding a New Tool

To add a new MCP tool:

1. **Add parameter interface** in `types.ts`:
```typescript
export interface MyNewToolParams {
  url: string;
  selector: string;
  // ... other params
}
```

2. **Define tool schema** in `tools.ts`:
```typescript
export const MCP_TOOLS = {
  // ... existing tools
  uisentinel_my_new_tool: {
    name: 'uisentinel_my_new_tool',
    description: 'Description of what this tool does and when to use it',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'Page URL' },
        selector: { type: 'string', description: 'CSS selector' },
        // ... other properties
      },
      required: ['url', 'selector'],
    },
  },
};
```

3. **Implement handler** in `handlers.ts`:
```typescript
export async function handleMyNewTool(params: MyNewToolParams): Promise<MCPToolResponse> {
  const sentinel = new UISentinel({
    headless: true,
    output: { directory: DEFAULT_OUTPUT_DIR, format: 'json' },
  });

  try {
    await sentinel.start();
    const engine = sentinel.getBrowserEngine();
    const manager = engine.getExtensionManager();

    // Register extension
    const myExtension = new MyExtension();
    manager.register(myExtension);

    // Create page and inject
    const page = await engine.createPage(params.url, params.viewport || 'desktop');
    await page.waitForLoadState('networkidle');
    await manager.injectExtension(page, 'my-extension');

    // Execute extension method
    const result = await manager.executeExtension(page, 'my-extension', 'myMethod', {
      params: { /* ... */ },
    });

    await page.close();
    await sentinel.close();

    return {
      success: result.success,
      data: result.data,
      files: { /* ... */ },
    };
  } catch (error) {
    await sentinel.close();
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
```

4. **Wire up in server** in `server.ts`:
```typescript
switch (name) {
  // ... existing cases
  case 'uisentinel_my_new_tool':
    result = await handleMyNewTool(args as any);
    break;
}
```

5. **Update tool count** in `server.ts`:
```typescript
console.error('Available tools: 10');  // Increment count
console.error('  - uisentinel_my_new_tool');  // Add to list
```

6. **Rebuild**:
```bash
npm run build
```

## Testing

To test the MCP server:

```bash
# Start server directly (blocks, waiting for MCP messages)
node dist/mcp/server.js

# Or use the binary
uisentinel-mcp
```

The server communicates via stdio, so you'll need an MCP client (like Claude Desktop) to test properly.

## MCP Protocol Flow

1. **Tool Discovery**:
   - Client sends `tools/list` request
   - Server responds with array of tool definitions

2. **Tool Execution**:
   - Client sends `tools/call` request with tool name and arguments
   - Server validates parameters against schema
   - Server calls appropriate handler
   - Handler executes browser automation
   - Server formats result as MCP response
   - Client receives structured data + file paths

3. **Error Handling**:
   - Tool failures return `{ isError: true }` with error message
   - Network errors, browser crashes, etc. are caught and returned gracefully

## Dependencies

- `@modelcontextprotocol/sdk` - MCP protocol implementation
- `playwright` - Browser automation
- All UIsentinel browser extensions

## Configuration

The server uses:
- **Output directory**: `./mcp-output/` (relative to where server is started)
- **Headless mode**: `true` (no visible browser windows)
- **Default viewport**: `desktop` (1920x1080)

To customize, edit handlers in `handlers.ts` or accept environment variables.

## Logging

The server logs to stderr (stdout is reserved for MCP protocol):
```typescript
console.error('UIsentinel MCP server running');
```

Check logs in:
- **Claude Desktop**: `~/Library/Logs/Claude/mcp.log` (macOS)
- **Other clients**: Check client documentation

## Security Considerations

- Server only accepts local connections (stdio)
- No network exposure
- Runs with user's permissions
- Browser runs in sandbox
- No arbitrary code execution from MCP messages

## Performance

- Each tool call starts a fresh browser instance
- Browser closes after tool completes
- No persistent state between calls
- Parallel tool calls run independently

## Future Improvements

- [ ] Add caching for repeated URL inspections
- [ ] Support streaming responses for long operations
- [ ] Add progress callbacks
- [ ] Implement resource pooling for faster tool calls
- [ ] Add tool call history/replay
