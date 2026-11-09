import React, { useState } from 'react';
import { useDemo } from '../context';
import { demo } from '../demo';
import type { ErrorCode } from '../ledger';
import { Badge, Button, C, Card, Detail, ErrorLine, Field, Icon, Screen, Txt } from '../ui';
export default function Verify() {
  const { t, state, store } = useDemo();
  const [code, setCode] = useState(''), [foundCode, setFoundCode] = useState('');
  const [error, setError] = useState<ErrorCode | null>(null), [success, setSuccess] = useState(false);
  const pickup = state.pickups.find(p => p.code === foundCode);
  const lookup = () => { setSuccess(false); const p = state.pickups.find(p => p.code === code.trim().toUpperCase()); setFoundCode(p?.code ?? ''); setError(!p ? 'unknownPickup' : p.verified ? 'alreadyVerified' : null); };
  return <Screen title={t('verifyTitle')}>
    <Field label={t('enterCode')} value={code} onChangeText={value => { setCode(value); setFoundCode(''); setError(null); setSuccess(false); }} testID="pickup-code-input" placeholder="RK-000001" />
    <Button label={t('lookup')} icon="search-outline" onPress={lookup} />
    <Button secondary label={t('useLatest')} disabled={!state.pickups.length} onPress={() => { setCode(state.pickups[0].code); setFoundCode(''); setError(null); setSuccess(false); }} />
    <ErrorLine code={error} />
    {pickup && <Card category="recycling"><Txt heading size={22} weight="extra">{t('matchingPickup')}</Txt><Detail label={t('residentName')} value={state.residents[pickup.residentId]?.name ?? ''} /><Detail label={t('pickupCode')} value={pickup.code} /><Detail label={t('wasteType')} value={t(pickup.trash)} /><Txt>{t('sampleReward', { n: demo.pickupReward })}</Txt><Badge label={t(pickup.verified ? 'verified' : 'pending')} positive={pickup.verified} />{!pickup.verified && <Button label={t('confirmVerification')} onPress={() => { const result = store.verifyPickup(pickup.code); setError(result.ok ? null : result.error); setSuccess(result.ok); }} />}</Card>}
    {success && <Card style={{ backgroundColor: '#E3F0D8' }}><Icon name="checkmark-circle" color={C.success} size={36} /><Txt weight="extra" size={22}>{t('awarded', { n: demo.pickupReward })}</Txt><Txt>{t('verifiedBody')}</Txt></Card>}
  </Screen>;
}
