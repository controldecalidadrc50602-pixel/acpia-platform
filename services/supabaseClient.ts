import { createClient } from '@supabase/supabase-js';
import { getAppSettings } from './storageService';

let supabaseInstance: any = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
    if (url && key) {
        supabaseInstance = createClient(url, key);
        return supabaseInstance;
    }
    return null;
};

export const cloudSync = {
    async push(table: string, data: any) {
        const sb = getSupabase();
        if (!sb) return;
        // Limpieza para evitar Error 400
        let clean = { ...data, organization_id: 'acpia-pilot' };
        if (table === 'users') clean = { id: data.id, name: data.name, role: data.role, pin: data.pin, organization_id: 'acpia-pilot' };
        if (table === 'audits') clean = { id: data.id, agent_id: data.agentId || data.agent_id, project_id: data.projectId || data.project_id, score: Number(data.score) || 0, notes: data.notes || '', organization_id: 'acpia-pilot' };
        await sb.from(table).upsert(clean);
    },
    async pull(table: string) {
        const sb = getSupabase();
        if (!sb) return null;
        const { data } = await sb.from(table).select('*').eq('organization_id', 'acpia-pilot');
        return data;
    },
    async delete(table: string, id: string) {
        const sb = getSupabase();
        if (sb) await sb.from(table).delete().eq('id', id);
    }
};

export const checkCloudConnection = async () => true;
