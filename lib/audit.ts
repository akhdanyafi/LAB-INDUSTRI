import { headers } from 'next/headers';
import { getSession } from '@/lib/auth';

type AuditStatus = 'success' | 'failed';

type AuditActor = {
    identifier?: string | null;
    fullName?: string | null;
    email?: string | null;
    role?: string | null;
};

export type AuditLogInput = {
    module: string;
    action: string;
    entityType?: string;
    entityId?: string | number | null;
    status?: AuditStatus;
    description?: string;
    metadata?: unknown;
    actor?: AuditActor;
};

async function getRequestHeaders() {
    try {
        return await headers();
    } catch {
        return null;
    }
}

function getClientIp(requestHeaders: Awaited<ReturnType<typeof getRequestHeaders>>) {
    const forwardedFor = requestHeaders?.get('x-forwarded-for');
    if (forwardedFor) return forwardedFor.split(',')[0]?.trim() || null;

    return (
        requestHeaders?.get('x-real-ip') ||
        requestHeaders?.get('cf-connecting-ip') ||
        null
    );
}

export function getErrorMessage(error: unknown) {
    return error instanceof Error ? error.message : String(error);
}

export async function writeActivityLog(input: AuditLogInput) {
    try {
        const [session, requestHeaders] = await Promise.all([
            input.actor ? Promise.resolve(null) : getSession().catch(() => null),
            getRequestHeaders(),
        ]);

        const actor = input.actor ?? session?.user ?? {};
        const ip = getClientIp(requestHeaders);
        const userAgent = requestHeaders?.get('user-agent') ?? null;

        // Output ke stdout/stderr agar terbaca via pm2 logs (raw, tidak disanitasi)
        const logEntry = {
            ts: new Date().toISOString(),
            module: input.module,
            action: input.action,
            status: input.status ?? 'success',
            actor: {
                id: actor.identifier ?? null,
                name: actor.fullName ?? null,
                email: actor.email ?? null,
                role: actor.role ?? null,
            },
            entityType: input.entityType ?? null,
            entityId: input.entityId != null ? String(input.entityId) : null,
            description: input.description ?? null,
            metadata: input.metadata ?? null,
            ip,
        };
        if (input.status === 'failed') {
            console.error('[AUDIT]', JSON.stringify(logEntry));
        } else {
            console.log('[AUDIT]', JSON.stringify(logEntry));
        }
    } catch (error) {
        console.error('[audit] Failed to write activity log:', error);
    }
}

export async function auditAction<T>(input: AuditLogInput, action: () => Promise<T>): Promise<T> {
    try {
        const result = await action();
        await writeActivityLog({ ...input, status: input.status ?? 'success' });
        return result;
    } catch (error) {
        await writeActivityLog({
            ...input,
            status: 'failed',
            metadata: { input: input.metadata, error: getErrorMessage(error) },
        });
        throw error;
    }
}
