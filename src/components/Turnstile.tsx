'use client';

import { Turnstile as ReactTurnstile } from '@marsidev/react-turnstile';
import { forwardRef } from 'react';

type TurnstileProps = {
  onSuccess: (token: string) => void;
  onError: () => void;
};

export const Turnstile = forwardRef<HTMLDivElement, TurnstileProps>(
  ({ onSuccess, onError }, ref) => {
    const siteKey = process.env.NEXT_PUBLIC_CLOUDFLARE_TURNSTILE_SITE_KEY;

    if (!siteKey) {
      console.error('Cloudflare Turnstile site key is not configured.');
      return null;
    }

    return (
      <div ref={ref} style={{ display: 'none' }}>
        <ReactTurnstile
          siteKey={siteKey}
          onSuccess={onSuccess}
          onError={onError}
          options={{
            theme: 'dark',
            execution: 'render',
          }}
        />
      </div>
    );
  }
);

Turnstile.displayName = 'Turnstile';
