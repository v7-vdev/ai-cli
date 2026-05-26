import React from 'react';
import { Box, Text } from 'ink';
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
    const workspaceName = workspace?.projectName || 'Scanning...';

    return (
        <Box flexDirection="row" paddingX={1} paddingTop={0} paddingBottom={0} marginBottom={1}>
            <Text dimColor>
                <Text bold>{APP_NAME}</Text>
                <Text> | W: {workspaceName}</Text>
                <Text> | M: {model}</Text>
                
                {git?.isRepo && (
                    <Text> | B: {git.branch}</Text>
                )}
                
                {isSafeMode && (
                    <Text color="red" bold> | SAFE MODE</Text>
                )}
                
                {activeExecutionId && (
                    <Text color="yellow"> | Exec: {activeExecutionId}</Text>
                )}

                <Text> | Session: {session}</Text>
            </Text>
        </Box>
    );
}
