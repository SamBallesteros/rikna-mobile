import React from 'react';
import { router } from 'expo-router';
import { useDemo } from '../context';
import { demo } from '../demo';
import { Badge, Button, C, Card, Detail, Icon, LanguageToggle, Screen, Stack, Txt } from '../ui';
export default function Settings() {
  const { t, state, auth } = useDemo();
  return <Screen title={t('settings')}><Stack gap={8}><Icon name="leaf-outline" color={C.green} size={32} /><Txt heading size={28} weight="extra">{t('settingsTitle')}</Txt></Stack>
    <Card><Detail label={t('signedInAs')} value={state.profile?.name ?? ''} /><Detail label={t('assignedRoles')} value={state.profile?.grants.map(g => t(g.role)).join(' · ') ?? ''} /></Card>
    <Card><Txt weight="bold">{t('language')}</Txt><LanguageToggle settings /></Card>
    <Card style={{ backgroundColor: C.cream, borderColor: C.cream }}><Badge label={t('sampleRate', { rate: demo.tokensPerPeso })} /><Txt>{t('accountStorage')}</Txt></Card>
    <Button secondary label={t('signOut')} icon="log-out-outline" onPress={() => { auth.logout(); router.replace('/login'); }} />
  </Screen>;
}
