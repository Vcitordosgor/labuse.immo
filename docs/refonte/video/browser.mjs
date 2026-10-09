// Lancement Chromium : confiance limitée à l'AC du proxy de l'environnement (empreinte SPKI).
import { chromium } from '/home/user/labuse.immo/node_modules/playwright-core/index.mjs';
export const SPKI = 'PS48cX347wDVcRynzq+DFqswl2PLNE1sG6uQvxMCOS0=';
export const launch = () => chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: [`--ignore-certificate-errors-spki-list=${SPKI}`] });
