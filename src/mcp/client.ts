import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";
import path from "path";

export interface McpServerConfig {
    command: string;
    args: string[];
    env?: Record<string, string>;
}

export interface McpConfig {
    servers: Record<string, McpServerConfig>;
}

export class McpManager {
    private clients: Map<string, Client> = new Map();
    private configPath: string;

    constructor() {
        this.configPath = path.join(process.cwd(), "mcp.json");
    }

    private loadConfig(): McpConfig {
        if (!fs.existsSync(this.configPath)) {
            return { servers: {} };
        }
        try {
            return JSON.parse(fs.readFileSync(this.configPath, "utf8"));
        } catch (e) {
            console.error("Failed to parse mcp.json", e);
            return { servers: {} };
        }
    }

    private saveConfig(config: McpConfig) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    }

    async connectAll() {
        const config = this.loadConfig();
        for (const [name, serverConfig] of Object.entries(config.servers)) {
            await this.connectServer(name, serverConfig);
        }
    }

    private async connectServer(name: string, config: McpServerConfig) {
        try {
            const transport = new StdioClientTransport({
                command: config.command,
                args: config.args,
                env: { ...process.env, ...(config.env || {}) } as Record<string, string>,
            });

            const client = new Client(
                { name: "ai-cli", version: "1.0.0" },
                { capabilities: {} }
            );

            await client.connect(transport);
            this.clients.set(name, client);
        } catch (e: any) {
            console.error(`Failed to connect to MCP server '${name}':`, e.message);
        }
    }

    async addServer(name: string, command: string, args: string[]) {
        const config = this.loadConfig();
        config.servers[name] = { command, args };
        this.saveConfig(config);
        await this.connectServer(name, config.servers[name]);
    }

    getServers(): string[] {
        return Array.from(this.clients.keys());
    }

    async getMcpTools(): Promise<any[]> {
        const tools: any[] = [];
        for (const [serverName, client] of this.clients.entries()) {
            try {
                const response = await client.listTools();
                for (const tool of response.tools) {
                    // Prepend server name to avoid collisions
                    tools.push({
                        name: `mcp__${serverName}__${tool.name}`,
                        description: tool.description || `Tool ${tool.name} from ${serverName}`,
                        parameters: tool.inputSchema,
                    });
                }
            } catch (e) {
                // Ignore
            }
        }
        return tools;
    }

    async callMcpTool(serverName: string, toolName: string, args: any): Promise<any> {
        const client = this.clients.get(serverName);
        if (!client) {
            throw new Error(`MCP server '${serverName}' is not connected.`);
        }
        try {
            const response = await client.callTool({
                name: toolName,
                arguments: args,
            });
            // response.content is an array of content blocks (text, image, etc.)
            const contentArray = response.content as any[];
            const resultText = contentArray
                .map((c: any) => c.text || JSON.stringify(c))
                .join("\n");
            return resultText;
        } catch (e: any) {
            return `Error calling tool ${toolName}: ${e.message}`;
        }
    }
}
