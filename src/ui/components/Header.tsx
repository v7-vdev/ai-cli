import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';
import { APP_NAME } from '../branding/constants.js';
import { WorkspaceMetadata } from '../../workspace/index.js';
import { GitMetadata } from '../../git/index.js';
import chalk from 'chalk';

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
        <Box flexDirection="row" justifyContent="space-between" paddingX={1} backgroundColor="white">
            <Box flexDirection="row">
                <Text color="black" bold>{APP_NAME} </Text>
                
                <Text color="black">
                    <Text dimColor> W:</Text> <Text bold>{workspaceName}</Text>
                    <Text dimColor> | M:</Text> <Text bold>{model}</Text>
                    
                    {git?.isRepo && (
                        <Text><Text dimColor> | B:</Text> <Text bold>{git.branch}</Text></Text>
                    )}
                    
                    {isSafeMode && (
                        <Text><Text dimColor> |</Text> <Text backgroundColor="red" color="white" bold> SAFE MODE </Text></Text>
                    )}
                    
                    {activeExecutionId && (
                        <Text><Text dimColor> | Exec:</Text> <Text backgroundColor="yellow" color="black" bold> {activeExecutionId} </Text></Text>
                    )}
                </Text>
            </Box>
            
            <Text color="black">
                <Text dimColor>Session:</Text> <Text bold>{session}</Text>
            </Text>
        </Box>
    );
}
