import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useDemo } from '../context';
import { demo } from '../demo';
import { canUseRole } from '../access';
import { Badge, Button, C, Card, Detail, Icon, Screen, Stack, Txt } from '../ui';
export default function Receipt() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { t, state, store, number, pesos, date } = useDemo();
  const [smsFor, setSMSFor] = useState<string | null>(null);
  const sms = smsFor === id;
  useEffect(() => { const timer = setTimeout(() => setSMSFor(id), 700); return () => clearTimeout(timer); }, [id]);
  const tx = state.transactions.find(tx => tx.id === id && tx.kind === 'payment' && tx.residentId === state.resident.id);
  if (!tx) return <Screen title={t('paid')}><Txt>{t('unknownIntent')}</Txt><Button label={t('backHome')} onPress={() => router.dismissTo('/')} /></Screen>;
  const merchant = demo.merchants.find(m => m.id === tx.merchantId)!;
  return <Screen title={t('paid')} back={false}>
    <Stack gap={16} style={{ alignItems: 'center', paddingVertical: 16 }}><View style={{ width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E3F0D8' }}><Icon name="checkmark" color={C.success} size={42} /></View><Badge label={t('paid')} positive /><Txt testID="receipt-amount" size={46} weight="extra">{number(tx.tokenMinor)}</Txt><Txt>{t('tokenUnit')}</Txt><Txt style={{ textAlign: 'center' }}>{t('paidBody')}</Txt></Stack>
    <Card><Detail label={t('paidTo')} value={merchant.name} /><Detail label={t('agreed')} value={`₱${pesos(tx.pesoMinor!)}`} /><Detail label={t('reference')} value={tx.id} /><Detail label={t('time')} value={date(tx.at, true)} /><Detail label={t('balance')} value={`${number(state.balanceMinor)} Eco-Tokens`} /></Card>
    <View accessibilityLiveRegion="polite"><Card style={{ backgroundColor: C.cream }}><Icon name="chatbubble-ellipses-outline" /><Txt weight="bold">{t('smsTitle')}</Txt><Txt testID="simulated-sms">{sms ? t('smsBody', { resident: tx.residentName, merchant: merchant.name, tokens: number(tx.tokenMinor), pesos: pesos(tx.pesoMinor!), id: tx.id }) : t('smsWaiting')}</Txt></Card></View>
    <Button label={t('backHome')} onPress={() => router.dismissTo('/')} />
    {canUseRole(state.profile, 'merchant', merchant.id) && <Button secondary label={t('seeMerchant')} onPress={() => { store.switchRole('merchant', merchant.id); router.dismissTo('/'); }} />}
  </Screen>;
}
