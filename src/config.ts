// Build-time configuration (see vite.config.ts). The learner token is public by design.
export const API_URL = __API_URL__;
export const LEARNER_TOKEN = __LEARNER_TOKEN__;
export const APP_ENV = __APP_ENV__;
export const BUILD_ID = __BUILD_ID__;
/** Namespace for IndexedDB / localStorage: DEV and PROD share the github.io origin. */
/** The app's visible name. Technical names (IndexedDB `NS`, URLs /fanki/, the repo) stay "fanki" on purpose. */
export const APP_NAME = 'SpeesRep';
export const NS = APP_ENV === 'PROD' ? 'fanki-prod' : 'fanki-dev';
