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
            throw error;
        }
    } catch (error) {
        console.error('Failed to log file processing:', error);
        // We don't want to fail the user request if logging fails, so we just log the error
    }
}
