import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'

// Imports statiques des deux applications
import ClubApp from './apps/club/App.tsx'
import MunicipaliteApp from './apps/municipalite/App.tsx'

// Debug des variables d'environnement
console.log('import.meta.env:', import.meta.env)
console.log('VITE_APP_TARGET:', import.meta.env.VITE_APP_TARGET)
console.log('VITE_APP_TITLE:', import.meta.env.VITE_APP_TITLE)

// Sélection de l'application selon la variable d'environnement
const target = import.meta.env.VITE_APP_TARGET

let App: React.ComponentType

if (target === 'municipalite') {
  App = MunicipaliteApp
} else if (target === 'club') {
  App = ClubApp
} else {
  // Fallback vers club si la variable n'est pas définie
  console.warn(`Mode non supporté: ${target}. Utilisation du mode club par défaut.`)
  App = ClubApp
}

// Définir le titre de la page
document.title = import.meta.env.VITE_APP_TITLE || 'IKIVIO'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)