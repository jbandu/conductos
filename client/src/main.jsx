import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { registerServiceWorker } from './lib/pwa.js'

function RootApp() {
  useEffect(() => {
    registerServiceWorker().catch((err) => {
      console.warn('Service worker registration skipped:', err)
    })
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <RootApp />
  </React.StrictMode>,
)
