import { useState, useCallback, useRef } from 'react';
import { RuntimeContext } from '../../context/runtimeContext.js';
import { ToolExecutor } from '../../tools/executor.js';

export type ChatStatus = 'idle' | 'thinking' | 'executing_tool' | 'error';

export interface MessageState {
    id: string;
    role: 'user' | 'model' | 'system';
    content?: string;
    functionCall?: any;
    functionResponse?: any;
}

export function useChat(ctx: RuntimeContext, toolExecutor: ToolExecutor) {
    const [messages, setMessages] = useState<MessageState[]>([]);
    const [status, setStatus] = useState<ChatStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const autonomousStepsRef = useRef(0);

    const addMessage = useCallback((msg: Omit<MessageState, 'id'>) => {
        const newMessage = { ...msg, id: Math.random().toString(36).substring(7) };
        setMessages((prev) => [...prev, newMessage]);
    }, []);

    const sendMessage = useCallback(async (input: string) => {
        if (!input.trim() || status !== 'idle') return;

        setError(null);
        autonomousStepsRef.current = 0;
        const MAX_AUTONOMOUS_STEPS = 5;

        // Try command first
        try {
            const wasCommand = await ctx.executeCommand(input.trim());
            if (wasCommand) {
                // Command execution doesn't go into chat loop, just resolve
                return;
            }
        } catch (err: any) {
            setError(`Command Error: ${err.message}`);
            return;
        }

        // Not a command, run chat loop
        addMessage({ role: 'user', content: input });
        ctx.addMessage({ role: 'user', content: input });

        const runLoop = async () => {
            while (true) {
                if (autonomousStepsRef.current >= MAX_AUTONOMOUS_STEPS) {
                    setStatus('idle');
                    setError(`Reached maximum autonomous steps (${MAX_AUTONOMOUS_STEPS}).`);
                    // In a real TUI we might want to prompt the user here, but for now we stop.
                    break;
                }

                setStatus('thinking');

                try {
                    const nativeTools = [
                        { name: "readFile", description: "Read the contents of a file.", parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] } },
                        { name: "writeFile", description: "Write content to a file.", parameters: { type: "object", properties: { path: { type: "string" }, content: { type: "string" } }, required: ["path", "content"] } },
                        { name: "runCommand", description: "Run a bash/terminal command.", parameters: { type: "object", properties: { command: { type: "string" } }, required: ["command"] } }
                    ];

                    const mcpTools = await ctx.mcp.getMcpTools();
                    const allTools = [...nativeTools, ...mcpTools];

                    const response = await ctx.provider.chat(ctx.history, allTools);

                    if (response.text && response.text !== "No response text.") {
                        addMessage({ role: 'model', content: response.text });
                        ctx.addMessage({ role: 'model', content: response.text });
                    }

                    if (response.functionCall) {
                        const fn = response.functionCall;
                        addMessage({ role: 'model', functionCall: fn });
                        ctx.addMessage({ role: "model", functionCall: fn });

                        setStatus('executing_tool');
                        autonomousStepsRef.current++;
                        
                        const toolResult = await toolExecutor.executeTool(fn);

                        addMessage({ role: 'user', functionResponse: { name: fn.name, response: { result: toolResult } } });
                        ctx.addMessage({
                            role: "user",
                            functionResponse: { name: fn.name, response: { result: toolResult } }
                        });
                        
                        // Continue loop
                    } else {
                        setStatus('idle');
                        break;
                    }
                } catch (err: any) {
                    setStatus('error');
                    setError(err.message || 'Unknown error occurred during chat.');
                    break;
                }
            }
        };

        runLoop();
    }, [ctx, toolExecutor, addMessage, status]);

    return {
        messages,
        status,
        error,
        sendMessage
    };
}
