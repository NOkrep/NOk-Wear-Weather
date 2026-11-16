import packageInfo from '../package.json';

export const RELEASE_VERSION = packageInfo.version;

/** Public source identity only; never expose runtime configuration or Git remote details. */
export function releaseIdentity() {
  const source = process.env.WEATHROBE_SOURCE_ID;
  return { version: RELEASE_VERSION, sourceId: source && /^[a-f0-9]{64}$/.test(source) ? source : 'unverified' };
}
