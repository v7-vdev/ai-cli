import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
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
                return (
                    <Text color={colors.warning}>
                        <Spinner type="dots" /> Thinking...
                    </Text>
                );
            case 'executing_tool':
                return (
                    <Text color={colors.info}>
                        <Spinner type="dots" /> Executing Tool...
                    </Text>
                );
            case 'error':
                return <Text color={colors.error}>Error</Text>;
            default:
                return <Text>{status}</Text>;
        }
    };

    const getCommandHints = () => {
        switch (status) {
            case 'idle':
                return 'Commands: /plan /edit /generate /exit';
            case 'thinking':
                return 'AI is generating a response...';
            case 'executing_tool':
                return 'Waiting for tool execution to complete...';
            case 'error':
                return 'An error occurred. Ready for next input.';
            default:
                return '';
        }
    };

    return (
        <Box flexDirection="column" borderTop={true} borderStyle="single" borderColor={status === 'idle' ? colors.toolBorder : colors.secondary} paddingX={1} paddingTop={0} paddingBottom={0}>
            <Box flexDirection="row" justifyContent="space-between" marginBottom={0}>
                <Box flexDirection="row">
                    <Text color={colors.secondary}>Status: </Text>
                    {getStatusDisplay()}
                </Box>
                <Text color={colors.secondary}>
                    {getCommandHints()}
                </Text>
            </Box>
            <Box flexDirection="row" marginTop={0}>
                {status === 'idle' ? (
                    <Text color={colors.primary} bold>❯ </Text>
                ) : (
                    <Text color={colors.secondary} dimColor>❯ </Text>
                )}
                {status === 'idle' ? (
                    <TextInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                        placeholder="Ask something or type a command..."
                    />
                ) : (
                    <Text color={colors.secondary} dimColor>{inputValue || '...'}</Text>
                )}
            </Box>
        </Box>
    );
}
