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
        <Box flexDirection="column" borderStyle="single" borderColor={colors.secondary} padding={1}>
            <Text color={colors.info} bold>File: {filePath}</Text>
            {diff.isLarge ? (
                <Text color={colors.warning}>{diff.summary}</Text>
            ) : (
                <Box flexDirection="column" marginTop={1}>
                    {(diff.diffLines || []).map((line, idx) => {
                        let color = colors.text;
                        if (line.startsWith('+')) color = colors.success;
                        else if (line.startsWith('-')) color = colors.error;
                        else color = colors.mutedText;

                        const maxLen = columns - 10;
                        const isOversized = line.length > maxLen;
                        const displayLine = isOversized 
                            ? line.substring(0, maxLen - 35) + " ... [LINE EXCEEDS TERMINAL WIDTH]" 
                            : line;

                        return <Text key={idx} color={color}>{displayLine}</Text>;
                    })}
                </Box>
            )}
        </Box>
    );
}
