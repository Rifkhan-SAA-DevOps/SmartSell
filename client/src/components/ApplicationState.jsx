import { Component } from "react";

function StateMark({ error = false }) {
  return (
    <span className={`application-state-mark ${error ? "is-error" : ""}`} aria-hidden="true">
      {error ? (
        <svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 17h.01"/></svg>
      ) : (
        <><i /><i /><i /></>
      )}
    </span>
  );
}

export function RouteLoadingState({ label = "Loading your SmartSell workspace" }) {
  return (
    <section className="application-route-loading" role="status" aria-live="polite" aria-busy="true">
      <StateMark />
      <div>
        <span>SmartSell</span>
        <strong>{label}</strong>
        <p>Preparing the page and its latest information.</p>
      </div>
    </section>
  );
}

export class ApplicationErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("SmartSell page error", error, info);
  }

  componentDidUpdate(previousProps) {
    if (this.state.error && previousProps.resetKey !== this.props.resetKey) {
      // A new route should receive a fresh render attempt.
      // eslint-disable-next-line react/no-did-update-set-state
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <section className="application-error-state" role="alert">
        <StateMark error />
        <span>Something interrupted this page</span>
        <h1>SmartSell could not finish loading this workspace.</h1>
        <p>Your account and saved information are safe. Refresh this page, or return to the main dashboard and try again.</p>
        <div>
          <button type="button" onClick={() => window.location.reload()}>Refresh page</button>
          <a href="/dashboard">Open dashboard</a>
        </div>
        {import.meta.env.DEV && this.state.error?.message && <small>{this.state.error.message}</small>}
      </section>
    );
  }
}
