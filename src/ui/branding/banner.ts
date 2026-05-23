import boxen from 'boxen';
import { APP_NAME, APP_SUBTITLE } from './constants.js';

export function generateBanner(model: string, session: string = 'Active') {
    return boxen(`${APP_NAME}\n${APP_SUBTITLE}\nModel: ${model}\nSession: ${session}`, {
        padding: 1,
        borderColor: 'cyan',
        borderStyle: 'round'
    });
}
