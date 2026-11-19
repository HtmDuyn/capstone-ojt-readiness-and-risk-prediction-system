import { lazy } from 'react';

export const BaseLayout = lazy(() => import('@/layouts/BaseLayout').then(({ BaseLayout }) => ({ default: BaseLayout })));
