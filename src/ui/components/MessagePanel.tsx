import React, { useMemo } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { MessageState } from '../hooks/useChat.js';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';

// Initialize marked-terminal renderer once
// @ts-ignore
marked.setOptions({ renderer: new TerminalRenderer() });

interface MessagePanelProps {
    msg: MessageState;
}

export function MessagePanel({ msg }: MessagePanelProps) {
    if (msg.role === 'system') {
        // Suppress massive internal onboarding system prompts
        if (msg.content?.includes("You are an expert AI Coding Assistant")) {
            return null;
        }
        
        return (
            <Box marginY={0} paddingLeft={1} borderLeft={true} borderStyle="single" borderColor={colors.secondary}>
                <Text color={colors.secondary} dimColor>
                    {msg.content}
                </Text>
            </Box>
        );
    }

    if (msg.role === 'user') {
        if (msg.functionResponse) {
            // Tool Execution Panel (Compact folded look)
            let resultText = typeof msg.functionResponse.response.result === 'string' 
                ? msg.functionResponse.response.result 
                : JSON.stringify(msg.functionResponse.response.result);
                
            if (resultText.length > 200) {
                resultText = resultText.substring(0, 200) + '... [truncated]';
            }

            return (
                <Box 
                    borderLeft={true}
                    borderStyle="single"
                    borderColor={colors.toolBorder} 
                    paddingLeft={1} 
                    marginBottom={0}
                    flexDirection="column"
                >
                    <Text color={colors.secondary} dimColor>
                        └─ ⚙️ Tool Result: {msg.functionResponse.name}
                    </Text>
                    <Text color={colors.mutedText} dimColor>
                        {resultText}
                    </Text>
                </Box>
            );
        }
        
        // Standard User Message
        return (
            <Box marginBottom={0} marginTop={1} flexDirection="row" paddingX={0}>
                <Text color={colors.info} dimColor>❯ </Text>
                <Text>{msg.content}</Text>
            </Box>
        );
        
    } else if (msg.role === 'model') {
        if (msg.functionCall) {
            // Model Planning/Calling Tool Panel
            return (
                <Box marginBottom={0} marginTop={0} paddingLeft={1} borderLeft={true} borderStyle="single" borderColor={colors.secondary}>
                    <Text color={colors.secondary} dimColor>
                        ┌─ 🤖 AI invokes: {msg.functionCall.name}
                    </Text>
                </Box>
            );
        }

        // AI Markdown Response Panel
        const parsedContent = useMemo(() => {
            if (!msg.content) return '';
            try {
                return marked.parse(msg.content);
            } catch (e) {
                return msg.content;
            }
        }, [msg.content]);

        return (
            <Box marginBottom={0} marginTop={0} flexDirection="column" paddingX={0} borderLeft={true} borderStyle="single" borderColor={colors.secondary} paddingLeft={1}>
                <Box>
                    <Text>{parsedContent as string}</Text>
                </Box>
            </Box>
        );
    }

    return null;
}
