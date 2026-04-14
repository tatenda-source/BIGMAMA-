import React from 'react';

/**
 * Catches render errors anywhere in the React tree so a single broken
 * component doesn't blank the app for a user in the middle of filing a report.
 *
 * Never logs the error payload — the component tree may contain in-progress
 * report data. We surface a generic message and a reset action.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch() {
    // Intentionally silent. Wire a redacted telemetry hook here if ever added.
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 'var(--space-xl, 32px)',
          background: 'var(--background, #050505)',
          color: 'var(--color-text, #f5f5f7)',
          fontFamily: 'var(--font-main, system-ui)',
          textAlign: 'center',
          gap: 'var(--space-md, 16px)',
        }}
      >
        <h1 style={{ fontSize: '20px', margin: 0 }}>Something went wrong.</h1>
        <p style={{ color: 'var(--color-text-dim, #a0a0a0)', maxWidth: '480px' }}>
          Your data was not transmitted. You can reload the page and try again.
          If this keeps happening, switch to Low Data Mode or use a different
          network.
        </p>
        <button
          type="button"
          onClick={this.reset}
          style={{
            padding: '10px 18px',
            borderRadius: 'var(--radius-md, 12px)',
            border: '1px solid var(--color-border-strong, rgba(255,255,255,0.16))',
            background: 'transparent',
            color: 'var(--color-text, #f5f5f7)',
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
      </div>
    );
  }
}
