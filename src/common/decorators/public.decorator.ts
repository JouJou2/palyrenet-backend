import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);
