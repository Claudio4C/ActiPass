import React from 'react';

type StoredOrganisation = {
    id?: string;
    name?: string;
    subtitle?: string;
    description?: string;
    role?: 'membre' | 'coach' | 'gestionnaire' | 'independant';
    type?: 'club' | 'association' | 'independant';
};

export type OrganisationRole = 'member' | 'coach' | 'manager' | 'freelance';

export interface OrganisationMetadata {
    title: string;
    subtitle: string;
    heroTitle: string;
    heroDescription: string;
}

const defaultMetadata: OrganisationMetadata = {
    title: 'Mon espace club',
    subtitle: 'Espace membres officiel de votre organisation sportive.',
    heroTitle: "Bienvenue dans votre espace",
    heroDescription:
        "Retrouvez l’ensemble de vos informations : planning d’entraînement, professeurs, actualités et services réservés aux membres.",
};

const independentMetadata: OrganisationMetadata = {
    title: 'Studio indépendant',
    subtitle: 'Publiez vos disponibilités privées et gérez vos clients.',
    heroTitle: 'Coach indépendant',
    heroDescription:
        'Pilotez vos cours privés, votre agenda visio/à domicile et vos échanges avec les clubs intéressés par votre profil.',
};

const getMetadata = (organisation: StoredOrganisation | null): OrganisationMetadata => {
    if (!organisation) return defaultMetadata;
    if (organisation.role === 'independant') {
        return {
            title: organisation.name ?? independentMetadata.title,
            subtitle: organisation.subtitle ?? independentMetadata.subtitle,
            heroTitle: organisation.name ? `Studio ${organisation.name}` : independentMetadata.heroTitle,
            heroDescription: organisation.description ?? independentMetadata.heroDescription,
        };
    }
    return {
        title: organisation.name ?? defaultMetadata.title,
        subtitle: organisation.subtitle ?? defaultMetadata.subtitle,
        heroTitle: organisation.name ? `Bienvenue chez ${organisation.name}` : defaultMetadata.heroTitle,
        heroDescription: organisation.description ?? defaultMetadata.heroDescription,
    };
};

const mapRole = (role?: StoredOrganisation['role']): OrganisationRole => {
    if (role === 'coach') return 'coach';
    if (role === 'gestionnaire') return 'manager';
    if (role === 'independant') return 'freelance';
    return 'member';
};

const readOrganisation = (): { organisation: StoredOrganisation | null; metadata: OrganisationMetadata; role: OrganisationRole } => {
    if (typeof window === 'undefined') {
        return { organisation: null, metadata: defaultMetadata, role: 'member' };
    }
    try {
        const raw = window.localStorage.getItem('selectedOrganisation');
        if (!raw) {
            return { organisation: null, metadata: defaultMetadata, role: 'member' };
        }
        const parsed = JSON.parse(raw) as StoredOrganisation | null;
        if (!parsed) {
            return { organisation: null, metadata: defaultMetadata, role: 'member' };
        }
        const metadata = getMetadata(parsed);
        return {
            organisation: parsed,
            metadata,
            role: mapRole(parsed.role),
        };
    } catch (error) {
        console.error('Impossible de lire selectedOrganisation', error);
        return { organisation: null, metadata: defaultMetadata, role: 'member' };
    }
};

export const useCurrentOrganisation = (): {
    organisation: StoredOrganisation | null;
    role: OrganisationRole;
    metadata: OrganisationMetadata;
    refresh: () => void;
} => {
    const [{ organisation, metadata, role }, setState] = React.useState(() => readOrganisation());

    const refresh = React.useCallback(() => {
        setState(readOrganisation());
    }, []);

    React.useEffect(() => {
        const handler = () => refresh();
        window.addEventListener('storage', handler);
        window.addEventListener('organisation:updated', handler);
        return () => {
            window.removeEventListener('storage', handler);
            window.removeEventListener('organisation:updated', handler);
        };
    }, [refresh]);

    return { organisation, role, metadata, refresh };
};


