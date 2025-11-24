import React, { useState } from 'react';
import { User, MapPin, Star, DollarSign, Calendar, Award, Camera, Save, Plus, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

const ProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isProfileComplete, setIsProfileComplete] = useState(false);
    const [isAvailabilityPublic, setIsAvailabilityPublic] = useState(false);

    // Données mockées
    const profile = {
        photo: null,
        description: 'Coach de tennis expérimenté avec plus de 10 ans d\'expérience. Spécialisé dans l\'entraînement des jeunes et des adultes.',
        qualifications: [
            { id: '1', name: 'Diplôme d\'État Tennis', year: 2015 },
            { id: '2', name: 'Certificat FFT', year: 2016 }
        ],
        disciplines: ['Tennis', 'Badminton'],
        zoneIntervention: 'Paris et région parisienne',
        clubs: ['Club de Tennis Paris', 'Club de Badminton Lyon'],
        rating: 4.8,
        totalReviews: 42,
        isPublished: false
    };

    const pricing = {
        singleSession: 50,
        pack5: 225, // 45€ par séance
        pack10: 400, // 40€ par séance
        firstSessionFree: true
    };

    const availability = [
        { day: 'Lundi', times: ['09:00 - 12:00', '14:00 - 18:00'] },
        { day: 'Mardi', times: ['09:00 - 12:00', '14:00 - 18:00'] },
        { day: 'Mercredi', times: ['09:00 - 12:00'] },
        { day: 'Jeudi', times: ['09:00 - 12:00', '14:00 - 18:00'] },
        { day: 'Vendredi', times: ['09:00 - 12:00'] }
    ];

    const reviews = [
        {
            id: '1',
            student: 'Marie Dupont',
            rating: 5,
            comment: 'Excellent coach, très pédagogue et patient. Je recommande !',
            date: '2025-01-10'
        },
        {
            id: '2',
            student: 'Jean Martin',
            rating: 4,
            comment: 'Très bon coach, les séances sont bien structurées.',
            date: '2025-01-05'
        }
    ];

    const missingFields = [
        !profile.photo && 'Photo de profil',
        !profile.qualifications.length && 'Au moins une qualification',
        !profile.description && 'Description'
    ].filter(Boolean);

    return (
        <Layout
            title="Profil public"
            subtitle="Gérez votre présentation, tarifs et disponibilités pour attirer de nouveaux élèves"
            mode="club"
        >
            <div className="space-y-6">
                {/* Alerte profil incomplet */}
                {missingFields.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/50 rounded-2xl p-6">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                                <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-amber-900 dark:text-amber-100 mb-2">
                                    Profil incomplet
                                </h3>
                                <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
                                    Vous ne pouvez pas publier votre profil tant que les informations suivantes ne sont pas renseignées :
                                </p>
                                <ul className="list-disc list-inside text-sm text-amber-800 dark:text-amber-200 space-y-1">
                                    {missingFields.map((field, index) => (
                                        <li key={index}>{field}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* En-tête avec photo et stats */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                {user?.firstName?.charAt(0) || 'C'}
                            </div>
                            <button className="absolute bottom-0 right-0 w-8 h-8 bg-white dark:bg-slate-800 rounded-full border-2 border-slate-200 dark:border-slate-700 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                                <Camera className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                            </button>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {user?.firstName} {user?.lastName}
                                </h2>
                                <div className="flex items-center gap-2">
                                    {profile.isPublished ? (
                                        <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 rounded-full text-sm font-medium">
                                            Publié
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full text-sm font-medium">
                                            Non publié
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400 mb-4">
                                <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                    <span className="font-semibold">{profile.rating}</span>
                                    <span>({profile.totalReviews} avis)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {profile.zoneIntervention}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    size="sm"
                                    mode="club"
                                    onClick={() => setIsEditing(!isEditing)}
                                >
                                    {isEditing ? 'Annuler' : 'Modifier'}
                                </Button>
                                {!profile.isPublished && missingFields.length === 0 && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        mode="club"
                                        className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                    >
                                        Publier le profil
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Description et qualifications */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Présentation</h3>
                            {isEditing && (
                                <Button variant="outline" size="sm" mode="club">
                                    <Save className="w-4 h-4 mr-1" />
                                    Enregistrer
                                </Button>
                            )}
                        </div>
                        {isEditing ? (
                            <textarea
                                className="w-full h-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                defaultValue={profile.description}
                            />
                        ) : (
                            <p className="text-slate-600 dark:text-slate-300">{profile.description}</p>
                        )}

                        <div className="mt-6">
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-white mb-3">Disciplines enseignées</h4>
                            <div className="flex flex-wrap gap-2">
                                {profile.disciplines.map((discipline, index) => (
                                    <span
                                        key={index}
                                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                                    >
                                        {discipline}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Qualifications</h3>
                            {isEditing && (
                                <Button variant="outline" size="sm" mode="club">
                                    <Plus className="w-4 h-4 mr-1" />
                                    Ajouter
                                </Button>
                            )}
                        </div>
                        <div className="space-y-3">
                            {profile.qualifications.map((qual) => (
                                <div
                                    key={qual.id}
                                    className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                >
                                    <div>
                                        <p className="font-medium text-slate-900 dark:text-white">{qual.name}</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{qual.year}</p>
                                    </div>
                                    {isEditing && (
                                        <button className="text-red-600 hover:text-red-700">
                                            <X className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tarification */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tarification</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                Définissez vos tarifs pour les cours privés
                            </p>
                        </div>
                        {isEditing && (
                            <Button variant="outline" size="sm" mode="club">
                                <Save className="w-4 h-4 mr-1" />
                                Enregistrer
                            </Button>
                        )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Séance unique</div>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    defaultValue={pricing.singleSession}
                                />
                            ) : (
                                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {pricing.singleSession} €
                                </div>
                            )}
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pack de 5 séances</div>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    defaultValue={pricing.pack5}
                                />
                            ) : (
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {pricing.pack5} €
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        (45 €/séance)
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <div className="text-sm text-slate-600 dark:text-slate-400 mb-1">Pack de 10 séances</div>
                            {isEditing ? (
                                <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    defaultValue={pricing.pack10}
                                />
                            ) : (
                                <div>
                                    <div className="text-2xl font-bold text-slate-900 dark:text-white">
                                        {pricing.pack10} €
                                    </div>
                                    <div className="text-xs text-slate-500 dark:text-slate-400">
                                        (40 €/séance)
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="firstSessionFree"
                            checked={pricing.firstSessionFree}
                            disabled={!isEditing}
                            className="w-4 h-4 text-indigo-600 rounded"
                        />
                        <label htmlFor="firstSessionFree" className="text-sm text-slate-700 dark:text-slate-300">
                            Première séance gratuite
                        </label>
                    </div>
                </div>

                {/* Disponibilités */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Disponibilités</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                Plages horaires disponibles pour les cours privés
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="publicAvailability"
                                    checked={isAvailabilityPublic}
                                    onChange={(e) => setIsAvailabilityPublic(e.target.checked)}
                                    className="w-4 h-4 text-indigo-600 rounded"
                                />
                                <label htmlFor="publicAvailability" className="text-sm text-slate-700 dark:text-slate-300">
                                    Publier aux clubs
                                </label>
                            </div>
                            {isEditing && (
                                <Button variant="outline" size="sm" mode="club">
                                    <Calendar className="w-4 h-4 mr-1" />
                                    Modifier
                                </Button>
                            )}
                        </div>
                    </div>
                    {isAvailabilityPublic && (
                        <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 rounded-lg">
                            <p className="text-sm text-emerald-800 dark:text-emerald-200">
                                ✓ Votre calendrier de disponibilités est visible par les clubs pour vous proposer des créneaux
                            </p>
                        </div>
                    )}
                    <div className="space-y-3">
                        {availability.map((day, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                                <div className="font-medium text-slate-900 dark:text-white w-24">{day.day}</div>
                                <div className="flex-1 flex items-center gap-2">
                                    {day.times.map((time, timeIndex) => (
                                        <span
                                            key={timeIndex}
                                            className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-800 dark:text-indigo-300 rounded-full text-sm"
                                        >
                                            {time}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Clubs où il enseigne */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Clubs où j'enseigne</h3>
                    <div className="space-y-2">
                        {profile.clubs.map((club, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg"
                            >
                                <span className="text-slate-900 dark:text-white">{club}</span>
                                <span className="text-sm text-slate-500 dark:text-slate-400">Actif</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Avis et évaluations */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Avis et évaluations</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                                {profile.totalReviews} avis • Note moyenne : {profile.rating}/5
                            </p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        {reviews.map((review) => (
                            <div
                                key={review.id}
                                className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl"
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <div className="font-medium text-slate-900 dark:text-white">{review.student}</div>
                                    <div className="flex items-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                className={`w-4 h-4 ${
                                                    i < review.rating
                                                        ? 'text-amber-500 fill-amber-500'
                                                        : 'text-slate-300 dark:text-slate-600'
                                                }`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{review.comment}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{review.date}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default ProfilePage;

