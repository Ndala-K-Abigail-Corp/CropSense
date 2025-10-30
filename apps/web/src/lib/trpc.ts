import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../../../functions/src';
import { httpBatchLink } from '@trpc/client';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'http://localhost:3000/trpc', // <-- your backend URL
    }),
  ],
});
