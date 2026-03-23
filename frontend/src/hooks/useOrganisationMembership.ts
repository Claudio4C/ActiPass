import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import type { RoleType } from '../types';

interface ApiOrganisationMembership {
    organisation: {
        id: string;
        name: string;
        type: string | null;
        description: string | null;
    };
    role: {
        id: string;
        name: string;
        type: RoleType;
        level: number;
    };
    joined_at: string;
    status: 'pending' | 'active' | 'banned';
}

interface MembershipResult {
    roleType: RoleType | null;
    roleName: string | null;
    loading: boolean;
    error: string | null;
}

export const useOrganisationMembership = (organisationId: string | undefined): MembershipResult => {
    const [roleType, setRoleType] = useState<RoleType | null>(null);
    const [roleName, setRoleName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!organisationId) {
            setLoading(false);
            return;
        }

        const load = async () => {
            try {
                setLoading(true);
                const memberships = await api.get<ApiOrganisationMembership[]>(
                    '/organisations/my',
                    {},
                    { useCache: true, cacheTTL: 60000 }
                );
                const found = memberships.find(m => m.organisation.id === organisationId);
                if (found) {
                    setRoleType(found.role.type);
                    setRoleName(found.role.name);
                } else {
                    setRoleType(null);
                    setRoleName(null);
                }
                setError(null);
            } catch {
                setError('Impossible de charger les droits');
                setRoleType(null);
                setRoleName(null);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [organisationId]);

    return { roleType, roleName, loading, error };
};
