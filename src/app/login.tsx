import React, { useRef, useState } from 'react';
import { TextInput, View } from 'react-native';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useDemo } from '../context';
import { detectIdentity, sampleAccount, type AuthError } from '../auth';
import { roles, type Role } from '../access';
import { Badge, Button, C, Card, Choice, Field, Icon, Message, Row, Screen, Stack, Txt } from '../ui';
export default function Login() {
  const { t, state, auth } = useDemo(); const { registered } = useLocalSearchParams<{ registered?: string }>();
  const [identifier, setIdentifier] = useState(''), [password, setPassword] = useState(''), [role, setRole] = useState<Role>('resident');
  const [errors, setErrors] = useState<{ identifier?: AuthError; password?: AuthError }>({}), [error, setError] = useState<AuthError | null>(null), [busy, setBusy] = useState(false);
  const identifierRef = useRef<React.ComponentRef<typeof TextInput>>(null), passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  if (state.signedIn) return <Redirect href="/" />;
  const submit = async () => {
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = 'requiredField'; else if (!detectIdentity(identifier)) next.identifier = 'invalidIdentifier';
    if (!password) next.password = 'requiredField';
    setErrors(next); setError(null);
    if (Object.keys(next).length) { (next.identifier ? identifierRef : passwordRef).current?.focus(); return; }
    setBusy(true);
    try { const result = await auth.login(identifier, password, role); if (!result.ok) setError(result.error); else { setPassword(''); router.replace('/'); } }
    finally { setBusy(false); }
  };
  return <Screen back={false}>
    <View style={{ backgroundColor: '#E3F0DB', borderRadius: 20, padding: 16, gap: 8 }}><Row style={{ gap: 8, alignItems: 'flex-start' }}><Icon name="leaf-outline" size={24} color={C.success} /><Txt heading size={24} weight="extra">{t('loginTitle')}</Txt></Row><Txt>{t('loginBody')}</Txt></View>
    <Badge label={t('localAuth')} />
    {registered === '1' && <Message text={t('registered')} />}
    <Stack gap={16}>
    <Field testID="login-identifier" label={t('identifier')} value={identifier} onChangeText={v => { setIdentifier(v); setErrors({ ...errors, identifier: undefined }); setError(null); }} error={errors.identifier && t(errors.identifier)} editable={!busy} inputRef={identifierRef} autoComplete="username" />
    <Field testID="login-password" label={t('password')} value={password} onChangeText={v => { setPassword(v); setErrors({ ...errors, password: undefined }); setError(null); }} error={errors.password && t(errors.password)} secure editable={!busy} inputRef={passwordRef} autoComplete="current-password" onSubmitEditing={submit} />
    <Stack gap={8}><Txt weight="bold">{t('loginRole')}</Txt>{roles.map(r => <Choice key={r} label={t(r)} selected={r === role} disabled={busy} onPress={() => { setRole(r); setError(null); }} />)}</Stack>
    {(error || auth.failed) && <Message error text={t(error ?? 'storageError')} />}
    <Button testID="login-submit" label={t('login')} onPress={submit} disabled={!auth.ready} loading={busy} icon="arrow-forward" />
    {!auth.ready && <Txt size={13} color={C.muted}>{t('loadingAccounts')}</Txt>}
    <Button label={t('signup')} secondary onPress={() => router.push('/signup')} disabled={busy} />
    </Stack>
    <Card style={{ backgroundColor: C.cream, borderColor: C.cream }}><Txt weight="bold">{t('sampleLogin')}</Txt><Txt size={14}>{sampleAccount.identifier}</Txt><Txt size={14}>{sampleAccount.password}</Txt><Txt size={13}>{t('sampleLoginNote')}</Txt></Card>
    <Button label={t('lgu')} secondary onPress={() => router.push('/lgu')} />
  </Screen>;
}
