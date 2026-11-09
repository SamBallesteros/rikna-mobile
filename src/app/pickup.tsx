import React, { useState } from 'react';
import { useDemo } from '../context';
import { demo } from '../demo';
import type { ErrorCode, Trash } from '../ledger';
import { ActivityBadge, Badge, Button, C, Card, Choice, Detail, ErrorLine, Screen, SectionTitle, Stack, Txt } from '../ui';
export default function Pickup() {
  const { t, state, store, date } = useDemo();
  const [trash, setTrash] = useState<Trash>('recyclable');
  const [error, setError] = useState<ErrorCode | null>(null);
  const pickups = state.pickups.filter(p => p.residentId === state.resident.id);
  return <Screen title={t('pickupTitle')}>
    <Txt>{t('pickupBody')}</Txt>
    <ActivityBadge category="recycling" />
    <Stack gap={8}><Txt weight="bold">{t('wasteType')}</Txt>{(['recyclable', 'biodegradable', 'residual'] as const).map(type => <Choice key={type} label={t(type)} selected={type === trash} onPress={() => setTrash(type)} />)}</Stack>
    <Txt size={14}>{t('sampleReward', { n: demo.pickupReward })}</Txt>
    <Button testID="generate-pickup" label={t(pickups.length ? 'generateAnother' : 'pickupAction')} icon="add-outline" onPress={() => { const result = store.generatePickup(trash); setError(result.ok ? null : result.error); }} />
    <ErrorLine code={error} />
    <SectionTitle>{t('pickupRecords')}</SectionTitle>
    {!pickups.length && <Txt color={C.muted}>{t('noPickups')}</Txt>}
    {pickups.map(p => <Card category="recycling" key={p.id}><Detail label={t('pickupCode')} value={p.code} /><Txt size={14}>{t(p.trash)} · {date(p.createdAt, true)}</Txt><Badge positive={p.verified} label={t(p.verified ? 'verified' : 'pending')} /></Card>)}
  </Screen>;
}
