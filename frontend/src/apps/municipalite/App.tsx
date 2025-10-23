import React from 'react';
import App from '../../shared/App';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from '../../pages/municipalite/DashboardPage';

// Application Municipalité utilisant le composant App commun
const MunicipaliteApp: React.FC = () => {
    return (
        <App
            mode="municipalite"
            LoginComponent={Login}
            RegisterComponent={Register}
            DashboardComponent={Dashboard}
            protectedPath="/municipalite"
        />
    );
};

export default MunicipaliteApp;
