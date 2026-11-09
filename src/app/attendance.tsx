import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useDemo } from '../context';
import { demo } from '../demo';
import { qrForResident } from '../ledger';
import { ActivityBadge, Badge, C, Card, Screen, Stack, Txt } from '../ui';
export default function Attendance() {
  const { t, state, store, local, date } = useDemo();
  return <Screen title={t('attendanceTitle')}>
    <Txt>{t('attendanceBody')}</Txt><Card><View style={{ alignSelf: 'center', backgroundColor: C.white, padding: 16 }} accessibilityLabel={t('attendanceTitle')}><QRCode value={qrForResident(state.resident.id)} size={192} color={C.ink} backgroundColor={C.white} ecl="M" quietZone={8} /></View><Txt weight="extra" size={22} style={{ textAlign: 'center' }}>{state.resident.name}</Txt></Card>
    {demo.events.map(event => <Card key={event.id} category={event.category}><ActivityBadge category={event.category} /><Stack gap={8}><Txt weight="bold" size={20}>{local(event.name)}</Txt><Txt size={14}>{date(event.date)} · {local(event.place)}</Txt><Txt size={14}>+{event.reward} Eco-Tokens</Txt><Badge positive={state.attendance[store.attendanceKey(event.id)] === 'approved'} label={t(state.attendance[store.attendanceKey(event.id)] ?? 'notCheckedIn')} /></Stack></Card>)}
  </Screen>;
}
