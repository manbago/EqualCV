import { flag } from '@vercel/flags/next';

export const showGenericLogo = flag({
    key: 'ShowGenericLogo',
    decide() {
        return process.env.SHOW_GENERIC_LOGO === 'true';
    },
});
