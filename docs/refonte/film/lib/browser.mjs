// Lancement Chromium. L'AC du proxy est déjà dans le magasin NSS du navigateur : aucune dérogation TLS.
import { chromium } from '/opt/node22/lib/node_modules/playwright/index.mjs';
export const launch = (extra = []) => chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--force-color-profile=srgb', ...extra] });
