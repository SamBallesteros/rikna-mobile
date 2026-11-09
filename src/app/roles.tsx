import React from 'react';
import { router } from 'expo-router';
import { useDemo } from '../context';
import type { Role } from '../ledger';
import { canUseRole } from '../access';
import { Badge, C, ListItem, Screen, Stack, Txt } from '../ui';
export default function Roles() {
  const { t, state, store } = useDemo();
  const choose = (role: Role, account?: string) => { if (store.switchRole(role, account)) router.dismissTo('/'); };
  return <Screen title={t('roleTitle')}>
    <Stack gap={12}><Badge label={t('demo')} /><Txt heading size={30} weight="extra">{t('roleBody')}</Txt><Txt>{t('roleNote')}</Txt></Stack>
    {canUseRole(state.profile, 'resident') && <ListItem title={t('resident')} body={t('residentDesc')} icon="person-outline" onPress={() => choose('resident')} />}
    {canUseRole(state.profile, 'official') && <ListItem title={t('official')} body={t('officialDesc')} icon="shield-checkmark-outline" onPress={() => choose('official')} />}
    {canUseRole(state.profile, 'merchant') && <Stack gap={12}><Txt weight="bold" color={C.muted}>{t('merchant')}</Txt>{canUseRole(state.profile, 'merchant', 'shop') && <ListItem title={t('shopAccount')} body="Aling Nena’s Store" icon="storefront-outline" onPress={() => choose('merchant', 'shop')} />}{canUseRole(state.profile, 'merchant', 'driver') && <ListItem title={t('driverAccount')} body="Kuya Ben · Tricycle" icon="bicycle-outline" onPress={() => choose('merchant', 'driver')} />}</Stack>}
  </Screen>;
}
