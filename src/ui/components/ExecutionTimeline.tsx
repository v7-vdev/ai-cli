import React from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

export type ExecutionState = 'idle' | 'thinking' | 'awaiting_approval' | 'executing_tool' | 'error';

export function ExecutionTimeline({ state }: { state: ExecutionState }) {
    if (state === 'idle') return null;

    const timeline = [
        { id: 'thinking', label: 'Planning', active: state === 'thinking' },
        { id: 'approval', label: 'Awaiting Approval', active: state === 'awaiting_approval' },
        { id: 'execute', label: 'Executing', active: state === 'executing_tool' }
    ];

    return (
        <Box flexDirection="row" paddingX={1} marginTop={1} gap={1} borderStyle="single" borderColor={colors.toolBorder}>
            {timeline.map((step, idx) => (
                <Text key={step.id} color={step.active ? colors.primary : colors.mutedText} bold={step.active}>
                    {step.active ? '▶ ' : '• '}
                    {step.label}
                    {idx < timeline.length - 1 && <Text color={colors.mutedText}>  →</Text>}
                </Text>
            ))}
        </Box>
    );
}
