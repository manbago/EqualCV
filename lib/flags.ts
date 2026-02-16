import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const new_showPhotoStatus = flag<boolean>({
    key: 'new_showPhotoStatus',
    adapter: vercelAdapter(),
});

export const showGenericLogo = flag<boolean>({
    key: 'showGenericLogo',
    adapter: vercelAdapter(),
});


