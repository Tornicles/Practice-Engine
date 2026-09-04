import React, { useCallback, useEffect, useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { Link, router } from 'expo-router';
import { useAuth, useSignIn, useSSO } from '@clerk/expo';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';
import { Button, Field, ScreenTitle } from '@/components/UI';
import { useColors } from '@/hooks/useColors';
WebBrowser.maybeCompleteAuthSession();
function message(errors: unknown): string | null { const e = errors as { global?: { message?: string } }; return e?.global?.message ?? null; }
export default function SignIn() {
 const c=useColors(); const { signIn, errors, fetchStatus }=useSignIn(); const { startSSOFlow }=useSSO(); const { isSignedIn }=useAuth();
 const [email,setEmail]=useState(''); const [password,setPassword]=useState(''); const [code,setCode]=useState(''); const [notice,setNotice]=useState<string | null>(null);
 useEffect(()=>{if(Platform.OS==='android'){void WebBrowser.warmUpAsync(); return ()=>{void WebBrowser.coolDownAsync();};}},[]);
 const finalize=async()=>{await signIn.finalize({navigate:()=>{router.replace('/');}});};
 const submit=async()=>{setNotice(null); const result=await signIn.password({emailAddress:email,password}); if(result.error){setNotice(result.error.message);return;} if(signIn.status==='complete') await finalize(); else if(signIn.status==='needs_client_trust'){const f=signIn.supportedSecondFactors.find(x=>x.strategy==='email_code');if(f){await signIn.mfa.sendEmailCode();setNotice('A verification code was sent to your email.');}else setNotice('This sign-in needs an additional verification method.');} else setNotice('Additional verification is required.');};
 const verify=async()=>{const r=await signIn.mfa.verifyEmailCode({code});if(r.error){setNotice(r.error.message);return;}if(signIn.status==='complete')await finalize();};
 const google=useCallback(async()=>{try{const r=await startSSOFlow({strategy:'oauth_google',redirectUrl:AuthSession.makeRedirectUri()});if(r.createdSessionId) await r.setActive?.({session:r.createdSessionId,navigate:()=>{router.replace('/');}}); else setNotice('Google sign-in needs additional verification.');}catch{setNotice('Google sign-in could not be completed. Please try again.');}},[startSSOFlow]);
 if(isSignedIn){router.replace('/');return null;} const trust=signIn.status==='needs_client_trust';
 return <KeyboardAwareScrollViewCompat style={{flex:1,backgroundColor:c.background}} contentContainerStyle={[styles.wrap,{paddingTop:Platform.OS==='web'?87:36}]} bottomOffset={30}><View style={styles.panel}><ScreenTitle kicker="Startup Man" title={trust?'Verify this device':'Your private practice instrument'} detail={trust?'Enter the code sent to your trusted email.':'Turn today’s client work into durable expertise.'}/>{trust?<><Field value={code} onChangeText={setCode} placeholder="Verification code"/><Button testID="verify-signin" label="Verify and continue" onPress={()=>void verify()} disabled={!code||fetchStatus==='fetching'}/><Button label="Send a new code" secondary onPress={()=>void signIn.mfa.sendEmailCode()}/></>:<><Field label="Email" value={email} onChangeText={setEmail} placeholder="you@practice.com"/><Field label="Password" value={password} onChangeText={setPassword} placeholder="Your password" secureTextEntry/><Button testID="sign-in-submit" label="Continue" onPress={()=>void submit()} disabled={!email||!password||fetchStatus==='fetching'}/><Button testID="google-signin" label="Continue with Google" secondary onPress={()=>void google()}/><Text style={[styles.footer,{color:c.mutedForeground}]}>New here? <Link href="/(auth)/sign-up" style={{color:c.primary}}>Create an account</Link></Text></>}{notice||message(errors)?<Text style={{color:c.destructive}}>{notice??message(errors)}</Text>:null}</View></KeyboardAwareScrollViewCompat>;
}
const styles=StyleSheet.create({wrap:{flexGrow:1,padding:20,paddingBottom:36,justifyContent:'center'},panel:{width:'100%',maxWidth:460,alignSelf:'center',gap:14},footer:{textAlign:'center',fontFamily:'Inter_400Regular',fontSize:13,marginTop:4}});