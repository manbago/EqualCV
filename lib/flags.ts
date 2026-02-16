import { flag } from 'flags/next';

export const new_showPhotoStatus = flag({
    key: 'new_showPhotoStatus',
    decide: () => {
        return false;
    },
});


