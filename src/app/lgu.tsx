import React from 'react';
import { demo } from '../demo';
import { useDemo } from '../context';
import { Badge, C, Card, Detail, Row, Screen, SectionTitle, Txt } from '../ui';
export default function LGU() {
  const { t, number, date } = useDemo();
  const earned = demo.lguRegister.filter(r => r.tokens > 0).reduce((sum, r) => sum + r.tokens, 0);
  const spent = -demo.lguRegister.filter(r => r.tokens < 0).reduce((sum, r) => sum + r.tokens, 0);
  return <Screen title={t('lguTitle')}><Badge label={t('sampleRecords')} /><Txt>{t('lguBody')}</Txt><Card><Detail label={`${t('earned')} · Eco-Tokens`} value={number(earned * 100)} /><Detail label={`${t('spent')} · Eco-Tokens`} value={number(spent * 100)} /></Card><SectionTitle>{t('sampleRecords')}</SectionTitle>{demo.lguRegister.map(record => <Card key={record.id}><Row style={{ justifyContent: 'space-between' }}><Txt weight="bold">{t(record.kind)}</Txt><Txt weight="extra" color={record.tokens > 0 ? C.success : C.teal}>{record.tokens > 0 ? '+' : '−'}{Math.abs(record.tokens)} Eco-Tokens</Txt></Row><Txt size={13}>{record.id} · {date(record.date)}</Txt></Card>)}</Screen>;
}
