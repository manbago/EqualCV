import { flag } from 'flags/next';

export const showGenericLogo = flag<boolean>({
    key: 'showGenericLogo',
    decide: () => {
        // Read from environment variable, default to false
        const value = process.env.SHOW_GENERIC_LOGO;
        return value === 'true';
    },
});


