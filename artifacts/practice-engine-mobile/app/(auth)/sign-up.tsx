import React, { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { Link, router } from 'expo-router';
import { useAuth, useSignUp } from '@clerk/expo';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Field, ScreenTitle } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function SignUp() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const busy = fetchStatus === 'fetching';
  const needsCode = signUp.status === 'missing_requirements' && signUp.unverifiedFields.includes('email_address');

  const start = async () => {
    if (busy) return;
    setNotice(null);
    const result = await signUp.password({ emailAddress: email.trim(), password });
    if (result.error) return setNotice(result.error.message);
    await signUp.verifications.sendEmailCode();
    setNotice('Check your email for a verification code.');
  };
  const verify = async () => {
    if (busy) return;
    setNotice(null);
    const result = await signUp.verifications.verifyEmailCode({ code: code.trim() });
    if (result.error) return setNotice(result.error.message);
    if (signUp.status === 'complete') await signUp.finalize({ navigate: () => router.replace('/') });
    else setNotice('Please complete the required account details.');
  };

  if (isSignedIn) { router.replace('/'); return null; }
  return <KeyboardAwareScrollViewCompat style={{ flex: 1, backgroundColor: c.background }} contentContainerStyle={[styles.wrap, { paddingTop: Platform.OS === 'web' ? 87 : insets.top + 24 }]} bottomOffset={30}>
    <View style={styles.panel}>
      <ScreenTitle kicker="Startup Man" title={needsCode ? 'Verify your email' : 'Build your practice record'} detail={needsCode ? 'Confirm your email to protect your private workspace.' : 'Your client experiences stay connected to your development.'} />
      {needsCode ? <>
        <Field value={code} onChangeText={setCode} placeholder="Verification code" autoCapitalize="none" keyboardType="number-pad" />
        <Button testID="verify-signup" label={busy ? 'Verifying' : 'Verify and continue'} onPress={() => void verify()} disabled={!code.trim() || busy} />
        <Button label="Send a new code" secondary onPress={() => void signUp.verifications.sendEmailCode()} disabled={busy} />
      </> : <>
        <Field label="Email" value={email} onChangeText={setEmail} placeholder="you@practice.com" autoCapitalize="none" keyboardType="email-address" />
        <Field label="Password" value={password} onChangeText={setPassword} placeholder="Create a password" secureTextEntry autoCapitalize="none" />
        <Button testID="sign-up-submit" label={busy ? 'Creating account' : 'Create account'} onPress={() => void start()} disabled={!email.trim() || !password || busy} />
        <Text style={[styles.footer, { color: c.mutedForeground }]}>Already a member? <Link href="/(auth)/sign-in" style={{ color: c.primary }}>Sign in</Link></Text>
        <View nativeID="clerk-captcha" />
      </>}
      {notice ? <Text accessibilityRole="alert" style={{ color: c.destructive }}>{notice}</Text> : null}
      {errors.global?.[0]?.message ? <Text accessibilityRole="alert" style={{ color: c.destructive }}>{errors.global[0].message}</Text> : null}
    </View>
  </KeyboardAwareScrollViewCompat>;
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 36, justifyContent: 'center' },
  panel: { width: '100%', maxWidth: 460, alignSelf: 'center', gap: 14 },
  footer: { textAlign: 'center', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
});