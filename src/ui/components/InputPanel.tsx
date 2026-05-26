import React, { useState } from 'react';
import { Box, Text } from 'ink';
import TextInput from 'ink-text-input';
import { colors } from '../theme/colors.js';

interface InputPanelProps {
    message: string;
    placeholder?: string;
    onSubmit: (value: string | null) => void;
}

export function InputPanel({ message, placeholder, onSubmit }: InputPanelProps) {
    const [value, setValue] = useState('');

    const handleSubmit = () => {
        onSubmit(value);
    };

    return (
        <Box flexDirection="column" borderStyle="single" borderColor={colors.toolBorder} paddingX={1} marginY={0}>
            <Text bold color={colors.secondary}>? {message}</Text>
            <Box paddingLeft={2} marginTop={0} flexDirection="row">
                <Text color="cyan" bold>❯ </Text>
                {/* @ts-ignore */}
                <TextInput
                    value={value}
                    onChange={setValue}
                    onSubmit={handleSubmit}
                    placeholder={placeholder}
                />
            </Box>
        </Box>
    );
}
