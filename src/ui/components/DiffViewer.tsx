import React from 'react';
import { Box, Text, useStdout } from 'ink';
import { DiffResult } from '../../execution/diff.js';
import { colors } from '../theme/colors.js';

interface DiffViewerProps {
    diff: DiffResult;
    filePath: string;
}

export function DiffViewer({ diff, filePath }: DiffViewerProps) {
    const { stdout } = useStdout();
    const columns = stdout.columns || 80;

    return (
        <Box flexDirection="column" borderStyle="single" borderColor={colors.secondary} paddingX={1} paddingY={0} backgroundColor="#1a1a1a">
            <Box borderBottom={true} borderStyle="single" borderColor={colors.secondary} paddingBottom={0} marginBottom={1}>
                <Text color="white" bold>📝 {filePath}</Text>
            </Box>
            
            {diff.isLarge ? (
                <Text color={colors.warning} dimColor>{diff.summary}</Text>
            ) : (
                <Box flexDirection="column">
                    {(diff.diffLines || []).map((line, idx) => {
                        const isAdded = line.startsWith('+');
                        const isRemoved = line.startsWith('-');
                        
                        let color = colors.mutedText;
                        let bgColor: string | undefined = undefined;
                        let textColor = colors.text;

                        if (isAdded) {
                            color = colors.success;
                            bgColor = '#003300';
                            textColor = '#88ff88';
                        } else if (isRemoved) {
                            color = colors.error;
                            bgColor = '#330000';
                            textColor = '#ff8888';
                        }

                        const maxLen = columns - 6;
                        const isOversized = line.length > maxLen;
                        const displayLine = isOversized 
                            ? line.substring(0, maxLen - 15) + " ... [OVERFLOW]" 
                            : line;

                        return (
                            <Box key={idx} backgroundColor={bgColor} width="100%">
                                <Text color={textColor}>{displayLine}</Text>
                            </Box>
                        );
                    })}
                </Box>
            )}
        </Box>
    );
}
