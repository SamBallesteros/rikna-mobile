import React, { useId, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type TextStyle, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, usePathname } from 'expo-router';
import { useDemo } from './context';
import { publicRoutes, routeRoles, canUseRole } from './access';
import type { ErrorCode } from './ledger';
import { C, activityTones, type ActivityCategory } from './theme';
export { C } from './theme';
export type IconName = React.ComponentProps<typeof Ionicons>['name'];
type Action = () => void | Promise<void>;
function FocusPressable({ style, onFocus, onBlur, accessibilityState, ...props }: React.ComponentProps<typeof Pressable>) {
  const [focused, setFocused] = useState(false);
  return <Pressable {...props} accessibilityState={accessibilityState} aria-busy={accessibilityState?.busy} aria-disabled={accessibilityState?.disabled} aria-checked={accessibilityState?.checked} onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }} style={state => [typeof style === 'function' ? style(state) : style, focused && { outlineColor: C.teal, outlineWidth: 2, outlineOffset: 3, outlineStyle: 'solid' }]} />;
}

export function Icon({ name, color = C.teal, size = 24 }: { name: IconName; color?: string; size?: number }) {
  return <Ionicons name={name} color={color} size={size} accessible={false} />;
}
export function Txt({ children, size = 16, weight = 'regular', color = C.ink, style, heading = false, testID, nativeID }: { children: ReactNode; size?: number; weight?: 'regular' | 'medium' | 'semi' | 'bold' | 'extra'; color?: string; style?: TextStyle; heading?: boolean; testID?: string; nativeID?: string }) {
  return <Text nativeID={nativeID} testID={testID} accessibilityRole={heading ? 'header' : undefined} style={[{ fontFamily: `Manrope_${{ regular: '400Regular', medium: '500Medium', semi: '600SemiBold', bold: '700Bold', extra: '800ExtraBold' }[weight]}`, fontSize: size, lineHeight: Math.round(size * (size > 32 ? 1.2 : 1.5)), color, flexShrink: 1 }, style]}>{children}</Text>;
}
function useControl(onPress: Action) {
  const locked = useRef(false);
  const [busy, setBusy] = useState(false), [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false), [hovered, setHovered] = useState(false);
  const run = async () => {
    if (locked.current) return;
    locked.current = true; setFailed(false);
    try { const result = onPress(); if (result && typeof result.then === 'function') { setBusy(true); await result; } }
    catch { setFailed(true); }
    finally { locked.current = false; setBusy(false); }
  };
  return { busy, failed, focused, hovered, props: { onPress: run, onFocus: () => setFocused(true), onBlur: () => setFocused(false), onHoverIn: () => setHovered(true), onHoverOut: () => setHovered(false) } };
}
export function Button({ label, onPress, icon, secondary, disabled, loading, testID, onDark = false }: { label: string; onPress: Action; icon?: IconName; secondary?: boolean; disabled?: boolean; loading?: boolean; testID?: string; onDark?: boolean }) {
  const { t } = useDemo(); const control = useControl(onPress), busy = !!loading || control.busy;
  const color = onDark ? C.ink : secondary ? C.teal : C.white;
  return <Stack gap={8}>
    <FocusPressable {...control.props} testID={testID} accessibilityRole="button" accessibilityLabel={label} accessibilityState={{ disabled: !!disabled || busy, busy }} disabled={disabled || busy} android_ripple={{ color: '#99CB5B44' }} style={({ pressed }) => [s.button, secondary ? s.secondary : s.primary, onDark && { backgroundColor: C.lime, borderColor: C.lime }, control.hovered && !disabled && { opacity: .94 }, control.focused && s.focus, pressed && { transform: [{ scale: .985 }], opacity: .85 }, disabled && s.disabled]}>
      {busy ? <ActivityIndicator color={color} size="small" /> : icon && <Icon name={icon} color={color} size={21} />}<Txt weight="bold" color={color} style={{ textAlign: 'center' }}>{busy ? t('loading') : label}</Txt>
    </FocusPressable>{control.failed && <Message error text={t('actionFailed')} />}
  </Stack>;
}
export function Card({ children, style, category }: { children: ReactNode; style?: ViewStyle; category?: ActivityCategory }) { return <View style={[s.card, category && { backgroundColor: activityTones[category].fill, borderColor: activityTones[category].fill }, style]}>{children}</View>; }
export function Stack({ children, gap = 16, style }: { children: ReactNode; gap?: number; style?: ViewStyle }) { return <View style={[{ gap }, style]}>{children}</View>; }
export function Row({ children, style }: { children: ReactNode; style?: ViewStyle }) { return <View style={[s.row, style]}>{children}</View>; }
export function Badge({ label, positive = false }: { label: string; positive?: boolean }) { return <View style={{ backgroundColor: positive ? '#DFF0D1' : C.soft, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, alignSelf: 'flex-start' }}><Txt size={13} weight="bold" color={positive ? C.success : C.muted}>{label}</Txt></View>; }
export function ActivityBadge({ category }: { category: ActivityCategory }) { const { t } = useDemo(); const tone = activityTones[category]; return <Row style={{ gap: 8 }}><Icon name={tone.icon} size={20} color={tone.ink} /><Txt size={13} weight="bold" color={tone.ink}>{t(tone.label)}</Txt></Row>; }
export function Message({ text, error = false, nativeID }: { text: string; error?: boolean; nativeID?: string }) { return <View nativeID={nativeID} accessibilityLiveRegion={error ? 'assertive' : 'polite'} style={[s.message, { backgroundColor: error ? '#FFF0EB' : '#E3F0D8' }]}><Icon name={error ? 'alert-circle-outline' : 'checkmark-circle-outline'} color={error ? C.error : C.success} size={22} /><Txt color={error ? C.error : C.success}>{text}</Txt></View>; }
export function Field({ label, value, onChangeText, numeric = false, testID, placeholder, multiline = false, secure = false, keyboardType, error, hint, editable = true, inputRef, autoComplete, onSubmitEditing }: { label: string; value: string; onChangeText: (v: string) => void; numeric?: boolean; testID?: string; placeholder?: string; multiline?: boolean; secure?: boolean; keyboardType?: React.ComponentProps<typeof TextInput>['keyboardType']; error?: string; hint?: string; editable?: boolean; inputRef?: React.Ref<React.ComponentRef<typeof TextInput>>; autoComplete?: React.ComponentProps<typeof TextInput>['autoComplete']; onSubmitEditing?: () => void }) {
  const { t } = useDemo(); const key = useId(); const nativeID = testID ?? key;
  const [focused, setFocused] = useState(false), [visible, setVisible] = useState(false);
  return <Stack gap={8}>
    <Txt nativeID={`${nativeID}-label`} size={14} weight="bold">{label}</Txt>
    <View style={[s.field, focused && { borderColor: C.teal, boxShadow: '0 0 0 2px #D4EA50' }, !!error && { borderColor: C.error }, !editable && s.disabled]}>
      <TextInput ref={inputRef} testID={testID} nativeID={nativeID} accessibilityLabel={label} aria-labelledby={`${nativeID}-label`} aria-describedby={error ? `${nativeID}-error` : hint ? `${nativeID}-hint` : undefined} aria-invalid={!!error} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={C.muted} keyboardType={keyboardType ?? (numeric ? 'decimal-pad' : 'default')} autoComplete={autoComplete} secureTextEntry={secure && !visible} editable={editable} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} onSubmitEditing={onSubmitEditing} autoCapitalize="none" autoCorrect={false} multiline={multiline} style={[s.input, numeric && { fontSize: 32, minHeight: 80 }, secure && { paddingRight: 4 }]} />
      {secure && <FocusPressable accessibilityRole="button" accessibilityLabel={t(visible ? 'hidePassword' : 'showPassword')} onPress={() => setVisible(!visible)} style={s.iconButton}><Icon name={visible ? 'eye-off-outline' : 'eye-outline'} size={21} /></FocusPressable>}
    </View>
    {hint && <Txt nativeID={`${nativeID}-hint`} size={13} color={C.muted}>{hint}</Txt>}
    {error && <Txt nativeID={`${nativeID}-error`} color={C.error} size={14} testID={`${testID}-error`}>{error}</Txt>}
  </Stack>;
}
export function Choice({ label, selected, onPress, disabled = false, icon }: { label: string; selected: boolean; onPress: () => void; disabled?: boolean; icon?: IconName }) {
  const [focus, setFocus] = useState(false);
  return <FocusPressable accessibilityRole="radio" accessibilityLabel={label} accessibilityState={{ checked: selected, disabled }} disabled={disabled} onPress={onPress} onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={({ pressed }) => [s.choice, selected && { backgroundColor: C.soft, borderColor: C.teal }, focus && s.focus, pressed && { opacity: .7 }, disabled && s.disabled]}>{icon && <Icon name={icon} size={21} />}<Txt weight={selected ? 'bold' : 'medium'} style={{ flex: 1 }}>{label}</Txt><Icon name={selected ? 'radio-button-on-outline' : 'radio-button-off-outline'} size={22} /></FocusPressable>;
}
export function ErrorLine({ code }: { code?: ErrorCode | null }) { const { t } = useDemo(); return code ? <Message error text={t(code)} /> : null; }
export function Detail({ label, value }: { label: string; value: string }) { return <Stack gap={4}><Txt size={13} color={C.muted}>{label}</Txt><Txt weight="semi">{value}</Txt></Stack>; }
export function SectionTitle({ children, aside }: { children: ReactNode; aside?: ReactNode }) { return <Row style={{ justifyContent: 'space-between', marginTop: 8 }}><Txt heading size={21} weight="extra" style={{ flex: 1 }}>{children}</Txt>{aside}</Row>; }
export function ListItem({ title, body, icon, onPress, right, category }: { title: string; body?: string; icon: IconName; onPress?: Action; right?: ReactNode; category?: ActivityCategory }) {
  const control = useControl(onPress ?? (() => {})); const { t } = useDemo(); const tone = category ? activityTones[category] : undefined;
  const content = <Row><View style={[s.iconTile, tone && { backgroundColor: tone.fill }]}><Icon name={icon} color={tone?.ink} /></View><Stack gap={4} style={{ flex: 1 }}><Txt weight="bold">{title}</Txt>{body && <Txt size={14} color={C.muted}>{body}</Txt>}{category && <ActivityBadge category={category} />}</Stack>{right || (onPress && <Icon name="chevron-forward" size={20} />)}</Row>;
  return <Stack gap={8}>{onPress ? <FocusPressable {...control.props} accessibilityRole="button" accessibilityLabel={title} disabled={control.busy} accessibilityState={{ busy: control.busy }} style={({ pressed }) => [s.card, control.hovered && { borderColor: C.teal }, control.focused && s.focus, pressed && { opacity: .75 }]}>{content}</FocusPressable> : <Card>{content}</Card>}{control.failed && <Message error text={t('actionFailed')} />}</Stack>;
}
export function ActionTile({ title, icon, category, onPress, testID }: { title: string; icon: IconName; category: ActivityCategory; onPress: Action; testID?: string }) {
  const control = useControl(onPress); const { t } = useDemo(); const tone = activityTones[category];
  return <Stack style={{ flex: 1 }} gap={8}><FocusPressable {...control.props} testID={testID} accessibilityRole="button" accessibilityLabel={title} accessibilityState={{ disabled: control.busy, busy: control.busy }} disabled={control.busy} android_ripple={{ color: '#14637522' }} style={({ pressed }) => [s.actionTile, { backgroundColor: tone.fill, borderColor: tone.fill }, control.focused && s.focus, control.hovered && { borderColor: tone.ink }, pressed && { opacity: .8, transform: [{ scale: .985 }] }]}>{control.busy ? <ActivityIndicator color={tone.ink} /> : <Icon name={icon} color={tone.ink} size={32} />}<Txt weight="extra" color={tone.ink}>{control.busy ? t('loading') : title}</Txt></FocusPressable>{control.failed && <Message error text={t('actionFailed')} />}</Stack>;
}
export function EarningActions() {
  const { width } = useWindowDimensions(); const { t } = useDemo();
  // Give press/busy feedback one frame before changing screens; navigate also reuses an existing route.
  const open = (route: '/pickup' | '/attendance') => new Promise<void>((resolve, reject) => requestAnimationFrame(() => { try { router.navigate(route); resolve(); } catch (error) { reject(error); } }));
  return <View testID="earning-actions" style={{ flexDirection: Math.min(width, 600) >= 380 ? 'row' : 'column', gap: 12, alignItems: 'stretch' }}><ActionTile testID="pickup-action" title={t('pickupAction')} icon="cube-outline" category="recycling" onPress={() => open('/pickup')} /><ActionTile testID="attendance-action" title={t('attendanceAction')} icon="qr-code-outline" category="trees" onPress={() => open('/attendance')} /></View>;
}
export function Logo({ large = false }: { large?: boolean }) { return <Row style={{ gap: 12 }}><Image source={require('../assets/rikna-logo.png')} accessibilityLabel="Rikna bird logo" style={{ width: large ? 72 : 36, height: large ? 72 : 36, borderRadius: large ? 20 : 10 }} /><Txt size={large ? 42 : 25} weight="extra" style={{ letterSpacing: -1 }}>rikna</Txt></Row>; }
export function LanguageToggle({ settings = false }: { settings?: boolean }) { const { locale, setLocale } = useDemo(); return <FocusPressable testID={settings ? 'settings-language' : 'language-switch'} accessibilityRole="button" accessibilityLabel={locale === 'en' ? 'Switch to Tagalog' : 'Switch to English'} onPress={() => setLocale(locale === 'en' ? 'tl' : 'en')} style={({ pressed }) => [s.language, pressed && { backgroundColor: C.cream }]}><Txt size={settings ? 16 : 13} weight="bold">{settings ? locale === 'en' ? 'English → Tagalog' : 'Tagalog → English' : locale === 'en' ? 'EN / TL' : 'TL / EN'}</Txt></FocusPressable>; }
export function Screen({ title, children, tabs = false, back = true }: { title?: string; children: ReactNode; tabs?: boolean; back?: boolean }) {
  const { t, state, auth } = useDemo(); const pathname = usePathname();
  if (!publicRoutes.includes(pathname) && !auth.ready) return <SafeAreaView style={[s.safe, { justifyContent: 'center', alignItems: 'center', gap: 16 }]}><ActivityIndicator color={C.teal} /><Txt>{t('loadingAccounts')}</Txt></SafeAreaView>;
  if (!publicRoutes.includes(pathname) && !state.signedIn) return <Redirect href="/login" />;
  if (routeRoles[pathname] && (!state.role || !routeRoles[pathname].includes(state.role) || !canUseRole(state.profile, state.role, state.role === 'merchant' ? state.merchantId : undefined))) return <Redirect href="/" />;
  return <SafeAreaView style={s.safe} edges={['top', 'bottom']}><KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}><View style={s.shell}>
    <View style={s.header}>{title ? <Row style={{ flex: 1, gap: 8 }}>{back && <FocusPressable accessibilityRole="button" accessibilityLabel={t('back')} onPress={() => router.canGoBack() ? router.back() : router.dismissTo('/')} style={s.iconButton}><Icon name="arrow-back" /></FocusPressable>}<Txt size={18} weight="extra" heading>{title}</Txt></Row> : <Logo />}<LanguageToggle /></View>
    <ScrollView key={pathname} style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled"><Stack gap={24}>{children}</Stack></ScrollView>
    {tabs && <View style={s.tabs}>{[{ text: t(state.role === 'merchant' ? 'wallet' : 'home'), icon: 'grid-outline', go: () => router.dismissTo('/') }, ...(state.role === 'resident' ? [{ text: t('activity'), icon: 'receipt-outline', go: () => router.push('/activity') }] : []), { text: t('switchRole'), icon: 'swap-horizontal-outline', go: () => router.push('/roles') }, { text: t('settings'), icon: 'settings-outline', go: () => router.push('/settings') }].map((item, i) => <FocusPressable key={item.text} accessibilityRole="button" accessibilityLabel={item.text} onPress={item.go} style={({ pressed }) => [s.tab, pressed && { backgroundColor: C.soft }]}><Icon name={item.icon as IconName} color={i === 0 ? C.teal : C.muted} size={22} /><Txt size={13} weight={i === 0 ? 'bold' : 'medium'} style={{ textAlign: 'center' }}>{item.text}</Txt></FocusPressable>)}</View>}
  </View></KeyboardAvoidingView></SafeAreaView>;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper }, shell: { flex: 1, width: '100%', maxWidth: 600, alignSelf: 'center', backgroundColor: C.paper },
  header: { paddingHorizontal: 16, minHeight: 76, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, borderBottomWidth: 1, borderColor: C.line },
  language: { minHeight: 44, minWidth: 64, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 2, borderColor: C.line },
  iconButton: { minWidth: 44, minHeight: 48, alignItems: 'center', justifyContent: 'center' }, content: { padding: 24, paddingBottom: 40 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 }, card: { backgroundColor: C.white, borderWidth: 2, borderColor: C.line, borderRadius: 20, padding: 20, gap: 16 },
  button: { minHeight: 56, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, gap: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderWidth: 2 }, primary: { backgroundColor: C.teal, borderColor: C.teal }, secondary: { backgroundColor: C.white, borderColor: C.line },
  focus: { borderColor: C.ink, boxShadow: '0 0 0 3px #D4EA50' }, disabled: { opacity: .55 },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 2, borderColor: '#90A8A1', borderRadius: 12, backgroundColor: C.white }, input: { flex: 1, minWidth: 0, minHeight: 54, padding: 14, fontSize: 16, fontFamily: 'Manrope_500Medium', color: C.ink },
  message: { flexDirection: 'row', gap: 8, borderRadius: 12, padding: 16, alignItems: 'flex-start' }, iconTile: { width: 48, height: 48, borderRadius: 16, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center' },
  actionTile: { minHeight: 156, height: '100%', borderWidth: 2, borderRadius: 20, padding: 20, gap: 16, justifyContent: 'space-between' },
  choice: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 12, borderWidth: 2, borderColor: C.line, backgroundColor: C.white },
  tabs: { flexDirection: 'row', gap: 8, paddingHorizontal: 12, paddingVertical: 8, backgroundColor: C.white, borderTopWidth: 1, borderColor: C.line }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 60, gap: 4, paddingVertical: 4, borderRadius: 12 },
});
