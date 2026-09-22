/**
 * ErrorBoundary — catches render-time React errors in child component trees
 * and surfaces a user-friendly fallback UI instead of a blank screen.
 *
 * Designed as a thin wrapper: no branding tie-in, no toast noise,
 * just a clear message and a Try Again button that reloads the page.
 */
import React, { Component } from "react";
import Button from "./ui/Button";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log without leaking stack traces or internal details to the user.
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-50 px-4">
          <div className="max-w-md w-full text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-danger-100 flex items-center justify-center mx-auto">
              <svg
                className="w-6 h-6 text-danger-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-neutral-800">
              Something went wrong
            </h1>
            <p className="text-sm text-neutral-500">
              An unexpected error occurred. Please try again.
            </p>
            <Button variant="primary" onClick={this.handleRetry}>
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
