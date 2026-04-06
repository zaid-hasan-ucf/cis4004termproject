import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Inject #bg-blobs BEFORE #root so the canvas lives outside React's stacking context
const blobRoot = document.createElement('div')
blobRoot.id = 'bg-blobs'
document.body.insertBefore(blobRoot, document.getElementById('root'))

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
