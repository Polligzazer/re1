
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import {AuthContextProvider} from "../components/Authcontext"
import {ChatContextProvider} from "../components/ChatContext"

createRoot(document.getElementById('root')!).render(
    <AuthContextProvider>
      <ChatContextProvider>
        <StrictMode>
          <App />
        </StrictMode>
      </ChatContextProvider>
    </AuthContextProvider>
)
