import { APP_ENV, BUILD_ID } from './config';
import { getMeta, setMeta } from './db';

// DEV only: every new deploy (new BUILD_ID) clears the session cooldown, so the teacher can test right
// away after each deploy. PROD never does this.

export function shouldResetCooldown(env: string, lastBuild: string | undefined, buildId: string): boolean {
  return env === 'DEV' && lastBuild !== buildId;
}

export async function resetCooldownOnNewDevBuild(): Promise<boolean> {
  const last = await getMeta('lastBuild');
  if (!shouldResetCooldown(APP_ENV, last, BUILD_ID)) return false;
  await setMeta('lastSession', null);
  await setMeta('lastBuild', BUILD_ID);
  return true;
}
