// src/main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import PortalApp from './PortalApp.jsx' // IMPORTA O NOSSO COMPONENTE
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <PortalApp /> {/* RENDERIZA O NOSSO COMPONENTE */}
  </React.StrictMode>,
)