import { flag } from 'flags/next';
import { vercelAdapter } from '@flags-sdk/vercel';

export const showGenericLogo = flag<boolean>({
    key: 'showGenericLogo',
    adapter: vercelAdapter(),
});


