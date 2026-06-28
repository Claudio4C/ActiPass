import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { User, ExternalLink, Eye, EyeOff, Save } from 'lucide-react'
import Button from '../../components/ui/Button'
import { COACH_PROFILE } from '../../data/coach/mockData'

const ProfilePage: React.FC = () => {
  const [profile, setProfile] = useState(COACH_PROFILE)
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const togglePublish = () => {
    setProfile(p => ({ ...p, isPublished: !p.isPublished }))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-widest font-bold text-emerald-700 dark:text-emerald-400">
            P5-4 · Profil public
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-1 flex items-center gap-2">
            <User className="w-7 h-7 text-emerald-600" />
            Mon profil public
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Bio, spécialités et clubs — visible dans l&apos;annuaire des coachs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={togglePublish}
            variant="outline"
            className="inline-flex items-center gap-2 text-sm"
          >
            {profile.isPublished ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {profile.isPublished ? 'Dépublier' : 'Publier'}
          </Button>
          <Link
            to={`/coach/independants/${profile.id}`}
            target="_blank"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 dark:border-slate-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-800"
          >
            <ExternalLink className="w-4 h-4" />
            Aperçu annuaire
          </Link>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Prénom</span>
                <input
                  value={profile.firstName}
                  onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </label>
              <label className="block">
                <span className="text-xs font-medium text-gray-500">Nom</span>
                <input
                  value={profile.lastName}
                  onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))}
                  className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </label>
            </div>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Bio / présentation</span>
              <textarea
                value={profile.bio}
                onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                rows={4}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm resize-none"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Zone d&apos;intervention</span>
              <input
                value={profile.serviceArea}
                onChange={e => setProfile(p => ({ ...p, serviceArea: e.target.value }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Spécialités (séparées par des virgules)</span>
              <input
                value={profile.specialties.join(', ')}
                onChange={e => setProfile(p => ({ ...p, specialties: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </label>

            <label className="block">
              <span className="text-xs font-medium text-gray-500">Qualifications / diplômes</span>
              <input
                value={profile.qualifications.join(', ')}
                onChange={e => setProfile(p => ({ ...p, qualifications: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))}
                className="mt-1 w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </label>

            <Button onClick={handleSave} className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700">
              <Save className="w-4 h-4" />
              {saved ? 'Profil enregistré !' : 'Enregistrer le profil'}
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Statut annuaire</p>
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-lg ${
                profile.isPublished
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                  : 'bg-gray-100 text-gray-600 dark:bg-slate-800 dark:text-gray-400'
              }`}
            >
              {profile.isPublished ? 'Profil publié' : 'Profil non publié'}
            </span>
            <p className="text-sm text-gray-500 mt-3">
              Note moyenne : <strong>{profile.rating}/5</strong> ({profile.reviewsCount} avis)
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-5">
            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Clubs associés</p>
            <ul className="space-y-2">
              {profile.clubs.map(club => (
                <li key={club.id} className="text-sm">
                  <span className="font-medium text-gray-900 dark:text-white">{club.name}</span>
                  <span className="text-gray-500 ml-1">· {club.city}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfilePage
