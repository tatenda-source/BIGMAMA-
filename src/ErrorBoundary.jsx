import React from 'react';

/**
 * Catches render errors anywhere in the React tree so a single broken
 * component doesn't blank the app for a user in the middle of filing a
 * report. Never logs the error payload — the component tree may contain
 * in-progress report data.
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
          padding: 'var(--space-xl)',
          background: 'var(--paper)',
          color: 'var(--ink)',
          fontFamily: 'var(--font-main)',
          textAlign: 'center',
          gap: 'var(--space-md)',
        }}
      >
        <p
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            letterSpacing: '0.28em',
            textTransform: 'uppercase',
            color: 'var(--stamp)',
            margin: 0,
          }}
        >
          Filing halted · Exception § 500
        </p>
        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontVariationSettings: '"opsz" 144, "wght" 500',
            fontSize: 'clamp(28px, 4vw, 42px)',
            margin: 0,
            letterSpacing: '-0.02em',
          }}
        >
          Something went wrong.
        </h1>
        <p
          style={{
            color: 'var(--ink-muted)',
            maxWidth: 520,
            fontStyle: 'italic',
            lineHeight: 1.55,
          }}
        >
          Your data was not transmitted. You can reload the page and try again.
          If this keeps happening, switch to Low Data Mode or use a different
          network.
        </p>
        <button
          type="button"
          onClick={this.reset}
          className="btn-primary"
          style={{ marginTop: 8 }}
        >
          Try again
        </button>
      </div>
    );
  }
}
