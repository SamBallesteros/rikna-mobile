import React, { useRef, useState } from 'react';
import { TextInput } from 'react-native';
import { Redirect, router } from 'expo-router';
import { useDemo } from '../context';
import { validateSignup, type AuthError, type IdentityKind, type Signup, type SignupErrors } from '../auth';
import { Badge, Button, Choice, Field, Message, Screen, Stack, Txt } from '../ui';
export default function SignupScreen() {
  const { t, state, auth } = useDemo();
  const [form, setForm] = useState<Signup>({ name: '', kind: 'email', identifier: '', password: '', confirm: '' });
  const [errors, setErrors] = useState<SignupErrors>({}), [error, setError] = useState<AuthError | null>(null), [busy, setBusy] = useState(false);
  const nameRef = useRef<React.ComponentRef<typeof TextInput>>(null), idRef = useRef<React.ComponentRef<typeof TextInput>>(null), passwordRef = useRef<React.ComponentRef<typeof TextInput>>(null), confirmRef = useRef<React.ComponentRef<typeof TextInput>>(null);
  const set = (key: keyof Signup, value: string) => { setForm({ ...form, [key]: value }); setErrors({ ...errors, [key]: undefined }); setError(null); };
  if (state.signedIn) return <Redirect href="/" />;
  const submit = async () => {
    const next = validateSignup(form); setErrors(next); setError(null);
    if (Object.keys(next).length) { (next.name ? nameRef : next.identifier ? idRef : next.password ? passwordRef : confirmRef).current?.focus(); return; }
    setBusy(true);
    try { const result = await auth.signup(form); if (!result.ok) setError(result.error); else { setForm({ ...form, password: '', confirm: '' }); router.replace({ pathname: '/login', params: { registered: '1' } }); } }
    finally { setBusy(false); }
  };
  return <Screen title={t('signup')}>
    <Stack gap={12}><Badge label={t('resident')} /><Txt heading size={28} weight="extra">{t('signupTitle')}</Txt><Txt>{t('signupBody')}</Txt></Stack>
    <Field testID="signup-name" label={t('fullName')} value={form.name} onChangeText={v => set('name', v)} error={errors.name && t(errors.name)} inputRef={nameRef} editable={!busy} autoComplete="name" />
    <Stack gap={8}><Txt weight="bold">{t('signupMethod')}</Txt>{(['email', 'phone', 'philsys'] as IdentityKind[]).map(kind => <Choice key={kind} label={t(kind)} selected={form.kind === kind} disabled={busy} onPress={() => { setForm({ ...form, kind, identifier: '' }); setErrors({ ...errors, identifier: undefined }); setError(null); }} />)}</Stack>
    <Field testID="signup-identifier" label={t(form.kind)} value={form.identifier} onChangeText={v => set('identifier', v)} error={errors.identifier && t(errors.identifier)} hint={form.kind === 'philsys' ? t('pcnHelp') : undefined} keyboardType={form.kind === 'email' ? 'email-address' : 'phone-pad'} inputRef={idRef} editable={!busy} autoComplete={form.kind === 'email' ? 'email' : form.kind === 'phone' ? 'tel' : 'off'} />
    <Field testID="signup-password" label={t('password')} value={form.password} onChangeText={v => set('password', v)} error={errors.password && t(errors.password)} hint={t('passwordHelp')} secure inputRef={passwordRef} editable={!busy} autoComplete="new-password" />
    <Field testID="signup-confirm" label={t('confirmPassword')} value={form.confirm} onChangeText={v => set('confirm', v)} error={errors.confirm && t(errors.confirm)} secure inputRef={confirmRef} editable={!busy} autoComplete="new-password" onSubmitEditing={submit} />
    {error && <Message error text={t(error)} />}
    <Button testID="signup-submit" label={t('signup')} onPress={submit} loading={busy} disabled={!auth.ready} icon="person-add-outline" />
    <Button label={t('login')} secondary onPress={() => router.replace('/login')} disabled={busy} />
  </Screen>;
}
