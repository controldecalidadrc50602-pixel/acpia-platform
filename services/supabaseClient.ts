import { createClient } from '@supabase/supabase-js';
import { getAppSettings } from './storageService';

// 1. Singleton: Variable para guardar la conexión y evitar el aviso de "Multiple instances"
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

// 2. Función para verificar la conexión
export const checkCloudConnection = async (): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) return false;
    
    try {
        const { error, status } = await supabase
            .from('agents')
            .select('id')
            .limit(1);

        if (error) {
            // PGRST116 significa tabla vacía, lo cual es éxito de conexión
            if (error.code === 'PGRST116' || status === 200) return true;
            return false;
        }
        return true;
    } catch (e) {
        console.error("Supabase Critical Error:", e);
        return false;
    }
};

// 3. Objeto de sincronización
export const cloudSync = {
    async push(table: string, data: any) {
        const supabase = getSupabase();
        if (!supabase) return;
        
        // Limpiamos los datos para evitar el Error 400
        // Solo enviamos los campos que existen en tus tablas de Supabase
        let cleanData: any = {};
        
        if (table === 'users') {
            cleanData = {
                id: data.id,
                name: data.name,
                role: data.role,
                pin: data.pin,
                organization_id: 'acpia-pilot'
            };
        } else {
            // Para otras tablas, enviamos todo pero aseguramos el organization_id
            cleanData = { ...data, organization_id: 'acpia-pilot' };
        }
        
        try {
            const { error } = await supabase.from(table).upsert(cleanData);
            if (error) throw error;
        } catch (e) {
            console.error(`Sync Push Error [${table}]:`, e);
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
            console.error(`Sync Pull Error [${table}]:`, e);
            return null;
        }
    },

    async delete(table: string, id: string) {
        const supabase = getSupabase();
        if (!supabase) return;
        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;
        } catch (e) {
            console.error(`Sync Delete Error [${table}]:`, e);
        }
    }
};
