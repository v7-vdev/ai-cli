import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { APP_NAME } from '../branding/constants.js';

interface HeaderProps {
    model?: string;
    session?: string;
}

export function Header({ model = 'Unknown', session = 'Active' }: HeaderProps) {
    return (
        <Box borderStyle="round" borderColor={colors.primary} paddingX={1} flexDirection="row" justifyContent="space-between">
            <Text color={colors.primary} bold>
                {APP_NAME}
            </Text>
            <Text color={colors.secondary}>
                Model: <Text color={colors.text}>{model}</Text> | Session: <Text color={colors.text}>{session}</Text>
            </Text>
        </Box>
    );
}
