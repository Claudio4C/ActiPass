import React from 'react'
import { Outlet } from 'react-router-dom'
import MunicipalSidebar from '../components/layout/MunicipalSidebar'
import MunicipalHeader from '../components/layout/MunicipalHeader'

const MunicipalDashboardLayout: React.FC = () => (
  <div className="min-h-screen bg-background">
    <div className="flex h-screen overflow-hidden">
      <MunicipalSidebar />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <MunicipalHeader />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  </div>
)

export default MunicipalDashboardLayout
