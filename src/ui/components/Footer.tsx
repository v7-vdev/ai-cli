import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';
import { ChatStatus } from '../hooks/useChat.js';

interface FooterProps {
    status: ChatStatus;
    providerName: string;
    isSafeMode: boolean;
    hasApproval: boolean;
    hasMenu: boolean;
    onSubmit: (input: string) => void;
}

export function Footer({ status, providerName, isSafeMode, hasApproval, hasMenu, onSubmit }: FooterProps) {
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
                        <Spinner type="dots" /> Executing...
                    </Text>
                );
            case 'error':
                return <Text color={colors.error}>Error</Text>;
            default:
                return <Text>{status}</Text>;
        }
    };

    const getCommandHints = () => {
        if (hasApproval) return 'Commands: [y] approve [n] deny [v] view diff';
        if (hasMenu) return 'Commands: ↑/↓ navigate, Enter select';
        
        switch (status) {
            case 'idle':
                return 'Commands: /commands /provider /model /plan /run --dry-run';
            case 'thinking':
            case 'executing_tool':
                return 'Commands: [cancel] [hide logs]';
            case 'error':
                return 'Ready for next input.';
            default:
                return '';
        }
    };

    const canType = status === 'idle' && !hasApproval && !hasMenu;

    return (
        <Box flexDirection="column" paddingX={1} paddingTop={1} paddingBottom={0}>
            <Box flexDirection="row" justifyContent="space-between" marginBottom={0}>
                <Box flexDirection="row">
                    <Text color={colors.secondary} dimColor>Status: </Text>
                    {getStatusDisplay()}
                    <Text color={colors.secondary} dimColor>  |  Provider: </Text>
                    <Text color={colors.secondary} bold>{providerName}</Text>
                    {isSafeMode && <Text color={colors.warning} dimColor>  |  Mode: SAFE</Text>}
                </Box>
                <Text color={colors.secondary} dimColor>
                    {getCommandHints()}
                </Text>
            </Box>
            <Box flexDirection="row" marginTop={0}>
                {canType ? (
                    <Text color="cyan" bold>❯ </Text>
                ) : (
                    <Text color={colors.secondary} dimColor>❯ </Text>
                )}
                {canType ? (
                    <TextInput
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSubmit}
                        placeholder="Type a command or ask a question..."
                    />
                ) : (
                    <Text color={colors.secondary} dimColor>{inputValue || '...'}</Text>
                )}
            </Box>
        </Box>
    );
}
