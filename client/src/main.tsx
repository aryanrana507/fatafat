import { spaceQueryClient } from "@hatch/space-sdk/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { Component, StrictMode, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import "./theme.css";

const rootEl = document.querySelector<HTMLElement>("[data-generated-space-root]");
if (!rootEl) {
  throw new Error("missing generated space root element");
}

// Last-resort safety net: if anything in the tree throws while rendering
// or in an effect (e.g. blocked Web Storage in the sandboxed iframe),
// React would otherwise unmount everything and leave a completely blank
// page. This boundary keeps a visible, recoverable screen instead.
class RootErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError(): { failed: boolean } {
    return { failed: true };
  }
  render(): ReactNode {
    if (this.state.failed) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            background: "#fffbf6",
            color: "#1e140c",
            padding: "24px",
            textAlign: "center",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div>
            <div style={{ fontSize: "34px", fontWeight: 800, color: "#e04e00" }}>
              fata<span style={{ color: "#ff5e00" }}>fat</span>
            </div>
            <p style={{ marginTop: "12px", fontWeight: 700 }}>App ruk gaya 😕</p>
            <p style={{ marginTop: "6px", fontSize: "14px", color: "#7a6a5e" }}>
              Ek baar phir try karo — tumhara data (orders, stock) bilkul safe hai.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: "16px",
                borderRadius: "999px",
                background: "#ff5e00",
                color: "#fff",
                fontWeight: 800,
                padding: "10px 22px",
                border: "none",
                cursor: "pointer",
              }}
            >
              Phir Try Karo
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// If you edit this file: keep `<QueryClientProvider client={spaceQueryClient}>`
// wrapping the app (every space shares the SDK's QueryClient), and keep
// BOTH the `hatch-space-root` class AND the `data-hatch-space-root`
// attribute on the outer div. The SDK styles select on
// `.hatch-space-root[data-hatch-space-root]` to apply mobile safe-area
// insets (notches, gesture bars, etc.), correct viewport sizing, and the
// hosting header/chrome offsets — dropping either breaks layout silently.
createRoot(rootEl).render(
  <StrictMode>
    <QueryClientProvider client={spaceQueryClient}>
      <div className="hatch-space-root" data-hatch-space-root>
        <RootErrorBoundary>
          <App />
        </RootErrorBoundary>
      </div>
    </QueryClientProvider>
  </StrictMode>,
);
