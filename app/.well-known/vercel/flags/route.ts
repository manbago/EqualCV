import { createFlagsDiscoveryEndpoint } from 'flags/next';
import { getProviderData } from '@flags-sdk/vercel';
import * as flags from '../../../../lib/flags';

export const dynamic = 'force-dynamic';

export const GET = createFlagsDiscoveryEndpoint(async (request) => {
    return getProviderData(flags);
});
