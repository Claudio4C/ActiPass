import React from 'react';
import type { RoleType } from '../../types';

interface PermissionGuardProps {
    children: React.ReactNode;
    allowedRoles: RoleType[];
    currentRole: RoleType | null;
    fallback?: React.ReactNode;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
    children,
    allowedRoles,
    currentRole,
    fallback = null
}) => {
    if (!currentRole || !allowedRoles.includes(currentRole)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
};

export default PermissionGuard;

