import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const showGenericLogo = flag({
    key: 'showGenericLogo',
    description: 'Whether to show the generic logo instead of the branded one',
    options: [
        { label: 'Branded', value: false },
        { label: 'Generic', value: true },
    ],
    adapter: vercelAdapter(),
    decide: () => {
        // Fallback logic for local development
        return process.env.SHOW_GENERIC_LOGO === 'true';
    },
});

export const new_showPhotoStatus = flag({
    key: 'new_showPhotoStatus',
    description: 'Show the photo detection status in the UI',
    options: [
        { label: 'Hide', value: false },
        { label: 'Show', value: true },
    ],
    adapter: vercelAdapter(),
    decide: () => {
        // Aquí puedes poner lógica personalizada o simplemente un valor por defecto
        return false;
    },
});

