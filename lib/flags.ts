import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const showGenericLogo = flag<boolean>({
    key: 'ShowGenericLogo',
    adapter: vercelAdapter(),
    options: [
        { value: true, label: 'Generic Logo' },
        { value: false, label: 'Custom logo.png' },
    ],
    description: 'Toggle between generic placeholder and custom logo.png in the PDF header',
    decide() {
        // Fallback logic for local development
        return process.env.SHOW_GENERIC_LOGO === 'true';
    },
});
