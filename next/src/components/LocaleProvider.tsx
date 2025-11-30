"use client";
import React, {createContext, useContext} from 'react';

interface LocaleContextValue { locale: string; messages: any }
const LocaleContext = createContext<LocaleContextValue>({locale: 'es', messages: {}});

export function LocaleProvider({locale, messages, children}:{locale:string; messages:any; children:React.ReactNode}) {
  return <LocaleContext.Provider value={{locale, messages}}>{children}</LocaleContext.Provider>;
}

export function useLocale() { return useContext(LocaleContext).locale; }
export function useMessages() { return useContext(LocaleContext).messages; }
export function useT() {
  const {messages} = useContext(LocaleContext);
  return (ns:string, key:string) => messages?.[ns]?.[key] || key;
}
