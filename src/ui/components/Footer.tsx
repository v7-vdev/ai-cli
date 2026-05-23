import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from '../theme/colors.js';
import { ChatStatus } from '../hooks/useChat.js';

interface FooterProps {
    status: ChatStatus;
    onSubmit: (input: string) => void;
}

export function Footer({ status, onSubmit }: FooterProps) {
    const [inputValue, setInputValue] = useState('');

    const handleSubmit = (value: string) => {
        if (!value.trim()) return;
        onSubmit(value);
        setInputValue('');
    };

    const getStatusDisplay = () => {
        switch (status) {
            case 'idle':
                return <Text color={colors.success}>Ready</Text>;
            case 'thinking':
                return <Text color={colors.warning}>Thinking...</Text>;
            case 'executing_tool':
                return <Text color={colors.info}>Executing Tool...</Text>;
            case 'error':
                return <Text color={colors.error}>Error</Text>;
            default:
                return <Text>{status}</Text>;
        }
    };

    return (
        <Box flexDirection="column" borderStyle="single" borderColor={colors.secondary} paddingX={1}>
            <Box flexDirection="row" justifyContent="space-between">
                <Text color={colors.secondary}>
                    Status: {getStatusDisplay()}
                </Text>
                <Text color={colors.secondary}>
                    Commands: /plan /edit /generate /exit
                </Text>
            </Box>
            <Box flexDirection="row" marginTop={1}>
                <Text color={colors.info} bold>You: </Text>
                {status === 'idle' ? (
                    <TextInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                        placeholder="Ask something or type a command..."
                    />
                ) : (
                    <Text color={colors.secondary}>{inputValue || '...'}</Text>
                )}
            </Box>
        </Box>
    );
}
