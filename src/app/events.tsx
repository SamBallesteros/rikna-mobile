import React, { useState } from 'react';
import { useDemo } from '../context';
import { demo, residentQR } from '../demo';
import { resolveResidentScan, type ErrorCode } from '../ledger';
import { ActivityBadge, Badge, Button, Card, Choice, Detail, ErrorLine, Field, Screen, Stack, Txt } from '../ui';
export default function Events() {
  const { t, local, state, store } = useDemo();
  const [eventId, setEventId] = useState(demo.events[0].id), [qr, setQR] = useState('');
  const [error, setError] = useState<ErrorCode | null>(null), [awarded, setAwarded] = useState(false);
  const event = demo.events.find(e => e.id === eventId)!;
  const resident = resolveResidentScan(qr, Object.values(state.residents)) ?? state.residents[state.lastAttendanceResidentId];
  const status = state.attendance[store.attendanceKey(eventId, resident.id)];
  const scan = (action: 'checkIn' | 'checkOut') => { const result = store.scanAttendance(eventId, qr, action); setError(result.ok ? null : result.error); setAwarded(false); };
  return <Screen title={t('eventTitle')}>
    <Stack gap={8}><Txt weight="bold">{t('selectEvent')}</Txt>{demo.events.map(e => <Choice key={e.id} label={local(e.name)} selected={e.id === eventId} icon={e.icon as 'water-outline' | 'leaf-outline'} onPress={() => { setEventId(e.id); setError(null); setAwarded(false); }} />)}</Stack>
    <Card category={event.category}><ActivityBadge category={event.category} /><Detail label={local(event.organizer)} value={local(event.place)} /><Txt>+{event.reward} Eco-Tokens</Txt><Txt>{t('attendanceRule')}</Txt></Card>
    <Stack gap={12}><Badge label={t('simulateNote')} /><Field label={t('qrPayload')} value={qr} onChangeText={v => { setQR(v); setError(null); }} testID="attendance-payload" multiline /><Button secondary label={t('simulateResident')} onPress={() => { setQR(residentQR); setError(null); }} /></Stack>
    <Card><Detail label={t('residentName')} value={resident.name} /><Badge label={t(status ?? 'notCheckedIn')} positive={status === 'approved'} /><Button secondary label={t('checkIn')} onPress={() => scan('checkIn')} /><Button secondary label={t('checkOut')} onPress={() => scan('checkOut')} /><Button label={t('approve')} onPress={() => { const result = store.approveAttendance(eventId, resident.id); setError(result.ok ? null : result.error); setAwarded(result.ok); }} /></Card>
    <ErrorLine code={error} />{awarded && <Card><Txt weight="extra" size={22}>{t('awarded', { n: event.reward })}</Txt><Txt>{t('verifiedBody')}</Txt></Card>}
  </Screen>;
}
