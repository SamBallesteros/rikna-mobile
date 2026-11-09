import React from 'react';
import { View } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { demo } from '../demo';
import { useDemo } from '../context';
import { C, Card, Screen, Txt } from '../ui';
export default function MerchantQR() {
  const { t, state, local } = useDemo();
  const merchant = demo.merchants.find(m => m.id === state.merchantId)!;
  return <Screen title={t('merchantQR')}><Card><Txt heading size={25} weight="extra">{merchant.name}</Txt><Txt>{local(merchant.detail)}</Txt><View style={{ alignSelf: 'center', padding: 16, backgroundColor: C.white }} accessibilityLabel={t('merchantQR')}><QRCode value={merchant.qr} size={192} quietZone={8} ecl="M" color={C.ink} /></View></Card><Txt>{t('qrInstructions')}</Txt></Screen>;
}
