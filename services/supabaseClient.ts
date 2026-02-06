import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
export const supabase = createClient(url, key);

export const cloudSync = {
    async push(table: string, data: any) {
        // Limpiamos los datos para enviar solo lo que existe en la tabla
        let cleanData: any = { ...data, organization_id: 'acpia-pilot' };
        if (table === 'users') cleanData = { id: data.id, name: data.name, role: data.role, pin: data.pin, organization_id: 'acpia-pilot' };
        
        const { error } = await supabase.from(table).upsert(cleanData);
        if (error) console.error("Error Supabase:", error.message);
    },
    async pull(table: string) {
        const { data } = await supabase.from(table).select('*').eq('organization_id', 'acpia-pilot');
        return data;
    }
};
export const checkCloudConnection = async () => true;
