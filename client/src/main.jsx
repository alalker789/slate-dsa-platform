import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { SocketProvider } from "./context/SocketContext.jsx";
import { ProgressProvider } from "./context/ProgressContext.jsx";
import { LangProvider } from "./context/LangContext.jsx";
import App from "./App.jsx";
import "./styles/global.css";
import "./styles/app.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <ProgressProvider>
            <LangProvider>
              <App />
            </LangProvider>
          </ProgressProvider>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
