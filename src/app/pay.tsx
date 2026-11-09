import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { useDemo } from '../context';
import { demo } from '../demo';
import { parsePesoMinor, resolveMerchantScan, type ErrorCode, type Intent } from '../ledger';
import { Badge, Button, C, Card, Detail, ErrorLine, Field, Icon, Screen, Stack, Txt } from '../ui';
export default function Pay() {
  const { t, state, store, number, pesos, local } = useDemo();
  const params = useLocalSearchParams<{ merchant?: string }>();
  const initial = demo.merchants.find(m => m.id === params.merchant);
  const [qr, setQR] = useState(initial?.qr ?? ''), [recipientQR, setRecipientQR] = useState(initial?.qr ?? '');
  const [amount, setAmount] = useState(''), [intent, setIntent] = useState<Intent | null>(null), [error, setError] = useState<ErrorCode | null>(null);
  const merchant = resolveMerchantScan(recipientQR);
  const amountMinor = parsePesoMinor(amount);
  const scan = (value: string) => { setQR(value); const recipient = resolveMerchantScan(value); setRecipientQR(recipient ? value : ''); setError(recipient ? null : 'unknownQR'); setIntent(null); };
  if (intent && merchant) return <Screen title={t('reviewTitle')}>
    <Card><Badge label={t('recipient')} /><Txt heading size={27} weight="extra">{merchant.name}</Txt><Txt>{local(merchant.detail)}</Txt><Detail label={t('agreed')} value={`₱${pesos(intent.pesoMinor)}`} /><Detail label={t('deduction')} value={`${number(intent.tokenMinor)} Eco-Tokens`} /><Detail label={t('newBalance')} value={`${number(state.balanceMinor - intent.tokenMinor)} Eco-Tokens`} /><Txt size={13}>{t('sampleRate', { rate: demo.tokensPerPeso })}</Txt></Card>
    <Button testID="confirm-payment" label={t('confirmPay')} icon="lock-closed-outline" onPress={() => { const result = store.confirmPayment(intent.id); if (result.ok) router.replace({ pathname: '/receipt', params: { id: result.value.id } }); else setError(result.error); }} />
    <ErrorLine code={error} /><Button secondary label={t('editPayment')} onPress={() => { setIntent(null); setError(null); }} />
  </Screen>;
  return <Screen title={t('payTitle')}>
    {!merchant && <Stack gap={8}><Txt heading size={28} weight="extra">{t('scanTitle')}</Txt><Txt>{t('scanBody')}</Txt></Stack>}
    {!merchant && <Card><Badge label={t('simulateNote')} /><Icon name="scan-outline" size={48} /><Button secondary label={t('simulateShop')} onPress={() => scan(demo.merchants[0].qr)} /><Button secondary label={t('simulateDriver')} onPress={() => scan(demo.merchants[1].qr)} /><Field label={t('qrPayload')} value={qr} multiline onChangeText={value => { setQR(value); setRecipientQR(''); setError(null); }} testID="payment-payload" /><Button secondary label={t('readQR')} onPress={() => scan(qr)} /></Card>}
    {merchant && <Card style={{ backgroundColor: C.soft }}><Badge label={t('simulateNote')} /><Detail label={t('recipient')} value={merchant.name} /><Txt size={14}>{local(merchant.detail)}</Txt><Button secondary label={t('changeRecipient')} onPress={() => { setRecipientQR(''); setQR(''); setError(null); }} /></Card>}
    <Field label={t('amount')} value={amount} numeric onChangeText={value => { setAmount(value); setError(null); }} testID="payment-amount" placeholder="0.00" />
    <Card><Detail label={t('deduction')} value={`${number((amountMinor ?? 0) * demo.tokensPerPeso)} Eco-Tokens`} /><Detail label={t('balance')} value={`${number(state.balanceMinor)} Eco-Tokens`} /><Txt size={13}>{t('sampleRate', { rate: demo.tokensPerPeso })}</Txt></Card>
    <ErrorLine code={error} /><Button label={t('review')} onPress={() => { const result = store.beginPayment(recipientQR, amount); if (result.ok) { setIntent(result.value); setError(null); } else setError(result.error); }} />
  </Screen>;
}
