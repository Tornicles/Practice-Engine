import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export const errorMessage = (error: unknown) => {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') return error.message;
  return 'Something went wrong. Please try again.';
};

export function ScreenTitle({ kicker, title, detail }: { kicker?: string; title: string; detail?: string }) {
  const c = useColors();
  return <View style={styles.titleBlock}>{kicker ? <Text style={[styles.kicker, { color: c.primary }]}>{kicker}</Text> : null}<Text style={[styles.title, { color: c.foreground }]}>{title}</Text>{detail ? <Text style={[styles.detail, { color: c.mutedForeground }]}>{detail}</Text> : null}</View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const c = useColors(); return <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border, borderRadius: c.radius }, style]}>{children}</View>;
}
export function Button({ label, onPress, disabled, testID, secondary, icon }: { label: string; onPress: () => void; disabled?: boolean; testID?: string; secondary?: boolean; icon?: keyof typeof Feather.glyphMap }) {
  const c = useColors();
  return <Pressable testID={testID} accessibilityRole="button" disabled={disabled} onPress={() => { void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }} style={({ pressed }) => [styles.button, { backgroundColor: secondary ? c.secondary : c.primary, borderRadius: c.radius, opacity: disabled ? .45 : pressed ? .75 : 1 }, secondary && { borderWidth: 1, borderColor: c.border }]}>
    {icon ? <Feather name={icon} size={16} color={secondary ? c.foreground : c.primaryForeground} /> : null}<Text style={[styles.buttonText, { color: secondary ? c.foreground : c.primaryForeground }]}>{label}</Text>
  </Pressable>;
}
export function Field({ value, onChangeText, placeholder, multiline, secureTextEntry, label }: { value: string; onChangeText: (v: string) => void; placeholder: string; multiline?: boolean; secureTextEntry?: boolean; label?: string }) {
  const c = useColors(); return <View style={styles.field}>{label ? <Text style={[styles.label, { color: c.mutedForeground }]}>{label}</Text> : null}<TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={c.mutedForeground} multiline={multiline} secureTextEntry={secureTextEntry} autoCapitalize="sentences" style={[styles.input, { color: c.foreground, backgroundColor: c.background, borderColor: c.input, borderRadius: c.radius }, multiline && styles.multiline]} /></View>;
}
export function State({ loading, error, retry, empty }: { loading?: boolean; error?: unknown; retry?: () => void; empty?: string }) {
  const c = useColors(); if (loading) return <View style={styles.state}><ActivityIndicator color={c.primary}/><Text style={{ color: c.mutedForeground }}>Loading your workspace</Text></View>;
  if (error) return <View style={styles.state}><Text style={{ color: c.destructive }}>{errorMessage(error)}</Text>{retry ? <Button label="Retry" onPress={retry} secondary testID="retry-button"/> : null}</View>;
  return <View style={styles.state}><Feather name="archive" size={22} color={c.mutedForeground}/><Text style={{ color: c.mutedForeground }}>{empty}</Text></View>;
}
const styles = StyleSheet.create({
  titleBlock:{ gap:5, marginBottom:18 }, kicker:{ fontFamily:'Inter_600SemiBold',fontSize:10,letterSpacing:1.4,textTransform:'uppercase'}, title:{fontFamily:'Inter_700Bold',fontSize:27,letterSpacing:-.8},detail:{fontFamily:'Inter_400Regular',fontSize:14,lineHeight:20},
  card:{borderWidth:1,padding:15,gap:10}, button:{minHeight:46,alignItems:'center',justifyContent:'center',flexDirection:'row',gap:8,paddingHorizontal:15},buttonText:{fontFamily:'Inter_600SemiBold',fontSize:14},
  field:{gap:6},label:{fontFamily:'Inter_500Medium',fontSize:12},input:{borderWidth:1,minHeight:47,paddingHorizontal:12,fontFamily:'Inter_400Regular',fontSize:15},multiline:{minHeight:100,paddingTop:12,textAlignVertical:'top'},
  state:{alignItems:'center',justifyContent:'center',gap:12,paddingVertical:36,paddingHorizontal:18},
});