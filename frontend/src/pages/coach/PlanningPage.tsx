import React, { useState } from 'react';
import { Calendar as CalendarIcon, MapPin, Users, Plus, X, AlertCircle, CheckCircle, MessageSquare, Video } from 'lucide-react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DateSelectArg, EventClickArg, EventContentArg } from '@fullcalendar/core';
import Layout from '../../components/layout/Layout';
import Button from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';

type SlotType = 'club' | 'private' | 'unavailable';
type SlotStatus = 'confirmed' | 'pending' | 'cancelled';

interface Slot {
    id: string;
    type: SlotType;
    club?: string;
    student?: string;
    date: string;
    startTime: string;
    endTime: string;
    status: SlotStatus;
    location?: string;
    participants?: number;
    isOnline?: boolean;
}

const PlanningPage: React.FC = () => {
    useAuth(); // accessible mais non utilisé directement
    const [selectedView, setSelectedView] = useState<'calendar' | 'list'>('calendar');
    const [showCreateSlot, setShowCreateSlot] = useState(false);
    const [showUnavailability, setShowUnavailability] = useState(false);
    const [showMessageModal, setShowMessageModal] = useState(false);
    const [selectedSlotForMessage, setSelectedSlotForMessage] = useState<Slot | null>(null);

    // Données mockées
    const slots: Slot[] = [
        {
            id: '1',
            type: 'club',
            club: 'Club de Tennis Paris',
            date: '2025-01-15',
            startTime: '10:00',
            endTime: '11:30',
            status: 'confirmed',
            participants: 12
        },
        {
            id: '2',
            type: 'private',
            student: 'Jean Dupont',
            date: '2025-01-15',
            startTime: '14:00',
            endTime: '15:00',
            status: 'pending',
            location: 'À domicile',
            isOnline: false
        },
        {
            id: '3',
            type: 'club',
            club: 'Club de Badminton Lyon',
            date: '2025-01-16',
            startTime: '18:00',
            endTime: '19:30',
            status: 'pending',
            participants: 8
        }
    ];

    const pendingSlots = slots.filter((s) => s.status === 'pending');

    const eventColors: Record<string, string> = {
        club: '#4f46e5',
        private: '#f97316',
        unavailable: '#94a3b8',
        stage: '#0ea5e9'
    };

    const calendarEvents = React.useMemo(
        () =>
            slots.map((slot) => {
                const title =
                    slot.type === 'private'
                        ? `Privé${slot.student ? ` • ${slot.student}` : ''}`
                        : slot.club ?? 'Créneau';

                return {
                    id: slot.id,
                    title,
                    start: `${slot.date}T${slot.startTime}`,
                    end: `${slot.date}T${slot.endTime}`,
                    backgroundColor: eventColors[slot.type] ?? '#4f46e5',
                    borderColor: eventColors[slot.type] ?? '#4f46e5',
                    textColor: '#ffffff',
                    extendedProps: { slot }
                };
            }),
        [slots]
    );

    const handleCalendarSelect = React.useCallback((selectionInfo: DateSelectArg) => {
        setShowCreateSlot(true);
        selectionInfo.view.calendar.unselect();
    }, []);

    const handleCalendarEventClick = React.useCallback(
        (clickInfo: EventClickArg) => {
            const slotData = (clickInfo.event.extendedProps as { slot?: Slot }).slot;
            if (slotData) {
                setSelectedSlotForMessage(slotData);
                setShowMessageModal(true);
            }
        },
        []
    );

    const renderEventContent = React.useCallback((eventInfo: EventContentArg) => {
        const slotData = (eventInfo.event.extendedProps as { slot?: Slot }).slot;
        return (
            <div className="flex flex-col text-[11px] leading-tight text-white">
                <span className="font-semibold">{eventInfo.event.title}</span>
                <span className="opacity-80">{eventInfo.timeText}</span>
                {slotData?.location ? <span className="opacity-80">{slotData.location}</span> : null}
                {slotData?.participants ? <span className="opacity-80">{slotData.participants} participants</span> : null}
            </div>
        );
    }, []);

    return (
        <Layout
            title="Mon planning"
            subtitle="Gérez vos créneaux multi-club, cours privés et indisponibilités"
            mode="club"
        >
            <div className="space-y-6 fc-theme">
                {/* En-tête avec actions */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSelectedView('calendar')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedView === 'calendar'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            Calendrier
                        </button>
                        <button
                            onClick={() => setSelectedView('list')}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                selectedView === 'list'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                        >
                            Liste
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            mode="club"
                            onClick={() => setShowUnavailability(true)}
                        >
                            <X className="w-4 h-4 mr-2" />
                            Déclarer une indisponibilité
                        </Button>
                        <Button
                            size="sm"
                            mode="club"
                            onClick={() => setShowCreateSlot(true)}
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Créer un créneau privé
                        </Button>
                        <div className="hidden md:flex items-center gap-2 text-slate-500 text-sm ml-2">
                            <CalendarIcon className="w-4 h-4" />
                            <span>Vue multi-club & privé</span>
                        </div>
                    </div>
                </div>

                {/* Créneaux en attente */}
                {pendingSlots.length > 0 && (
                    <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/50 rounded-2xl p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            <h3 className="font-semibold text-amber-900 dark:text-amber-100">
                                {pendingSlots.length} créneau{pendingSlots.length > 1 ? 'x' : ''} en attente de confirmation
                            </h3>
                        </div>
                        <div className="space-y-3">
                            {pendingSlots.map((slot) => (
                                <div
                                    key={slot.id}
                                    className="flex items-center justify-between p-4 bg-white dark:bg-slate-800 rounded-xl border border-amber-200 dark:border-amber-500/30"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                                            slot.type === 'club' 
                                                ? 'bg-blue-100 dark:bg-blue-500/20' 
                                                : 'bg-purple-100 dark:bg-purple-500/20'
                                        }`}>
                                            {slot.type === 'club' ? (
                                                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                            ) : (
                                                <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                                            )}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white">
                                                {slot.club || slot.student}
                                            </h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                                {slot.date} • {slot.startTime} - {slot.endTime}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            mode="club"
                                            className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                        >
                                            <CheckCircle className="w-4 h-4 mr-1" />
                                            Accepter
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            mode="club"
                                            className="text-red-600 border-red-200 hover:bg-red-50"
                                        >
                                            <X className="w-4 h-4 mr-1" />
                                            Refuser
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vue calendrier ou liste */}
                {selectedView === 'calendar' ? (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-4 sm:p-6">
                        <FullCalendar
                            plugins={[timeGridPlugin, interactionPlugin]}
                            initialView="timeGridWeek"
                            headerToolbar={{
                                left: 'prev,next today',
                                center: 'title',
                                right: 'timeGridWeek,timeGridDay'
                            }}
                            locale="fr"
                            firstDay={1}
                            height="auto"
                            slotMinTime="06:00:00"
                            slotMaxTime="22:00:00"
                            allDaySlot={false}
                            nowIndicator
                            selectable
                            selectMirror
                            events={calendarEvents}
                            select={handleCalendarSelect}
                            eventClick={handleCalendarEventClick}
                            eventContent={renderEventContent}
                        />
                    </div>
                ) : (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                <thead className="bg-slate-50 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Date & Heure
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Détails
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Statut
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-700">
                                    {slots.map((slot) => (
                                        <tr key={slot.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {slot.date}
                                                </div>
                                                <div className="text-sm text-slate-500 dark:text-slate-400">
                                                    {slot.startTime} - {slot.endTime}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    slot.type === 'club'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300'
                                                }`}>
                                                    {slot.type === 'club' ? 'Club' : 'Privé'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm font-medium text-slate-900 dark:text-white">
                                                    {slot.club || slot.student}
                                                </div>
                                                {slot.location && (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        <MapPin className="w-3 h-3 inline mr-1" />
                                                        {slot.location}
                                                    </div>
                                                )}
                                                {slot.participants && (
                                                    <div className="text-sm text-slate-500 dark:text-slate-400">
                                                        <Users className="w-3 h-3 inline mr-1" />
                                                        {slot.participants} participants
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    slot.status === 'confirmed'
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300'
                                                }`}>
                                                    {slot.status === 'confirmed' ? 'Confirmé' : 'En attente'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex items-center justify-end gap-2">
                                                    {slot.status === 'confirmed' && slot.participants && slot.participants > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                setSelectedSlotForMessage(slot);
                                                                setShowMessageModal(true);
                                                            }}
                                                            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center gap-1"
                                                            title="Envoyer un message aux participants"
                                                        >
                                                            <MessageSquare className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300">
                                                        Voir
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Modal créer créneau privé */}
                {showCreateSlot && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowCreateSlot(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">Créer un créneau privé</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Heure de début
                                        </label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            Heure de fin
                                        </label>
                                        <input
                                            type="time"
                                            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Type de séance
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sessionType"
                                                value="in-person"
                                                defaultChecked
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">À domicile</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="sessionType"
                                                value="online"
                                                className="w-4 h-4 text-indigo-600"
                                            />
                                            <Video className="w-4 h-4 text-indigo-500" />
                                            <span className="text-sm text-slate-700 dark:text-slate-300">En ligne (visio)</span>
                                        </label>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Lieu / Lien visio
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Adresse ou lien de visioconférence"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowCreateSlot(false)}
                                        mode="club"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            // TODO: Implémenter la création
                                            setShowCreateSlot(false);
                                        }}
                                        mode="club"
                                    >
                                        Créer le créneau
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal envoyer message aux participants */}
                {showMessageModal && selectedSlotForMessage && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowMessageModal(false)}>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
                            <h3 className="text-lg font-semibold mb-4 text-slate-900 dark:text-white">
                                Envoyer un message aux participants
                            </h3>
                            <div className="space-y-4">
                                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                                    <p className="text-sm font-medium text-slate-900 dark:text-white mb-1">
                                        {selectedSlotForMessage.club || selectedSlotForMessage.student}
                                    </p>
                                    <p className="text-xs text-slate-600 dark:text-slate-400">
                                        {selectedSlotForMessage.date} • {selectedSlotForMessage.startTime} - {selectedSlotForMessage.endTime}
                                    </p>
                                    {selectedSlotForMessage.participants && (
                                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                                            {selectedSlotForMessage.participants} participant{selectedSlotForMessage.participants > 1 ? 's' : ''}
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                        Message
                                    </label>
                                    <textarea
                                        rows={4}
                                        placeholder="Votre message sera envoyé à tous les participants de cette séance..."
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                </div>
                                <div className="flex items-center justify-end gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        onClick={() => {
                                            setShowMessageModal(false);
                                            setSelectedSlotForMessage(null);
                                        }}
                                        mode="club"
                                    >
                                        Annuler
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            // TODO: Implémenter l'envoi de message
                                            setShowMessageModal(false);
                                            setSelectedSlotForMessage(null);
                                        }}
                                        mode="club"
                                    >
                                        <MessageSquare className="w-4 h-4 mr-2" />
                                        Envoyer
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal indisponibilité - TODO: Implémenter */}
                {showUnavailability && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full mx-4">
                            <h3 className="text-lg font-semibold mb-4">Déclarer une indisponibilité</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                Fonctionnalité à implémenter
                            </p>
                            <Button onClick={() => setShowUnavailability(false)} mode="club">
                                Fermer
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Layout>
    );
};

export default PlanningPage;

