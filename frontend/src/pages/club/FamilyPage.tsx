import React, { useState, useEffect } from 'react';
import { Users, Plus, Pencil, Trash2, UserCheck, X, AlertCircle, Baby } from 'lucide-react';
import Layout from '../../components/layout/Layout';
import { api } from '../../lib/api';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ChildMembership {
    id: string;
    organisation: { id: string; name: string; type: string };
    role: { name: string; type: string };
    status: string;
    joined_at: string;
}

interface Child {
    id: string;
    firstname: string;
    lastname: string;
    birthdate: string | null;
    gender: 'male' | 'female' | 'prefer_not_to_say';
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

type ModalMode = 'create' | 'edit' | 'enroll' | null;

interface ChildForm {
    firstname: string;
    lastname: string;
    birthdate: string;
    gender: 'male' | 'female' | 'prefer_not_to_say';
    phone: string;
}

const EMPTY_FORM: ChildForm = {
    firstname: '',
    lastname: '',
    birthdate: '',
    gender: 'prefer_not_to_say',
    phone: '',
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function calcAge(birthdate: string | null): string {
    if (!birthdate) return '—';
    const diff = Date.now() - new Date(birthdate).getTime();
    return `${Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25))} ans`;
}

function genderLabel(g: string): string {
    if (g === 'male') return 'Garçon';
    if (g === 'female') return 'Fille';
    return 'Non précisé';
}

// ── Component ─────────────────────────────────────────────────────────────────

const FamilyPage: React.FC = () => {
    const [children, setChildren] = useState<Child[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [modal, setModal] = useState<ModalMode>(null);
    const [selectedChild, setSelectedChild] = useState<Child | null>(null);
    const [form, setForm] = useState<ChildForm>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [organisations, setOrganisations] = useState<Organisation[]>([]);
    const [enrollOrgId, setEnrollOrgId] = useState<string>('');
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

    useEffect(() => {
        void loadChildren();
        void loadOrganisations();
    }, []);

    const loadChildren = async () => {
        try {
            setLoading(true);
            const data = await api.get<Child[]>('/family/children');
            setChildren(data);
        } catch (err) {
            setError('Impossible de charger la liste des enfants');
        } finally {
            setLoading(false);
        }
    };

    const loadOrganisations = async () => {
        try {
            const memberships = await api.get<{ organisation: Organisation }[]>('/organisations/my');
            setOrganisations(memberships.map((m) => m.organisation));
        } catch {
            // silently fail — list used only for enrollment
        }
    };

    const openCreate = () => {
        setSelectedChild(null);
        setForm(EMPTY_FORM);
        setFormError(null);
        setModal('create');
    };

    const openEdit = (child: Child) => {
        setSelectedChild(child);
        setForm({
            firstname: child.firstname,
            lastname: child.lastname,
            birthdate: child.birthdate ? child.birthdate.split('T')[0] : '',
            gender: child.gender,
            phone: child.phone ?? '',
        });
        setFormError(null);
        setModal('edit');
    };

    const openEnroll = (child: Child) => {
        setSelectedChild(child);
        setEnrollOrgId('');
        setFormError(null);
        setModal('enroll');
    };

    const closeModal = () => {
        setModal(null);
        setSelectedChild(null);
        setFormError(null);
    };

    const handleSaveChild = async () => {
        if (!form.firstname.trim() || !form.lastname.trim() || !form.birthdate) {
            setFormError('Prénom, nom et date de naissance sont obligatoires');
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            const payload = {
                firstname: form.firstname.trim(),
                lastname: form.lastname.trim(),
                birthdate: form.birthdate,
                gender: form.gender,
                ...(form.phone.trim() && { phone: form.phone.trim() }),
            };
            if (modal === 'create') {
                const child = await api.post<Child>('/family/children', payload);
                setChildren((prev) => [...prev, child]);
            } else if (modal === 'edit' && selectedChild) {
                const child = await api.patch<Child>(`/family/children/${selectedChild.id}`, payload);
                setChildren((prev) => prev.map((c) => (c.id === child.id ? child : c)));
            }
            closeModal();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Une erreur est survenue';
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleEnroll = async () => {
        if (!enrollOrgId || !selectedChild) {
            setFormError('Veuillez sélectionner une organisation');
            return;
        }
        setSaving(true);
        setFormError(null);
        try {
            await api.post(`/family/children/${selectedChild.id}/memberships`, {
                organisation_id: enrollOrgId,
            });
            await loadChildren();
            closeModal();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : 'Inscription échouée';
            setFormError(msg);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (childId: string) => {
        try {
            await api.delete(`/family/children/${childId}`);
            setChildren((prev) => prev.filter((c) => c.id !== childId));
            setDeleteConfirmId(null);
        } catch {
            // silently — could add toast
        }
    };

    return (
        <Layout
            title="Ma famille"
            subtitle="Gérez les comptes de vos enfants et leurs inscriptions aux clubs."
            mode="club"
        >
            {/* Header ─────────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-900/30">
                        <Users className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Enfants rattachés
                        </h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400">
                            {children.length} enfant{children.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={openCreate}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-medium transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Ajouter un enfant
                </button>
            </div>

            {/* Content ────────────────────────────────────────────────────── */}
            {loading ? (
                <div className="text-center py-16 text-gray-400 dark:text-slate-500">
                    Chargement...
                </div>
            ) : error ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400">
                    <AlertCircle className="h-5 w-5 shrink-0" />
                    {error}
                </div>
            ) : children.length === 0 ? (
                <div className="text-center py-20 flex flex-col items-center gap-4">
                    <Baby className="h-12 w-12 text-gray-300 dark:text-slate-600" />
                    <p className="text-gray-500 dark:text-slate-400 font-medium">
                        Aucun enfant rattaché pour l'instant
                    </p>
                    <p className="text-sm text-gray-400 dark:text-slate-500">
                        Cliquez sur "Ajouter un enfant" pour créer un profil enfant.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {children.map((child) => (
                        <ChildCard
                            key={child.id}
                            child={child}
                            onEdit={openEdit}
                            onEnroll={openEnroll}
                            onDelete={(id) => setDeleteConfirmId(id)}
                            confirmDeleteId={deleteConfirmId}
                            onConfirmDelete={handleDelete}
                            onCancelDelete={() => setDeleteConfirmId(null)}
                        />
                    ))}
                </div>
            )}

            {/* Modal ──────────────────────────────────────────────────────── */}
            {(modal === 'create' || modal === 'edit') && (
                <Modal title={modal === 'create' ? 'Ajouter un enfant' : 'Modifier l\'enfant'} onClose={closeModal}>
                    <ChildForm
                        form={form}
                        onChange={setForm}
                        error={formError}
                        saving={saving}
                        onSubmit={handleSaveChild}
                        onCancel={closeModal}
                        submitLabel={modal === 'create' ? 'Créer le profil' : 'Enregistrer'}
                    />
                </Modal>
            )}

            {modal === 'enroll' && selectedChild && (
                <Modal title={`Inscrire ${selectedChild.firstname} dans un club`} onClose={closeModal}>
                    <div className="space-y-4">
                        {formError && (
                            <p className="text-sm text-red-600 dark:text-red-400">{formError}</p>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">
                                Organisation
                            </label>
                            {organisations.length === 0 ? (
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    Vous n'êtes membre d'aucune organisation.
                                </p>
                            ) : (
                                <select
                                    value={enrollOrgId}
                                    onChange={(e) => setEnrollOrgId(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                                >
                                    <option value="">Sélectionner une organisation</option>
                                    {organisations.map((o) => (
                                        <option key={o.id} value={o.id}>{o.name}</option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <div className="flex justify-end gap-3 pt-2">
                            <button
                                onClick={closeModal}
                                className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleEnroll}
                                disabled={saving || !enrollOrgId}
                                className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {saving ? 'Inscription...' : 'Inscrire'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Layout>
    );
};

// ── Sub-components ────────────────────────────────────────────────────────────

interface ChildCardProps {
    child: Child;
    onEdit: (child: Child) => void;
    onEnroll: (child: Child) => void;
    onDelete: (id: string) => void;
    confirmDeleteId: string | null;
    onConfirmDelete: (id: string) => void;
    onCancelDelete: () => void;
}

const ChildCard: React.FC<ChildCardProps> = ({
    child, onEdit, onEnroll, onDelete, confirmDeleteId, onConfirmDelete, onCancelDelete,
}) => (
    <div className="rounded-2xl border border-gray-100 dark:border-slate-700/50 bg-white dark:bg-slate-800 p-5 flex flex-col gap-4">
        {/* Identity */}
        <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
                <span className="text-indigo-700 dark:text-indigo-300 font-semibold text-sm">
                    {child.firstname[0]}{child.lastname[0]}
                </span>
            </div>
            <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">
                    {child.firstname} {child.lastname}
                </p>
                <p className="text-xs text-gray-500 dark:text-slate-400">
                    {genderLabel(child.gender)} · {calcAge(child.birthdate)}
                </p>
            </div>
        </div>

        {/* Memberships */}
        <div className="flex-1">
            {child.memberships.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-slate-500 italic">Aucune inscription</p>
            ) : (
                <div className="flex flex-wrap gap-1.5">
                    {child.memberships.map((m) => (
                        <span
                            key={m.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs"
                        >
                            {m.organisation.name}
                        </span>
                    ))}
                </div>
            )}
        </div>

        {/* Actions */}
        {confirmDeleteId === child.id ? (
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-red-100 dark:border-red-900/30">
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">Confirmer la suppression ?</p>
                <div className="flex gap-2">
                    <button
                        onClick={onCancelDelete}
                        className="px-3 py-1 text-xs rounded-lg border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                    >
                        Non
                    </button>
                    <button
                        onClick={() => onConfirmDelete(child.id)}
                        className="px-3 py-1 text-xs rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors"
                    >
                        Oui, supprimer
                    </button>
                </div>
            </div>
        ) : (
            <div className="flex gap-2 pt-2 border-t border-gray-100 dark:border-slate-700/50">
                <button
                    onClick={() => onEnroll(child)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors font-medium"
                >
                    <UserCheck className="h-3.5 w-3.5" />
                    Inscrire
                </button>
                <button
                    onClick={() => onEdit(child)}
                    className="p-1.5 rounded-xl text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    title="Modifier"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={() => onDelete(child.id)}
                    className="p-1.5 rounded-xl text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    title="Supprimer"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        )}
    </div>
);

interface ModalProps {
    title: string;
    onClose: () => void;
    children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700">
                <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
                <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>
            <div className="p-6">{children}</div>
        </div>
    </div>
);

interface ChildFormProps {
    form: ChildForm;
    onChange: (f: ChildForm) => void;
    error: string | null;
    saving: boolean;
    onSubmit: () => void;
    onCancel: () => void;
    submitLabel: string;
}

const ChildForm: React.FC<ChildFormProps> = ({ form, onChange, error, saving, onSubmit, onCancel, submitLabel }) => {
    const field = (key: keyof ChildForm, value: string) => onChange({ ...form, [key]: value });

    return (
        <div className="space-y-4">
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Prénom *</label>
                    <input
                        type="text"
                        value={form.firstname}
                        onChange={(e) => field('firstname', e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                        placeholder="Prénom"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Nom *</label>
                    <input
                        type="text"
                        value={form.lastname}
                        onChange={(e) => field('lastname', e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                        placeholder="Nom"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Date de naissance *</label>
                    <input
                        type="date"
                        value={form.birthdate}
                        onChange={(e) => field('birthdate', e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Genre</label>
                    <select
                        value={form.gender}
                        onChange={(e) => field('gender', e.target.value)}
                        className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    >
                        <option value="male">Garçon</option>
                        <option value="female">Fille</option>
                        <option value="prefer_not_to_say">Non précisé</option>
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-slate-300 mb-1">Téléphone (optionnel)</label>
                <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => field('phone', e.target.value)}
                    className="w-full border border-gray-200 dark:border-slate-700 rounded-xl px-3 py-2 bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
                    placeholder="+33 6 00 00 00 00"
                />
            </div>

            <div className="flex justify-end gap-3 pt-2">
                <button
                    onClick={onCancel}
                    className="px-4 py-2 text-sm rounded-xl border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                    Annuler
                </button>
                <button
                    onClick={onSubmit}
                    disabled={saving}
                    className="px-4 py-2 text-sm rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors disabled:opacity-50"
                >
                    {saving ? 'Enregistrement...' : submitLabel}
                </button>
            </div>
        </div>
    );
};

export default FamilyPage;
