import React from 'react';
import { ScrollViewStyleReset } from 'expo-router/html';
export default function Root({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-type="software"><head><meta charSet="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /><meta name="theme-color" content="#F8F9F3" /><meta name="description" content="Rikna civic rewards wallet: a single-device mobile demo for residents, barangay officials, and Merchants." /><meta name="page-type" content="software" /><meta name="site-kind" content="software" /><title>Rikna · Your barangay rewards wallet</title><ScrollViewStyleReset /></head><body>{children}</body></html>;
}
