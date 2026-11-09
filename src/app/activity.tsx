import React from 'react';
import { useDemo } from '../context';
import { demo } from '../demo';
import { pesoMinorFromTokenMinor } from '../exchange';
import { ActivityBadge, C, Card, Detail, Icon, Row, Screen, Txt } from '../ui';
export default function Activity() {
  const { t, state, local, number, pesos, date } = useDemo();
  const transactions = state.transactions.filter(tx => tx.residentId === state.resident.id);
  return <Screen title={t('activityTitle')}>
    <Txt size={14}>{t('sampleRate', { rate: demo.tokensPerPeso })}</Txt>
    {!transactions.length && <Card category="community"><Icon name="leaf-outline" /><Txt size={22} weight="extra">{t('noActivity')}</Txt><Txt>{t('noActivityBody')}</Txt></Card>}
    {transactions.map(tx => {
      const event = demo.events.find(e => e.id === tx.sourceId);
      const category = tx.kind === 'pickup' ? 'recycling' : tx.kind === 'event' ? event?.category ?? 'community' : undefined;
      return <Card key={tx.id} category={category}>
        {category && <ActivityBadge category={category} />}
        <Row style={{ justifyContent: 'space-between' }}><Txt weight="bold">{t(tx.kind)}</Txt><Txt weight="extra" size={24} color={tx.kind === 'payment' ? C.teal : C.success}>{tx.kind === 'payment' ? '−' : '+'}{number(tx.tokenMinor)}</Txt></Row>
        {event && <Txt>{local(event.name)}</Txt>}
        {tx.merchantId && <Txt>{demo.merchants.find(m => m.id === tx.merchantId)?.name}</Txt>}
        <Detail label={t(tx.kind === 'payment' ? 'agreed' : 'cashEquivalent')} value={`₱${pesos(tx.pesoMinor ?? pesoMinorFromTokenMinor(tx.tokenMinor))}`} />
        <Txt size={13}>{date(tx.at, true)} · Eco-Tokens</Txt><Txt size={13}>{tx.id}</Txt>
      </Card>;
    })}
  </Screen>;
}
