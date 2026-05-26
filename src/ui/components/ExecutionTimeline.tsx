import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { colors } from '../theme/colors.js';

export type ExecutionState = 'idle' | 'thinking' | 'awaiting_approval' | 'executing_tool' | 'error';

export function ExecutionTimeline({ state }: { state: ExecutionState }) {
    if (state === 'idle') return null;

    // Map logical states to UI timeline steps
    const isPlanning = state === 'thinking';
    const isApproving = state === 'awaiting_approval';
    const isExecuting = state === 'executing_tool';

    const timeline = [
        { id: 'planning', label: 'Planning', active: isPlanning, completed: isApproving || isExecuting },
        { id: 'approval', label: 'Awaiting Approval', active: isApproving, completed: isExecuting },
        { id: 'execute', label: 'Executing', active: isExecuting, completed: false }
    ];

    return (
        <Box flexDirection="row" paddingX={1} gap={2}>
            {timeline.map((step, idx) => {
                let color = colors.mutedText;
                let icon = <Text dimColor>○</Text>;

                if (step.completed) {
                    color = colors.success;
                    icon = <Text color={colors.success}>✓</Text>;
                } else if (step.active) {
                    color = colors.primary;
                    icon = <Text color={colors.primary}><Spinner type="dots" /></Text>;
                }

                return (
                    <Box key={step.id} flexDirection="row" gap={1}>
                        {icon}
                        <Text color={color} dimColor={!step.active && !step.completed} bold={step.active}>
                            {step.label}
                        </Text>
                        {idx < timeline.length - 1 && (
                            <Text dimColor color={colors.mutedText}> ─</Text>
                        )}
                    </Box>
                );
            })}
        </Box>
    );
}
