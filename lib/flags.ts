import { flag } from 'flags/next';

export const showGenericLogo = flag({
    key: 'showGenericLogo',
    decide: () => {
        // Fallback logic for local development
        return process.env.SHOW_GENERIC_LOGO === 'true';
    },
});

export const new_showPhotoStatus = flag({
    key: 'new_showPhotoStatus',
    decide: () => {
        // Aquí puedes poner lógica personalizada o simplemente un valor por defecto
        return false;
    },
});

