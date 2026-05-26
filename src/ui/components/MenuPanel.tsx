import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { colors } from '../theme/colors.js';

interface MenuPanelProps {
    message: string;
    options: { label: string; value: string }[];
    onSelect: (value: string | null) => void;
}

export function MenuPanel({ message, options, onSelect }: MenuPanelProps) {
    const handleSelect = (item: { label: string; value: string }) => {
        onSelect(item.value);
    };

    return (
        <Box flexDirection="column" borderStyle="single" borderColor={colors.toolBorder} paddingX={1} marginY={0}>
            <Text bold color={colors.secondary}>? {message}</Text>
            <Box paddingLeft={2} marginTop={1}>
                {/* @ts-ignore - ink-select-input types are sometimes weird with React 18/19 but it works */}
                <SelectInput items={options} onSelect={handleSelect} limit={6} />
            </Box>
            <Box marginTop={1}>
                <Text dimColor>Press Enter to select, or Ctrl+C to cancel.</Text>
            </Box>
        </Box>
    );
}
