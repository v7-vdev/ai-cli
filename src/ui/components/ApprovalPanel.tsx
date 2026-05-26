import React, { useState, useEffect } from 'react';
import { Box, Text, useInput } from 'ink';
import { colors } from '../theme/colors.js';
import { ApprovalRequest } from '../../execution/pipeline.js';
import { DiffViewer } from './DiffViewer.js';

interface ApprovalPanelProps {
    request: ApprovalRequest;
}

export function ApprovalPanel({ request }: ApprovalPanelProps) {
    const [resolved, setResolved] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [isActive, setIsActive] = useState(false);
    const [viewedFullDiff, setViewedFullDiff] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => setIsActive(true), 1000);
        return () => clearTimeout(timer);
    }, []);

    useInput((input, key) => {
        if (resolved || !isActive) return;

        if (key.return) {
            const val = inputValue.toLowerCase().trim();
            if (val === 'y' || val === 'approve') {
                if (request.type === 'file' && request.diff?.isLarge && !viewedFullDiff) {
                    setInputValue(''); // blocked
                    return;
                }
                setResolved(true);
                request.resolve(true);
            } else if (val === 'n' || val === 'deny') {
                setResolved(true);
                request.resolve(false);
            } else if (val === 'v' && request.diff?.isLarge) {
                setViewedFullDiff(true);
                setInputValue('');
            } else {
                setInputValue('');
            }
        } else if (key.backspace || key.delete) {
            setInputValue(prev => prev.slice(0, -1));
        } else if (key.escape || (key.ctrl && input === 'c')) {
            setResolved(true);
            request.resolve(false);
        } else {
            setInputValue(prev => prev + input);
        }
    });

    if (resolved) {
        return null;
    }

    const riskColor = request.risk.level === 'HIGH' ? colors.error : 
                      request.risk.level === 'MEDIUM' ? colors.warning : 
                      colors.success;

    const isLocked = request.type === 'file' && request.diff?.isLarge && !viewedFullDiff;

    return (
        <Box flexDirection="column" borderStyle="round" borderColor={riskColor} padding={1} marginTop={1}>
            <Box flexDirection="row" justifyContent="space-between">
                <Text bold color={riskColor}>⚠️ ACTION REQUIRED: {request.type.toUpperCase()} EXECUTION</Text>
                <Text color={colors.secondary}>Exec ID: {request.executionId}</Text>
            </Box>
            
            <Text color={colors.secondary}>
                Risk Level: <Text color={riskColor} bold>{request.risk.level}</Text> - {request.risk.reason}
            </Text>
            
            <Box marginY={1} flexDirection="column">
                {request.type === 'file' && request.diff && (
                    <Box flexDirection="column">
                        <DiffViewer diff={request.diff} filePath={request.target} />
                        {request.diff.isLarge && !viewedFullDiff && (
                            <Box marginY={1} padding={1} borderStyle="single" borderColor={colors.error}>
                                <Text color={colors.error} bold>Large diff detected. Approval locked until full review completed.</Text>
                                <Text color={colors.error}>Hidden Lines: {(request.diff.diffLines?.length || 0) > 100 ? (request.diff.diffLines!.length - 100) : 'Truncated'}</Text>
                                <Text color={colors.primary}>Type 'v' and press Enter to acknowledge and unlock.</Text>
                            </Box>
                        )}
                        {request.diff.isLarge && viewedFullDiff && (
                            <Text color={colors.success}>Diff acknowledged. Approval unlocked.</Text>
                        )}
                    </Box>
                )}
                {request.type === 'command' && (
                    <Box padding={1} borderStyle="single" borderColor={colors.toolBorder}>
                        <Text color={colors.warning}>$ {request.command}</Text>
                    </Box>
                )}
                {request.type === 'mcp' && (
                    <Box padding={1} borderStyle="single" borderColor={colors.toolBorder}>
                        <Text color={colors.warning}>MCP Call: {request.target}</Text>
                        <Text color={colors.mutedText}>{request.content}</Text>
                    </Box>
                )}
            </Box>

            <Box flexDirection="row" gap={1}>
                {isLocked ? (
                    <Text bold color={colors.error}>[APPROVAL LOCKED]</Text>
                ) : (
                    <Text bold color={colors.primary}>Type 'y' or 'n' and press Enter to confirm:</Text>
                )}
                <Text>{inputValue}█</Text>
            </Box>
        </Box>
    );
}
