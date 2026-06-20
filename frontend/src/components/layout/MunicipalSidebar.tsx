import React, { useState } from 'react'

import { Link, useLocation } from 'react-router-dom'

import {

  LayoutDashboard, Building2, Users, MapPin, BarChart3,

  FileText, Settings, Menu, X, Landmark, Wrench, Map, CalendarDays, Package,

} from 'lucide-react'

import { cn } from '../../lib/utils'

import { MUNICIPALITY } from '../../data/municipal/mockData'



const MENU = [

  { icon: LayoutDashboard, label: "Vue d'ensemble", path: '/municipalite/dashboard' },

  { icon: Users, label: 'Associations', path: '/municipalite/dashboard/associations' },

  { icon: Building2, label: 'Infrastructures', path: '/municipalite/dashboard/infrastructures' },

  { icon: CalendarDays, label: 'Planning des salles', path: '/municipalite/dashboard/planning' },

  { icon: Wrench, label: 'Patrimoine', path: '/municipalite/dashboard/patrimoine' },

  { icon: Package, label: 'Matériel', path: '/municipalite/dashboard/materiel' },

  { icon: Map, label: 'Carte territoriale', path: '/municipalite/dashboard/carte' },

  { icon: BarChart3, label: 'Statistiques', path: '/municipalite/dashboard/statistiques' },

  { icon: FileText, label: 'Rapports élus', path: '/municipalite/dashboard/rapports' },

  { icon: Settings, label: 'Paramètres', path: '/municipalite/dashboard/parametres', soon: true },

]



const MunicipalSidebar: React.FC = () => {

  const location = useLocation()

  const [mobileOpen, setMobileOpen] = useState(false)



  const isActive = (path: string) =>

    path === '/municipalite/dashboard'

      ? location.pathname === path

      : location.pathname.startsWith(path)



  const nav = (

    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">

      <p className="px-3 mb-2 text-[10px] uppercase tracking-widest font-bold text-muted-foreground">

        Pilotage

      </p>

      {MENU.map(item => {

        const Icon = item.icon

        const active = isActive(item.path)

        return (

          <Link

            key={item.path}

            to={item.soon ? '#' : item.path}

            onClick={() => setMobileOpen(false)}

            className={cn(

              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',

              active

                ? 'bg-primary/10 text-primary'

                : 'text-muted-foreground hover:bg-muted hover:text-foreground',

              item.soon && 'opacity-50 pointer-events-none',

            )}

          >

            <Icon className="w-4 h-4 shrink-0" />

            <span className="flex-1">{item.label}</span>

            {item.soon && (

              <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">

                Bientôt

              </span>

            )}

          </Link>

        )

      })}

    </nav>

  )



  return (

    <>

      <button

        type="button"

        className="lg:hidden fixed bottom-5 right-5 z-40 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"

        onClick={() => setMobileOpen(true)}

        aria-label="Ouvrir le menu"

      >

        <Menu className="w-5 h-5" />

      </button>



      {mobileOpen && (

        <div className="lg:hidden fixed inset-0 z-50 bg-foreground/40" onClick={() => setMobileOpen(false)} />

      )}



      <aside

        className={cn(

          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform lg:translate-x-0',

          mobileOpen ? 'translate-x-0' : '-translate-x-full',

        )}

      >

        <div className="h-16 px-4 flex items-center justify-between border-b border-border shrink-0">

          <Link to="/municipalite/dashboard" className="flex items-center gap-2.5 min-w-0">

            <div className="w-9 h-9 rounded-xl bg-[hsl(280,70%,55%)] flex items-center justify-center shrink-0 shadow-sm">

              <Landmark className="w-5 h-5 text-white" />

            </div>

            <div className="min-w-0">

              <p className="font-display font-bold text-sm text-foreground truncate">Ikivio</p>

              <p className="text-[10px] text-muted-foreground truncate">Portail municipal</p>

            </div>

          </Link>

          <button type="button" className="lg:hidden p-1.5 rounded-lg hover:bg-muted" onClick={() => setMobileOpen(false)}>

            <X className="w-4 h-4" />

          </button>

        </div>



        <div className="px-4 py-4 border-b border-border">

          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 border border-border">

            <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />

            <div className="min-w-0">

              <p className="text-xs font-semibold text-foreground truncate">{MUNICIPALITY.name}</p>

              <p className="text-[10px] text-muted-foreground">{MUNICIPALITY.department}</p>

            </div>

          </div>

        </div>



        {nav}



        <div className="p-4 border-t border-border shrink-0">

          <div className="rounded-xl bg-gradient-to-br from-primary/15 to-[hsl(280,70%,60%/0.12)] border border-primary/20 p-3">

            <p className="text-xs font-bold text-foreground">Centre de pilotage</p>

            <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed">

              Actions requises, patrimoine, conformité associative et aide à la décision.

            </p>

          </div>

        </div>

      </aside>

    </>

  )

}



export default MunicipalSidebar

