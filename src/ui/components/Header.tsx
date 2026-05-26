import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { APP_NAME } from '../branding/constants.js';
import { WorkspaceMetadata } from '../../workspace/index.js';
import { GitMetadata } from '../../git/index.js';

interface HeaderProps {
    model: string;
    session: string;
    workspace?: WorkspaceMetadata | undefined;
    git?: GitMetadata | undefined;
    isSafeMode?: boolean;
    activeExecutionId?: string | null | undefined;
}

export function Header({ model, session, workspace, git, isSafeMode, activeExecutionId }: HeaderProps) {
    const fwNames = workspace?.frameworks.map(f => f.name).join(' + ') || 'None';
    const workspaceName = workspace?.projectName || 'Scanning...';

    return (
        <Box flexDirection="column" borderBottom={true} borderStyle="single" borderColor={colors.secondary} paddingX={1} paddingBottom={0}>
            <Box flexDirection="row" justifyContent="space-between">
                <Box flexDirection="row">
                    <Text color={colors.primary} bold>{APP_NAME}  </Text>
                    <Text color={colors.mutedText}>
                        W: <Text color={colors.text}>{workspaceName}</Text> | M: <Text color={colors.text}>{model}</Text>
                        {git?.isRepo && (
                            <Text> | B: <Text color={colors.text}>{git.branch}</Text></Text>
                        )}
                        {isSafeMode && (
                            <Text> | <Text color={colors.info} bold>SAFE MODE</Text></Text>
                        )}
                        {activeExecutionId && (
                            <Text> | Exec: <Text color={colors.warning}>{activeExecutionId}</Text></Text>
                        )}
                    </Text>
                </Box>
                <Text color={colors.secondary}>Session: {session}</Text>
            </Box>
        </Box>
    );
}
