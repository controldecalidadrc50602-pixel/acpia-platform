
import { createClient } from '@supabase/supabase-js';
import { getAppSettings } from './storageService';

// Creamos una variable fuera para guardar la conexión
let supabaseInstance: any = null;

export const getSupabase = () => {
    // Si ya existe la conexión, la devolvemos sin crear una nueva
    if (supabaseInstance) return supabaseInstance;

    const settings = getAppSettings();
    const url = settings.supabaseUrl || import.meta.env.VITE_SUPABASE_URL;
    const key = settings.supabaseKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (url && key && url.toString().startsWith('http')) {
        // Guardamos la conexión en la variable
        supabaseInstance = createClient(url, key);
        return supabaseInstance;
    }
    return null;
};

// ... el resto de tu código de checkCloudConnection y cloudSync sigue igual ...
    
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
