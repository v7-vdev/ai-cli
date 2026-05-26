import { RuntimeContext } from "../context/runtimeContext.js";
import chalk from "chalk";
import { KeyManager } from "../security/keys.js";
import * as p from "@clack/prompts";

export const providerCommand = {
    name: "/provider",
    description: "Manage AI providers and BYOK credentials",
    execute: async (args: string[], ctx: RuntimeContext) => {
        if (args.length === 0) {
            console.log(chalk.yellow("Usage: /provider <add|remove|list|current|switch|health|repair> [providerId]"));
            return;
        }

        const action = args[0];
        const providerId = args[1]?.toLowerCase();

        switch (action) {
            case "add": {
                let targetId = providerId;
                if (!targetId) {
                    const supported = ctx.registry.getSupportedProviders();
                    const selected = await p.select({
                        message: "Select a provider to add:",
                        options: supported.map(id => ({ value: id, label: id }))
                    });
                    if (p.isCancel(selected)) return;
                    targetId = selected as string;
                }
                const key = await p.password({
                    message: `Enter API Key for ${targetId}:`,
                });
                if (!p.isCancel(key) && key) {
                    KeyManager.setKey(targetId, key as string);
                    console.log(chalk.green(`✓ Safely encrypted and stored key for ${targetId}`));
                } else {
                    console.log(chalk.yellow("Aborted."));
                }
                break;
            }
            case "remove": {
                let targetId = providerId;
                if (!targetId) {
                    const configured = KeyManager.listConfiguredProviders();
                    if (configured.length === 0) {
                        console.log(chalk.yellow("No BYOK providers configured."));
                        return;
                    }
                    const selected = await p.select({
                        message: "Select a provider to remove:",
                        options: configured.map(id => ({ value: id, label: id }))
                    });
                    if (p.isCancel(selected)) return;
                    targetId = selected as string;
                }
                KeyManager.removeKey(targetId);
                console.log(chalk.green(`✓ Removed key for ${targetId}`));
                break;
            }
            case "list": {
                const supported = ctx.registry.getSupportedProviders();
                const configured = KeyManager.listConfiguredProviders();
                const active = ctx.registry.getActiveProviderId();
                
                console.log(chalk.cyan("\nProviders:"));
                for (const provider of supported) {
                    let status = "Not Configured";
                    if (configured.includes(provider)) status = chalk.green("Configured (BYOK)");
                    if (process.env[`${provider.toUpperCase()}_API_KEY`]) status = chalk.blue("Configured (ENV)");
                    
                    const prefix = provider === active ? chalk.green("→ ") : "  ";
                    console.log(`${prefix}${provider.padEnd(15)} [${status}]`);
                }
                console.log("");
                break;
            }
            case "switch": {
                let targetId = providerId;
                if (!targetId) {
                    if (!ctx.requestMenuSelection) return;
                    const supported = ctx.registry.getSupportedProviders();
                    const active = ctx.registry.getActiveProviderId();
                    const selected = await ctx.requestMenuSelection("Select a provider to switch to:", supported.map(id => ({ 
                        value: id, 
                        label: id === active ? `${id} (active)` : id 
                    })));
                    if (!selected) return;
                    targetId = selected as string;
                }
                try {
                    // Check if local inference URL is provided
                    if (args[2]) {
                        ctx.registry.setLocalEndpoint(targetId, args[2]);
                        console.log(chalk.gray(`Set local endpoint for ${targetId} to ${args[2]}`));
                    }
                    ctx.registry.switchProvider(targetId);
                    // Clear history to avoid cross-contamination of system prompt behaviors
                    ctx.clearHistory(); 
                    
                    const activeP = ctx.registry.getActiveProvider();
                    const m = activeP.getMetadata();
                    const snapshot = `**Switched to ${m.name}**\n- Streaming: ${m.capabilities.supportsStreaming ? 'enabled' : 'disabled'}\n- Tools: ${m.capabilities.supportsTools ? 'enabled' : 'disabled'}\n- Reasoning: ${m.capabilities.supportsReasoning ? 'enabled' : 'disabled'}\n- Context Window: ${Math.floor(m.capabilities.contextWindow / 1024)}k`;
                    
                    ctx.addMessage({ role: 'system', content: snapshot });
                    console.log(chalk.gray("History cleared for clean provider session. Capability snapshot appended to context."));
                } catch (e: any) {
                    console.log(chalk.red(`Switch failed: ${e.message}`));
                }
                break;
            }
            case "current": {
                const p = ctx.registry.getActiveProvider();
                const m = p.getMetadata();
                console.log(chalk.cyan("\nActive Provider:"));
                console.log(`Name: ${m.name} (${m.id})`);
                console.log(`Streaming: ${m.capabilities.supportsStreaming}`);
                console.log(`Reasoning: ${m.capabilities.supportsReasoning}`);
                console.log(`Tools: ${m.capabilities.supportsTools}`);
                console.log(`Context Window: ${m.capabilities.contextWindow}`);
                console.log("");
                break;
            }
            case "health": {
                if (!providerId) {
                    console.log(chalk.red("Provider ID required."));
                    return;
                }
                try {
                    const s = p.spinner();
                    s.start(`Checking health for ${providerId}...`);
                    await ctx.registry.checkHealth(providerId, true);
                    s.stop(chalk.green(`✓ ${providerId} is healthy and responding.`));
                } catch (error: any) {
                    console.log(chalk.red(`\n✗ ${providerId} health check failed:`));
                    console.log(chalk.gray(error.message));
                }
                break;
            }
            case "repair": {
                console.log(chalk.yellow("WARNING: This will permanently delete your master key and all stored provider keys."));
                const confirm = await p.confirm({ message: "Are you sure you want to proceed?" });
                if (confirm === true) {
                    KeyManager.repairKeys();
                    console.log(chalk.green("✓ Master key regenerated. All credentials purged."));
                } else {
                    console.log(chalk.gray("Repair aborted."));
                }
                break;
            }
            default: {
                console.log(chalk.red(`Unknown action: ${action}`));
            }
        }
    }
};
