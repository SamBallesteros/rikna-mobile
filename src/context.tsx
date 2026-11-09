import React, { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';
import { I18n } from 'i18n-js';
import { getLocales } from 'expo-localization';
import { store } from './ledger';
import { translations, type Phrase } from './strings';
import type { Localized } from './demo';
import { authService, localStorageAdapter } from './storage';
import type { AuthResult, Signup } from './auth';
import type { Profile, Role } from './access';
type Locale = 'en' | 'tl';
const LanguageContext = createContext<{ locale: Locale; setLocale: (l: Locale) => void }>({ locale: 'en', setLocale: () => {} });
const AuthContext = createContext<{ ready: boolean; failed: boolean; login: (id: string, password: string, role: Role) => Promise<AuthResult<Profile>>; signup: (input: Signup) => Promise<AuthResult<Profile>>; logout: () => void }>({ ready: false, failed: false, login: async () => ({ ok: false, error: 'storageError' }), signup: async () => ({ ok: false, error: 'storageError' }), logout: () => {} });
export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => ['tl', 'fil'].includes(getLocales()[0]?.languageCode ?? '') ? 'tl' : 'en');
  const [ready, setReady] = useState(false), [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    authService.initialize().catch(() => { if (live) setFailed(true); }).finally(() => { if (live) setReady(true); });
    localStorageAdapter.get('rikna.language').then(value => { if (live && (value === 'en' || value === 'tl')) setLocale(value); }).catch(() => {});
    return () => { live = false; };
  }, []);
  const changeLocale = (next: Locale) => { setLocale(next); void localStorageAdapter.set('rikna.language', next).catch(() => {}); };
  useEffect(() => { if (Platform.OS === 'web') document.documentElement.lang = locale; }, [locale]);
  const login = async (identifier: string, password: string, role: Role) => { const result = await authService.login(identifier, password, role); if (result.ok) store.startSession(result.value, role); return result; };
  return <AuthContext.Provider value={{ ready, failed, login, signup: authService.signup, logout: store.endSession }}><LanguageContext.Provider value={{ locale, setLocale: changeLocale }}>{children}</LanguageContext.Provider></AuthContext.Provider>;
}
export function useDemo() {
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const { locale, setLocale } = useContext(LanguageContext);
  const auth = useContext(AuthContext);
  const i18n = useMemo(() => { const i = new I18n(translations); i.locale = locale; return i; }, [locale]);
  const t = (key: Phrase, params: Record<string, string | number> = {}) => i18n.t(key, params);
  const local = (value: Localized) => value[locale];
  const number = (minor: number) => (minor / 100).toLocaleString(locale === 'tl' ? 'fil-PH' : 'en-PH', { maximumFractionDigits: 2 });
  const pesos = (minor: number) => (minor / 100).toLocaleString(locale === 'tl' ? 'fil-PH' : 'en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const date = (iso: string, time = false) => new Intl.DateTimeFormat(locale === 'tl' ? 'fil-PH' : 'en-PH', { month: 'short', day: 'numeric', ...(time ? { hour: 'numeric', minute: '2-digit' } : { weekday: 'short' }), timeZone: 'Asia/Manila' }).format(new Date(iso));
  return { state, store, locale, setLocale, t, local, number, pesos, date, auth };
}
