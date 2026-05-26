import React, { useEffect, useState } from 'react';
import { Box, Text, Static, useStdout } from 'ink';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useChat } from '../hooks/useChat.js';
import { RuntimeContext } from '../../context/runtimeContext.js';
import { ToolExecutor } from '../../tools/executor.js';
import { colors } from '../theme/colors.js';
import { MessagePanel } from '../components/MessagePanel.js';
import { ApprovalPanel } from '../components/ApprovalPanel.js';
import { ExecutionTimeline, ExecutionState } from '../components/ExecutionTimeline.js';
import { ApprovalRequest } from '../../execution/pipeline.js';
import { ErrorBoundary } from '../components/ErrorBoundary.js';
import { MenuPanel } from '../components/MenuPanel.js';
import { InputPanel } from '../components/InputPanel.js';

interface AppLayoutProps {
    ctx: RuntimeContext;
    toolExecutor: ToolExecutor;
}

export function AppLayout({ ctx, toolExecutor }: AppLayoutProps) {
    const { messages, status, error, sendMessage } = useChat(ctx, toolExecutor);
    const { stdout } = useStdout();
    const [dimensions, setDimensions] = useState({
        columns: stdout.columns,
        rows: stdout.rows
    });
    const [approvalRequest, setApprovalRequest] = useState<ApprovalRequest | null>(null);

    useEffect(() => {
        const handler = (req: ApprovalRequest) => {
            setApprovalRequest(req);
            const originalResolve = req.resolve;
            req.resolve = (approved) => {
                setApprovalRequest(null);
                originalResolve(approved);
            };
        };
        ctx.pipeline.setApprovalHandler(handler);
        return () => {
            ctx.pipeline.setApprovalHandler(() => {});
        };
    }, [ctx]);

    const [menuRequest, setMenuRequest] = useState<{ message: string, options: any[], resolve: (val: string | null) => void } | null>(null);
    const [inputRequest, setInputRequest] = useState<{ message: string, placeholder?: string, resolve: (val: string | null) => void } | null>(null);

    useEffect(() => {
        ctx.requestMenuSelection = (message, options) => {
            return new Promise((resolve) => {
                setMenuRequest({ message, options, resolve: (val) => {
                    setMenuRequest(null);
                    resolve(val);
                }});
            });
        };

        ctx.requestTextInput = (message, placeholder) => {
            return new Promise((resolve) => {
                const req: any = { message, resolve: (val: string | null) => {
                    setInputRequest(null);
                    resolve(val);
                }};
                if (placeholder !== undefined) {
                    req.placeholder = placeholder;
                }
                setInputRequest(req);
            });
        };

        return () => {
            delete (ctx as any).requestMenuSelection;
            delete (ctx as any).requestTextInput;
        };
    }, [ctx]);

    useEffect(() => {
        const onResize = () => {
            setDimensions({
                columns: stdout.columns,
                rows: stdout.rows
            });
        };
        stdout.on('resize', onResize);
        return () => {
            stdout.off('resize', onResize);
        };
    }, [stdout]);

    // Split messages into static (past) and active (current if streaming)
    // For simplicity in Phase 1, we can just render all completed messages in Static
    // and if there's an ongoing response, we could render it below. Since our chat is
    // currently request/response, we'll put all messages in Static as they arrive.
    
    // Static needs an array, but we only want to render new messages through Static.
    // Actually, Ink's <Static> component is designed such that you pass it an array,
    // and it will only render the items that were added since the last render.
    // It's perfectly safe to pass the entire `messages` array to it!

    let timelineState: ExecutionState = 'idle';
    if (status === 'thinking') timelineState = 'thinking';
    else if (status === 'executing_tool') timelineState = 'executing_tool';
    if (approvalRequest) timelineState = 'awaiting_approval';

    return (
        <Box flexDirection="column" minHeight={dimensions.rows} width={dimensions.columns}>
            <Header 
                model={ctx.provider.constructor.name.replace('Provider', '')} 
                session="Active" 
                workspace={ctx.workspace} 
                git={ctx.git} 
                isSafeMode={ctx.pipeline.isSafeMode}
                activeExecutionId={approvalRequest?.executionId ?? undefined}
                mcpConnections={ctx.mcp.getServers().length}
                status={status}
            />
            
            <ErrorBoundary onCrash={() => ctx.pipeline.recoverFromCrash()}>
                <Box flexGrow={1} flexDirection="column" paddingX={1} paddingTop={0}>
                    <Static items={messages}>
                        {(msg) => (
                            <MessagePanel key={msg.id} msg={msg} />
                        )}
                    </Static>
                    
                    <Box flexDirection="column" marginTop={0}>
                        <ExecutionTimeline state={timelineState} />

                        {approvalRequest && (
                            <ApprovalPanel request={approvalRequest} />
                        )}

                        {menuRequest && (
                            <MenuPanel message={menuRequest.message} options={menuRequest.options} onSelect={menuRequest.resolve} />
                        )}

                        {inputRequest && (
                            <InputPanel 
                                message={inputRequest.message} 
                                {...(inputRequest.placeholder ? { placeholder: inputRequest.placeholder } : {})} 
                                onSubmit={inputRequest.resolve} 
                            />
                        )}
                        
                        {error && (
                            <Box marginTop={1} padding={1} borderStyle="single" borderColor={colors.error}>
                                <Text color={colors.error} bold>Error: </Text>
                                <Text color={colors.error}>{error}</Text>
                            </Box>
                        )}
                    </Box>
                </Box>
            </ErrorBoundary>

            <Footer 
                status={status} 
                providerName={ctx.provider.constructor.name.replace('Provider', '')}
                isSafeMode={ctx.pipeline.isSafeMode}
                hasApproval={!!approvalRequest}
                hasMenu={!!menuRequest || !!inputRequest}
                onSubmit={sendMessage} 
            />
        </Box>
    );
}
