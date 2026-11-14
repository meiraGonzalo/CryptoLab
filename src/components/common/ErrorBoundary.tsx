import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Callout } from './Callout';
import { Button } from './Button';

interface Props {
  children: ReactNode;
  resetKey: string;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  componentDidUpdate(prev: Props) {
    if (prev.resetKey !== this.props.resetKey && this.state.error) this.setState({ error: null });
  }

  render() {
    if (this.state.error) {
      return (
        <Callout
          tone="danger"
          title="Se produjo un error inesperado en esta sección"
          action={
            <Button size="sm" onClick={() => this.setState({ error: null })}>
              Reintentar
            </Button>
          }
        >
          {this.state.error.message}
        </Callout>
      );
    }
    return this.props.children;
  }
}
