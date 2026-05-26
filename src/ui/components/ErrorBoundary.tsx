import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Text } from 'ink';
import { colors } from '../theme/colors.js';

interface Props {
  children: ReactNode;
  onCrash?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (this.props.onCrash) {
        this.props.onCrash();
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <Box flexDirection="column" padding={1} borderStyle="single" borderColor={colors.error}>
          <Text color={colors.error} bold>Orchestration Crash Detected</Text>
          <Text color={colors.error}>{this.state.error?.message}</Text>
          <Box marginTop={1}>
            <Text color={colors.mutedText}>The TUI caught an execution error and prevented a complete crash. Press Ctrl+C to exit or try running another command if the REPL is active.</Text>
          </Box>
        </Box>
      );
    }

    return this.props.children;
  }
}
