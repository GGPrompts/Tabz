import React from "react";
import ReactDOM from "react-dom/client";
import SimpleTerminalApp from "./SimpleTerminalApp";
import AppErrorBoundary from "./AppErrorBoundary";
import { setupConsoleForwarding } from "./utils/consoleForwarder";
import "./index.css";

// Forward browser console logs to backend terminal (for Claude debugging)
setupConsoleForwarding();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <SimpleTerminalApp />
    </AppErrorBoundary>
  </React.StrictMode>,
);
