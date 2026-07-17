export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
export const UPDATE_CHECK_COOLDOWN_MS = 60 * 1000;
export const UPDATE_RELOAD_FALLBACK_MS = 4 * 1000;

type UpdateCheckOptions = {
  registration: ServiceWorkerRegistration;
  fetcher?: typeof fetch;
};

type UpdateTriggerOptions = {
  check: () => void;
  intervalMs?: number;
};

type ActivateUpdateOptions = {
  worker: ServiceWorker;
  reload?: () => void;
  serviceWorkerContainer?: Pick<ServiceWorkerContainer, 'addEventListener' | 'removeEventListener'>;
};

export const shouldCheckForUpdate = (
  now: number,
  lastCheckAt: number,
  cooldownMs = UPDATE_CHECK_COOLDOWN_MS
) => lastCheckAt === 0 || now - lastCheckAt >= cooldownMs;

export const checkForServiceWorkerUpdate = async ({
  registration,
  fetcher = fetch,
}: UpdateCheckOptions): Promise<void> => {
  const response = await fetcher('/sw.js', {
    cache: 'no-store',
    headers: {'cache-control': 'no-cache'},
  });
  if (!response.ok) throw new Error('Service worker is unavailable');
  await registration.update();
};

export const installUpdateCheckTriggers = ({
  check,
  intervalMs = UPDATE_CHECK_INTERVAL_MS,
}: UpdateTriggerOptions) => {
  const checkWhenVisible = () => {
    if (document.visibilityState === 'visible' && navigator.onLine) check();
  };
  const intervalId = window.setInterval(checkWhenVisible, intervalMs);

  document.addEventListener('visibilitychange', checkWhenVisible);
  window.addEventListener('focus', checkWhenVisible);
  window.addEventListener('online', checkWhenVisible);
  window.addEventListener('pageshow', checkWhenVisible);

  return () => {
    window.clearInterval(intervalId);
    document.removeEventListener('visibilitychange', checkWhenVisible);
    window.removeEventListener('focus', checkWhenVisible);
    window.removeEventListener('online', checkWhenVisible);
    window.removeEventListener('pageshow', checkWhenVisible);
  };
};

export const activateWaitingServiceWorker = ({
  worker,
  reload = () => window.location.reload(),
  serviceWorkerContainer = navigator.serviceWorker,
}: ActivateUpdateOptions) => {
  let finished = false;
  const finish = () => {
    if (finished) return;
    finished = true;
    window.clearTimeout(fallback);
    serviceWorkerContainer.removeEventListener('controllerchange', finish);
    worker.removeEventListener('statechange', onStateChange);
    reload();
  };
  const onStateChange = () => {
    if (worker.state === 'activated') finish();
  };
  const fallback = window.setTimeout(finish, UPDATE_RELOAD_FALLBACK_MS);

  serviceWorkerContainer.addEventListener('controllerchange', finish);
  worker.addEventListener('statechange', onStateChange);
  worker.postMessage({type: 'SKIP_WAITING'});
};
