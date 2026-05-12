import React from 'react'
import App from '../../shared/App'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from '../../pages/club/DashboardPage'

// Application Club utilisant le composant App commun
const ClubApp: React.FC = () => {
  return (
    <App
      mode="club"
      LoginComponent={Login}
      RegisterComponent={Register}
      DashboardComponent={Dashboard}
      protectedPath="/club"
    />
  )
}

export default ClubApp
