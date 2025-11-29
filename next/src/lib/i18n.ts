import es from '../messages/es.json';
import en from '../messages/en.json';
import de from '../messages/de.json';

export const messagesByLocale: Record<string, any> = { es, en, de };
export function getMessages(locale: string) {
  return messagesByLocale[locale] || messagesByLocale.es;
}
