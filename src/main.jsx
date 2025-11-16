import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from "react-router-dom";
import './index.css'
import App from './App.jsx'

import { AlertProvider } from "./components/AlertContext.jsx"; // 🔹 import Provider
import Alert from "./components/Alert.jsx";                    // 🔹 import Komponen Alert

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AlertProvider> {/* 🔥 Bungkus disini */}
      <BrowserRouter basename='/'>
        <App />
        <Alert />   {/* 🔥 tampilkan di luar App agar global */}
      </BrowserRouter>
    </AlertProvider>
  </StrictMode>
)
