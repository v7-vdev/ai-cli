import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { APP_NAME } from '../branding/constants.js';
import { WorkspaceMetadata } from '../../workspace/index.js';

interface HeaderProps {
    model: string;
    session: string;
    workspace?: WorkspaceMetadata | undefined;
}

export function Header({ model, session, workspace }: HeaderProps) {
    const fwNames = workspace?.frameworks.map(f => f.name).join(' + ') || 'None';
    const workspaceName = workspace?.projectName || 'Scanning...';

    return (
        <Box flexDirection="column" borderBottom={true} borderStyle="single" borderColor={colors.secondary} paddingX={1} paddingBottom={0}>
            <Box flexDirection="row" justifyContent="space-between">
                <Box flexDirection="row">
                    <Text color={colors.primary} bold>{APP_NAME}  </Text>
                    <Text color={colors.mutedText}>
                        Workspace: <Text color={colors.text}>{workspaceName}</Text> | Framework: <Text color={colors.text}>{fwNames}</Text> | Provider: <Text color={colors.text}>{model}</Text>
                    </Text>
                </Box>
                <Text color={colors.secondary}>Session: {session}</Text>
            </Box>
        </Box>
    );
}
