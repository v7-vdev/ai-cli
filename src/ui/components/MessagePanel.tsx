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
        return (
            <Box marginY={1} paddingLeft={2} borderLeft={true} borderStyle="single" borderColor={colors.secondary}>
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
                
            if (resultText.length > 300) {
                resultText = resultText.substring(0, 300) + '... [truncated]';
            }

            return (
                <Box 
                    borderLeft={true}
                    borderStyle="single"
                    borderColor={colors.toolBorder} 
                    paddingLeft={1} 
                    marginBottom={1}
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
            <Box marginBottom={1} flexDirection="row" paddingX={0}>
                <Text color={colors.info} bold>You: </Text>
                <Text>{msg.content}</Text>
            </Box>
        );
        
    } else if (msg.role === 'model') {
        if (msg.functionCall) {
            // Model Planning/Calling Tool Panel
            return (
                <Box marginBottom={0} paddingLeft={1} borderLeft={true} borderStyle="single" borderColor={colors.primary}>
                    <Text color={colors.primary} dimColor>
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
            <Box marginBottom={1} flexDirection="column" paddingX={0} borderLeft={true} borderStyle="single" borderColor={colors.success} paddingLeft={1}>
                <Text color={colors.success} bold>AI</Text>
                <Box>
                    <Text>{parsedContent as string}</Text>
                </Box>
            </Box>
        );
    }

    return null;
}
