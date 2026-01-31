import { createClient } from '@supabase/supabase-js';
import { getAppSettings } from './storageService';

// Singleton para evitar múltiples instancias
let supabaseInstance: any = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    const settings = getAppSettings();
    const url = settings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const key = settings.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && key && url.toString().startsWith('http')) {
        supabaseInstance = createClient(url, key);
        return supabaseInstance;
    }
    return null;
};

export const checkCloudConnection = async (): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
        const { error, status } = await supabase
            .from('agents')
            .select('id')
            .limit(1);

        if (error) {
            if (error.code === 'PGRST116' || status === 200) return true;
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
};

export const cloudSync = {
    async push(table: string, data: any) {
        const supabase = getSupabase();
        if (!supabase) return;
        
        let cleanData: any = { organization_id: 'acpia-pilot' };

        if (table === 'users') {
            cleanData = { ...cleanData, id: data.id, name: data.name, role: data.role, pin: data.pin };
        } else if (table === 'projects') {
            cleanData = { ...cleanData, id: data.id, name: data.name, description: data.description };
        } else if (table === 'audits') {
            cleanData = { 
                id: data.id,
                agent_id: data.agentId || data.agent_id || 'unknown',
                project_id: data.projectId || data.project_id || 'unknown',
                score: Number(data.score) || 0,
                csat: Number(data.csat) || 0,
                notes: data.notes || '',
                metadata: data.customData || data.metadata || {},
                organization_id: 'acpia-pilot'
            };
        } else {
            cleanData = { ...data, organization_id: 'acpia-pilot' };
        }

        try {
            const { error } = await supabase.from(table).upsert(cleanData);
            if (error) console.error(`Error en ${table}:`, error.message);
        } catch (e) {
            console.error(`Fallo crítico en ${table}:`, e);
        }
    },

    async pull(table: string) {
        const supabase = getSupabase();
        if (!supabase) return null;
        
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*')
                .eq('organization_id', 'acpia-pilot');
            
            if (error) throw error;
            return data;
        } catch (e) {
            return null;
        }
    },

    async delete(table: string, id: string) {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            await supabase.from(table).delete().eq('id', id);
        } catch (e) {
            console.error(`Error al borrar en ${table}:`, e);
        }
    }
};
