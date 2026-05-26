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
        const timer = setTimeout(() => setIsActive(true), 500);
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

    const isHighRisk = request.risk.level === 'HIGH';
    const riskColor = isHighRisk ? colors.error : 
                      request.risk.level === 'MEDIUM' ? colors.warning : 
                      colors.success;

    const isLocked = request.type === 'file' && request.diff?.isLarge && !viewedFullDiff;
    const boxProps = isHighRisk ? { backgroundColor: '#3a0000' } : {};

    return (
        <Box flexDirection="column" borderStyle="bold" borderColor={riskColor} paddingX={2} paddingY={1} marginTop={1} {...boxProps}>
            <Box flexDirection="row" justifyContent="space-between" marginBottom={1}>
                {isHighRisk ? (
                    <Text bold color="white" backgroundColor="red"> ⚠️ HIGH RISK BLOCKED </Text>
                ) : (
                    <Text bold color={riskColor}> ⚠️ ACTION REQUIRED </Text>
                )}
                <Text color={colors.secondary} dimColor>ID: {request.executionId}</Text>
            </Box>
            
            <Box flexDirection="row" marginBottom={1}>
                <Text color={colors.secondary}>Execution Type: </Text>
                <Text bold color="white">{request.type.toUpperCase()}</Text>
                <Text color={colors.secondary}> | Risk: </Text>
                <Text bold color={riskColor}>{request.risk.level}</Text>
                <Text color={colors.secondary}> ({request.risk.reason})</Text>
            </Box>
            
            <Box marginY={1} flexDirection="column">
                {request.type === 'file' && request.diff && (
                    <Box flexDirection="column">
                        <DiffViewer diff={request.diff} filePath={request.target} />
                        {request.diff.isLarge && !viewedFullDiff && (
                            <Box marginY={1} padding={1} borderStyle="single" borderColor={colors.error}>
                                <Text color={colors.error} bold>Large diff detected. Approval locked until full review completed.</Text>
                                <Text color={colors.error}>Hidden Lines: {(request.diff.diffLines?.length || 0) > 100 ? (request.diff.diffLines!.length - 100) : 'Truncated'}</Text>
                            </Box>
                        )}
                        {request.diff.isLarge && viewedFullDiff && (
                            <Box marginTop={1}>
                                <Text color={colors.success}>✓ Diff acknowledged. Approval unlocked.</Text>
                            </Box>
                        )}
                    </Box>
                )}
                {request.type === 'command' && (
                    <Box padding={1} borderStyle="single" borderColor={colors.toolBorder} backgroundColor="#1a1a1a">
                        <Text color={colors.warning} bold>$ {request.command}</Text>
                    </Box>
                )}
                {request.type === 'mcp' && (
                    <Box padding={1} borderStyle="single" borderColor={colors.toolBorder}>
                        <Text color={colors.warning} bold>MCP Target: {request.target}</Text>
                        <Text color={colors.mutedText}>{request.content}</Text>
                    </Box>
                )}
            </Box>

            <Box flexDirection="column" marginTop={1}>
                <Box flexDirection="row" gap={2} marginBottom={1}>
                    {isLocked ? (
                        <Text color={colors.primary} bold>[v] View Full Diff</Text>
                    ) : (
                        <>
                            <Text color={colors.success} bold>[y] Approve</Text>
                            <Text color={colors.error} bold>[n] Deny</Text>
                            {request.diff?.isLarge && <Text color={colors.primary}>[v] View Diff</Text>}
                        </>
                    )}
                </Box>
                
                <Box flexDirection="row">
                    {isLocked ? (
                        <Text bold color={colors.error}>[APPROVAL LOCKED] Action: </Text>
                    ) : (
                        <Text bold color={colors.primary}>Action: </Text>
                    )}
                    <Text>{inputValue}█</Text>
                </Box>
            </Box>
        </Box>
    );
}
