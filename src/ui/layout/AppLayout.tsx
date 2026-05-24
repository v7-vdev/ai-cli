import React, { useEffect, useState } from 'react';
import { Box, Text, Static, useStdout } from 'ink';
import { Header } from '../components/Header.js';
import { Footer } from '../components/Footer.js';
import { useChat } from '../hooks/useChat.js';
import { RuntimeContext } from '../../context/runtimeContext.js';
import { ToolExecutor } from '../../tools/executor.js';
import { colors } from '../theme/colors.js';
import { MessagePanel } from '../components/MessagePanel.js';

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

    return (
        <Box flexDirection="column" minHeight={dimensions.rows} width={dimensions.columns} borderStyle="single" borderColor={colors.primary}>
            <Header model={ctx.provider.constructor.name.replace('Provider', '')} session="Active" workspace={ctx.workspace} />
            
            <Box flexGrow={1} flexDirection="column" paddingX={0}>
                <Static items={messages}>
                    {(msg) => (
                        <MessagePanel key={msg.id} msg={msg} />
                    )}
                </Static>
                
                {error && (
                    <Box marginTop={1}>
                        <Text color={colors.error} bold>Error: </Text>
                        <Text color={colors.error}>{error}</Text>
                    </Box>
                )}
            </Box>

            <Footer status={status} onSubmit={sendMessage} />
        </Box>
    );
}
