import React from 'react'

const Register: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-8">
      <div className="bg-white border border-gray-200 rounded-2xl p-8 max-w-lg text-center shadow-sm">
        <h1 className="text-2xl font-bold mb-2">Création de compte Admin</h1>
        <p className="text-gray-600">
          Les comptes Administrateur sont créés par l'équipe Actipass. Veuillez contacter le support si vous avez besoin d'un accès.
        </p>
      </div>
    </div>
  )
}

export default Register
