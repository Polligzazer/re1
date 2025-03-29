
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";
import { ChatContextProvider } from "../components/ChatContext";
import { AuthContextProvider } from "../components/Authcontext";

createRoot(document.getElementById('root')!).render(
  <AuthContextProvider>
  <ChatContextProvider>
      <StrictMode>
        <App />
      </StrictMode>
    </ChatContextProvider>
  </AuthContextProvider>
);
