import React from 'react'
import ReactDOM from 'react-dom/client'
import { PublicClientApplication } from "@azure/msal-browser";
import { MsalProvider } from "@azure/msal-react";
import { msalConfig } from './app/authConfig';
import App from './app/App';
import './styles/fonts.css';       
import './styles/theme.css';       
import './styles/globals.css';    
import './styles/index.css';       
import './styles/tailwind.css';
const msalInstance = new PublicClientApplication(msalConfig);

await msalInstance.initialize();

// THÊM ĐOẠN .initialize().then() NÀY ĐỂ CỬA SỔ CHA BIẾT CÁCH ĐÓNG POPUP
msalInstance.initialize().then(() => {
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <MsalProvider instance={msalInstance}>
        <App />
      </MsalProvider>
    </React.StrictMode>,
  )
});