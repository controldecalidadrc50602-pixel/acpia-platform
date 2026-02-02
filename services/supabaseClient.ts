
import { createClient } from '@supabase/supabase-js';
import { getAppSettings } from './storageService';

export const getSupabase = () => {
    const settings = getAppSettings();
    // Prioridad a lo guardado en Settings, luego a las variables de entorno
    const url = settings.supabaseUrl || process.env.SUPABASE_URL;
    const key = settings.supabaseKey || process.env.SUPABASE_ANON_KEY;

    if (url && key && url.startsWith('http')) {
        return createClient(url, key);
    }
    return null;
};

export const checkCloudConnection = async (): Promise<boolean> => {
    const supabase = getSupabase();
    if (!supabase) {
        console.warn("Supabase: No hay URL o Key configurada");
        return false;
    }
    
    try {
        // Intentamos una consulta simple a la tabla de agentes
        const { data, error, status } = await supabase
            .from('agents')
            .select('id')
            .limit(1);

        if (error) {
            console.error("Supabase Connection Detail:", {
                message: error.message,
                code: error.code,
                status: status
            });
            
            // Si el error es 'PGRST116' significa que la tabla existe pero está vacía
            // Eso cuenta como CONEXIÓN EXITOSA
            if (error.code === 'PGRST116' || status === 200) return true;
            
            // Si el error dice que la tabla no existe (42P01), es un error de configuración SQL
            return false;
        }

        return true;
    } catch (e) {
        console.error("Supabase Critical Error:", e);
        return false;
    }
};

export const cloudSync = {
    async push(table: string, data: any) {
        const supabase = getSupabase();
        if (!supabase) return;
        
        try {
            const { error } = await supabase.from(table).upsert({
                ...data,
                organization_id: 'acpia-pilot'
            });
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
        await supabase.from(table).delete().eq('id', id);
    }
};
