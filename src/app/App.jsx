import React from "react";
import { BrowserRouter } from "react-router-dom";
import { SessionProvider } from "./auth/SessionContext";
import AppRouter from "./routes/AppRouter";

export default function App() {
  return (
    <BrowserRouter>
      <SessionProvider>
        <AppRouter />
      </SessionProvider>
    </BrowserRouter>
  );
}
