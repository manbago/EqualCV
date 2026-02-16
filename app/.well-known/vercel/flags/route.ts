import { createFlagsDiscoveryEndpoint, getProviderData } from 'flags/next';
import * as flags from '../../../../lib/flags';

export const dynamic = 'force-dynamic';

export const GET = createFlagsDiscoveryEndpoint(async (request) => {
    const apiData = await getProviderData(flags);
    return apiData;
}, {
    secret: process.env.FLAGS_SECRET,
});

