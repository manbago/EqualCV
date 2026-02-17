'use server';

import { supabase } from '@/lib/supabase';

export async function logFileProcessed(filename: string) {
    try {
        const { error } = await supabase
            .from('processed_files')
            .insert([
                {
                    filename,
                    processed_at: new Date().toISOString(),
                },
            ]);

        if (error) {
            console.error('Error logging file processing:', error);
            // We return success: false but don't throw to avoid breaking the UI flow
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (error) {
        console.error('Failed to log file processing:', error);
        return { success: false, error: 'Unexpected error' };
    }
}
