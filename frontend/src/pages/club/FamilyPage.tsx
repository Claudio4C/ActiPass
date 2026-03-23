import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, UserPlus, Baby, X } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';

interface ChildMembership {
    id: string;
    organisation: { id: string; name: string; type: string };
    role: { name: string; type: string };
    status: string;
}

interface Child {
    id: string;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    gender: string | null;
    phone: string | null;
    relationship: string;
    is_primary_contact: boolean;
    memberships: ChildMembership[];
}

interface Organisation {
    id: string;
    name: string;
    type: string;
}

const getAge = (birthdate: string | null): string => {
    if (!birthdate) return '—';
    const diff = Date.now() - new Date(birthdate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365))} ans`;
};

const genderLabel = (g: string | null) =>
    g === 'male' ? 'Garçon' : g === 'female' ? 'Fille' : '—';

const FamilyPage: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editChild, setEditChild] = useState<Child | null>(null);
    const [enrollChild, setEnrollChild] = useState<Child | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [form, setForm] = useState({
        firstname: '',
        lastname: '',
        birthdate: '',
        gender: 'male' as 'male' | 'female' | 'prefer_not_to_say',
        phone: '',
    });
    const [enrollOrgId, setEnrollOrgId] = useState('');

    const load = async () => {
        try {
            const [kids, orgs] = await Promise.all([
                api.get<Child[]>('/family/children'),
                api.get<{ organisations: Organisation[] }>('/users/me/organisations').then(r => r.organisations).catch(() => []),
            ]);
            setChildren(kids);
            setOrganisations(orgs);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditChild(null);
        setForm({ firstname: '', lastname: '', birthdate: '', gender: 'male', phone: '' });
        setShowModal(true);
    };

    const openEdit = (child: Child) => {
        setEditChild(child);
        setForm({
            firstname: child.firstname,
            lastname: child.lastname,
            birthdate: child.birthdate ? child.birthdate.slice(0, 10) : '',
            gender: (child.gender as 'male' | 'female' | 'prefer_not_to_say') || 'male',
            phone: child.phone || '',
        });
        setShowModal(true);
    };

    const submit = async () => {
        setSubmitting(true);
        try {
            if (editChild) {
                await api.patch(`/family/children/${editChild.id}`, form);
            } else {
                await api.post('/family/children', form);
            }
            setShowModal(false);
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    const remove = async (childId: string) => {
        try {
            await api.delete(`/family/children/${childId}`);
            setDeleteConfirm(null);
            await load();
        } catch (e) {
            console.error(e);
        }
    };

    const enroll = async () => {
        if (!enrollChild || !enrollOrgId) return;
        setSubmitting(true);
        try {
            await api.post(`/family/children/${enrollChild.id}/memberships`, { organisation_id: enrollOrgId });
            setEnrollChild(null);
            setEnrollOrgId('');
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout title="Ma famille" subtitle="Gérez les profils de vos enfants" mode="club">
            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Baby className="h-7 w-7 text-pink-500" />
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Ma famille</h1>
                            <p className="text-sm text-slate-500">{children.length} enfant{children.length !== 1 ? 's' : ''} enregistré{children.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 rounded-xl bg-pink-500 px-4 py-2 text-sm font-medium text-white hover:bg-pink-600 transition"
                    >
                        <Plus className="h-4 w-4" />
                        Ajouter un enfant
                    </button>
                </div>

                {loading ? (
                    <div className="text-center py-20 text-slate-400">Chargement…</div>
                ) : children.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center">
                        <Baby className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                        <p className="text-slate-500 dark:text-slate-400">Aucun enfant enregistré pour le moment.</p>
                        <button onClick={openCreate} className="mt-4 text-sm text-pink-500 hover:underline">
                            Ajouter mon premier enfant
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 sm:grid-cols-2">
                        {children.map(child => (
                            <div key={child.id} className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-sm space-y-3">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="font-semibold text-slate-800 dark:text-white text-lg">
                                            {child.firstname} {child.lastname}
                                        </p>
                                        <p className="text-sm text-slate-500">{genderLabel(child.gender)} · {getAge(child.birthdate)}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => openEdit(child)} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500">
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button onClick={() => setDeleteConfirm(child.id)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                {child.memberships.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {child.memberships.map(m => (
                                            <span key={m.id} className="text-xs rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-3 py-1">
                                                {m.organisation.name}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs text-slate-400">Non inscrit dans un club</p>
                                )}

                                {deleteConfirm === child.id ? (
                                    <div className="rounded-xl bg-red-50 dark:bg-red-900/20 p-3 text-sm text-red-600 dark:text-red-300 flex items-center justify-between">
                                        <span>Supprimer ce profil ?</span>
                                        <div className="flex gap-2">
                                            <button onClick={() => remove(child.id)} className="font-medium hover:underline">Oui</button>
                                            <button onClick={() => setDeleteConfirm(null)} className="text-slate-500 hover:underline">Annuler</button>
                                        </div>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => { setEnrollChild(child); setEnrollOrgId(''); }}
                                        className="flex items-center gap-2 text-xs text-indigo-500 hover:text-indigo-700 font-medium"
                                    >
                                        <UserPlus className="h-3.5 w-3.5" />
                                        Inscrire dans un club
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal création / édition */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editChild ? 'Modifier le profil' : 'Ajouter un enfant'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <input
                                className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                                placeholder="Prénom *"
                                value={form.firstname}
                                onChange={e => setForm(f => ({ ...f, firstname: e.target.value }))}
                            />
                            <input
                                className="col-span-1 rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                                placeholder="Nom *"
                                value={form.lastname}
                                onChange={e => setForm(f => ({ ...f, lastname: e.target.value }))}
                            />
                        </div>
                        <input
                            type="date"
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                            value={form.birthdate}
                            onChange={e => setForm(f => ({ ...f, birthdate: e.target.value }))}
                        />
                        <select
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                            value={form.gender}
                            onChange={e => setForm(f => ({ ...f, gender: e.target.value as 'male' | 'female' | 'prefer_not_to_say' }))}
                        >
                            <option value="male">Garçon</option>
                            <option value="female">Fille</option>
                            <option value="prefer_not_to_say">Non précisé</option>
                        </select>
                        <input
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-pink-300"
                            placeholder="Téléphone (optionnel)"
                            value={form.phone}
                            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                        />
                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={submit}
                                disabled={submitting || !form.firstname || !form.lastname}
                                className="flex-1 rounded-xl bg-pink-500 py-2 text-sm font-medium text-white hover:bg-pink-600 disabled:opacity-50"
                            >
                                {submitting ? 'Enregistrement…' : editChild ? 'Modifier' : 'Ajouter'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal inscription club */}
            {enrollChild && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-800 p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                                Inscrire {enrollChild.firstname}
                            </h2>
                            <button onClick={() => setEnrollChild(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <select
                            className="w-full rounded-xl border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-300"
                            value={enrollOrgId}
                            onChange={e => setEnrollOrgId(e.target.value)}
                        >
                            <option value="">Choisir un club…</option>
                            {organisations.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setEnrollChild(null)}
                                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-600 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={enroll}
                                disabled={submitting || !enrollOrgId}
                                className="flex-1 rounded-xl bg-indigo-500 py-2 text-sm font-medium text-white hover:bg-indigo-600 disabled:opacity-50"
                            >
                                {submitting ? 'Inscription…' : 'Inscrire'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default FamilyPage;
