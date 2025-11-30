import {getRequestConfig} from 'next-intl/server';
export const locales=['es','en','de'];
export const defaultLocale='es';
export const middlewareConfig={locales,defaultLocale};
export default getRequestConfig(async ({locale})=>{
  if(!locales.includes(locale)) locale=defaultLocale;
  const messagesModule = await import('./src/messages/'+locale+'.json');
  return {messages: messagesModule.default};
});
