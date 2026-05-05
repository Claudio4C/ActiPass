import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Imports statiques des applications
import ClubApp from './apps/club/App.tsx'
import MunicipaliteApp from './apps/municipalite/App.tsx'
import AdminApp from './apps/admin/App.tsx'
import SuperAdminApp from './apps/superadmin/App.tsx'

// Debug des variables d'environnement
console.log('import.meta.env:', import.meta.env)
console.log('VITE_APP_TARGET:', import.meta.env.VITE_APP_TARGET)
console.log('VITE_APP_TITLE:', import.meta.env.VITE_APP_TITLE)

// Sélection de l'application en priorité via l'URL, puis fallback via l'env
const path = window.location.pathname
const envTarget = import.meta.env.VITE_APP_TARGET

let App: React.ComponentType

if (path.startsWith('/superadmin') || envTarget === 'superadmin') {
  App = SuperAdminApp
} else if (path.startsWith('/admin') || envTarget === 'admin') {
  App = AdminApp
} else if (path.startsWith('/municipalite') || envTarget === 'municipalite') {
  App = MunicipaliteApp
} else {
  App = ClubApp
}

// Définir le titre de la page
document.title = import.meta.env.VITE_APP_TITLE || 'Actipass'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)