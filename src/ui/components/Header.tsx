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
    mcpConnections?: number;
    status: string;
}

export function Header({ model, session, workspace, git, isSafeMode, activeExecutionId, mcpConnections = 0, status }: HeaderProps) {
    const workspaceName = workspace?.projectName || 'Scanning...';
    
    // Determine the orchestration state verb
    let orchestrationState = 'Awaiting orchestration input';
    if (status === 'thinking') orchestrationState = 'Provider active, generating...';
    if (status === 'executing_tool') orchestrationState = 'Executing orchestration workflow...';

    return (
        <Box flexDirection="column" paddingX={1} paddingTop={0} paddingBottom={0} marginBottom={1}>
            <Text dimColor>
                <Text bold>{APP_NAME}</Text>
                <Text> | {workspaceName}</Text>
                <Text> | {model}</Text>
                
                {git?.isRepo && (
                    <Text> | {git.branch}</Text>
                )}
                
                {isSafeMode && (
                    <Text color="red" bold> | SAFE MODE</Text>
                )}
                
                {activeExecutionId && (
                    <Text color="yellow"> | Exec: {activeExecutionId}</Text>
                )}
            </Text>
            
            {/* Subtle Operational Presence */}
            <Box flexDirection="row" marginTop={0}>
                <Text dimColor color="gray">
                    Workspace ready  |  {mcpConnections} MCP server{mcpConnections !== 1 ? 's' : ''} connected  |  Provider healthy  |  {orchestrationState}
                </Text>
            </Box>
        </Box>
    );
}
