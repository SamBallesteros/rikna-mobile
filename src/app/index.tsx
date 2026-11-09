import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useDemo } from '../context';
import { demo } from '../demo';
import { merchantPayments } from '../ledger';
import { Badge, Button, C, Card, Detail, Icon, ListItem, Row, Screen, SectionTitle, Stack, Txt, EarningActions, type IconName } from '../ui';

export default function Home() {
  const { state, t, local, number, pesos, date } = useDemo();
  if (!state.signedIn) return <Redirect href="/login" />;
  if (!state.role) return <Screen><Txt size={28} weight="extra">{t('roleTitle')}</Txt><Button label={t('roleTitle')} onPress={() => router.push('/roles')} /></Screen>;
  if (state.role === 'official') return <Screen tabs back={false}>
    <Stack gap={8}><Badge label={t('official')} /><Txt heading size={30} weight="extra">{t('officialTitle')}</Txt><Txt>{t('officialBody')}</Txt></Stack>
    <Card style={{ backgroundColor: C.teal, borderColor: C.teal }}><Row><Stack style={{ flex: 1 }} gap={8}><Txt color={C.white} size={14}>{t('pendingPickups')}</Txt><Txt color={C.white} size={38} weight="extra">{state.pickups.filter(p => !p.verified).length}</Txt></Stack><View style={{ width: 1, height: 64, backgroundColor: '#488895' }} /><Stack style={{ flex: 1 }} gap={8}><Txt color={C.white} size={14}>{t('approvedAttendance')}</Txt><Txt color={C.white} size={38} weight="extra">{Object.values(state.attendance).filter(a => a === 'approved').length}</Txt></Stack></Row></Card>
    <ListItem title={t('verifyWaste')} body={t('wasteDesc')} icon="shield-checkmark-outline" onPress={() => router.push('/verify')} />
    <ListItem title={t('manageEvents')} body={t('eventDesc')} icon="people-outline" onPress={() => router.push('/events')} />
    <Card style={{ backgroundColor: C.cream }}><Icon name="leaf-outline" /><Txt>{t('sampleReward', { n: demo.pickupReward })}</Txt><Txt size={14}>{t('attendanceRule')}</Txt></Card>
  </Screen>;
  if (state.role === 'merchant') {
    const merchant = demo.merchants.find(m => m.id === state.merchantId)!;
    const incoming = merchantPayments(state, merchant.id);
    return <Screen tabs back={false}>
      <Stack gap={8}><Badge label={t('merchant')} /><Txt heading size={28} weight="extra">{merchant.name}</Txt><Txt color={C.muted}>{local(merchant.detail)}</Txt></Stack>
      <Card style={{ backgroundColor: C.teal, borderColor: C.teal, padding: 24 }}><Txt color={C.white}>{t('received')}</Txt><Txt testID="merchant-total" color={C.white} size={48} weight="extra" style={{ fontVariant: ['tabular-nums'] }}>{number(incoming.reduce((sum, tx) => sum + tx.tokenMinor, 0))}</Txt><Txt color={C.white} size={14}>{t('tokenUnit')}</Txt><View style={{ height: 1, backgroundColor: '#488895' }} /><Txt color={C.white} size={13}>{t('sessionTotal')}</Txt><Txt color={C.white} size={13}>{t('sampleRate', { rate: demo.tokensPerPeso })}</Txt></Card>
      <Button secondary icon="qr-code-outline" label={t('showQR')} onPress={() => router.push('/merchant-qr')} />
      <SectionTitle>{t('paymentHistory')}</SectionTitle>
      {!incoming.length ? <Card><Icon name="receipt-outline" /><Txt weight="bold">{t('noPayments')}</Txt><Txt>{t('noPaymentsBody')}</Txt></Card> : incoming.map(tx => <Card key={tx.id}><Row style={{ justifyContent: 'space-between' }}><Stack gap={4} style={{ flex: 1 }}><Txt weight="bold">{t('paymentFrom', { name: tx.residentName })}</Txt><Txt size={13} color={C.muted}>{date(tx.at, true)}</Txt></Stack><Txt weight="extra" color={C.success} size={23}>+{number(tx.tokenMinor)}</Txt></Row><Txt size={13}>{t('tokenUnit')} · {tx.id}</Txt><Txt size={14}>{t('agreed')} · ₱{pesos(tx.pesoMinor!)}</Txt></Card>)}
      <SectionTitle>{t('claimTitle')}</SectionTitle>
      <Card style={{ backgroundColor: '#F4F3D9' }}><Badge label={t('sampleClaim')} /><Txt>{t('claimBody')}</Txt><Detail label={t('location')} value={local(demo.claim.location)} /><Detail label={t('schedule')} value={local(demo.claim.schedule)} /><Detail label={t('instructions')} value={local(demo.claim.instructions)} /><View style={{ height: 1, backgroundColor: '#D1D2B5' }} /><Detail label={t('sampleCash')} value={`₱${demo.claim.cashPesos.toFixed(2)}`} /><Txt size={13}>{t('claimStatus')}</Txt></Card>
    </Screen>;
  }
  return <Screen tabs back={false}>
    <Stack gap={4}><Txt size={14} color={C.muted}>{local(demo.resident.area)}</Txt><Txt heading size={28} weight="extra">{t('goodMorning', { name: state.resident.name.split(' ')[0] })}</Txt></Stack>
    <Card style={{ backgroundColor: C.teal, borderColor: C.teal, padding: 24 }}>
      <Row style={{ justifyContent: 'space-between' }}><Txt color={C.white}>{t('balance')}</Txt><Icon name="leaf-outline" color={C.lime} size={24} /></Row>
      <Row style={{ alignItems: 'baseline', flexWrap: 'wrap', gap: 8 }}><Txt testID="resident-balance" size={52} color={C.white} weight="extra" style={{ letterSpacing: -2, fontVariant: ['tabular-nums'] }}>{number(state.balanceMinor)}</Txt><Txt color={C.white} size={14} style={{ flexShrink: 0 }}>{t('tokenUnit')}</Txt></Row>
      <Txt size={13} color={C.white}>{t('available')} · ₱{pesos(state.balanceMinor / demo.tokensPerPeso)}</Txt>
      <Button onDark label={t('scanPay')} icon="scan-outline" onPress={() => router.push('/pay')} />
      <Txt size={13} color={C.white}>{t('sampleRate', { rate: demo.tokensPerPeso })}</Txt>
    </Card>
    <EarningActions />
    <Stack gap={16}><SectionTitle>{t('events')}</SectionTitle><Txt size={13} color={C.muted}>{t('sampleEvents')}</Txt>
      {demo.events.map(event => <ListItem key={event.id} category={event.category} icon={event.icon as IconName} title={local(event.name)} body={`${date(event.date)} · ${local(event.organizer)}\n+${event.reward} Eco-Tokens`} onPress={() => router.push('/attendance')} />)}
    </Stack>
    <Stack gap={16}><SectionTitle>{t('shops')}</SectionTitle>{demo.merchants.filter(m => m.type === 'shop').map(merchant => <ListItem key={merchant.id} title={merchant.name} body={local(merchant.detail)} icon="storefront-outline" onPress={() => router.push({ pathname: '/pay', params: { merchant: merchant.id } })} />)}
      <ListItem title={demo.merchants[1].name} body={local(demo.merchants[1].detail)} icon="bicycle-outline" onPress={() => router.push({ pathname: '/pay', params: { merchant: 'driver' } })} />
    </Stack>
    <Card style={{ backgroundColor: C.cream }}><Txt heading size={20} weight="extra">{t('earnsTitle')}</Txt><Txt>{t('earnBody')}</Txt></Card>
  </Screen>;
}
