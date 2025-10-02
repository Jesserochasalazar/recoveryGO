import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Profile, UserType } from '../src/types';
import { setJSON } from '../src/utils/storage';

const userTypes: UserType[] = ['athlete', 'elderly', 'general', 'doctor'];
const genders = ['male', 'female', 'other'] as const;

export default function OnboardingScreen() {
  const router = useRouter();
  const [userType, setUserType] = useState<UserType | null>(null);
  const [gender, setGender] = useState<'male'|'female'|'other' | null>(null);
  const [firstName, setFirst] = useState('');
  const [lastName, setLast] = useState('');
  const [age, setAge] = useState('');

  const onContinue = async () => {
    if (!firstName || !lastName || !age || !gender || !userType) {
      Alert.alert('Missing info', 'Please complete all fields.');
      return;
    }

    const profile: Profile = {
      firstName, lastName,
      gender,
      age: Number(age),
      userType,
      onboarded: true,
    };

    await setJSON('profile', profile);

    if (userType === 'doctor') {
      router.replace('/doctor/dashboard');
    } else {
      router.replace('/patient/dashboard');
    }
  };

  return (
    <KeyboardAvoidingView style={{flex:1}} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.heading}>Welcome to recoveryGO</Text>
        <Text style={styles.sub}>Tell us a little about you</Text>

        {/* Name */}
        <View style={styles.row}>
          <View style={[styles.inputWrap, {marginRight:8}]}>
            <Text style={styles.label}>First name</Text>
            <TextInput
              value={firstName}
              onChangeText={setFirst}
              placeholder="Alex"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>
          <View style={[styles.inputWrap, {marginLeft:8}]}>
            <Text style={styles.label}>Last name</Text>
            <TextInput
              value={lastName}
              onChangeText={setLast}
              placeholder="Smith"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          </View>
        </View>

        {/* Age */}
        <View style={styles.inputWrap}>
          <Text style={styles.label}>Age</Text>
          <TextInput
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
            placeholder="30"
            placeholderTextColor="#9ca3af"
            style={styles.input}
          />
        </View>

        {/* Gender */}
        <Text style={[styles.label,{marginTop:8}]}>Gender</Text>
        <View style={styles.choicesRow}>
          {genders.map(g => (
            <TouchableOpacity key={g}
              onPress={() => setGender(g)}
              style={[styles.choice, gender===g && styles.choiceActive]}>
              <Text style={[styles.choiceText, gender===g && styles.choiceTextActive]}>{g}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* User Type */}
        <Text style={[styles.label,{marginTop:16}]}>I am a…</Text>
        <View style={styles.choicesGrid}>
          {userTypes.map(t => (
            <TouchableOpacity key={t}
              onPress={() => setUserType(t)}
              style={[styles.choiceLarge, userType===t && styles.choiceActive]}>
              <Text style={[styles.choiceText, userType===t && styles.choiceTextActive]}>
                {t === 'general' ? 'general user' : t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue */}
        <TouchableOpacity
          style={[styles.cta, !(firstName && lastName && age && gender && userType) && styles.ctaDisabled]}
          onPress={onContinue}
          disabled={!(firstName && lastName && age && gender && userType)}
        >
          <Text style={styles.ctaText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container:{ flexGrow:1, padding:20, backgroundColor:'#fff' },
  heading:{ fontSize:24, fontWeight:'700', color:'#111827', marginTop:8 },
  sub:{ color:'#6b7280', marginBottom:16 },
  row:{ flexDirection:'row' },
  inputWrap:{ flex:1, marginTop:12 },
  label:{ color:'#374151', marginBottom:6, fontWeight:'600' },
  input:{
    backgroundColor:'#F3F4F6', borderRadius:10, paddingHorizontal:14, paddingVertical:12, color:'#111827'
  },
  choicesRow:{ flexDirection:'row', marginTop:8 },
  choicesGrid:{ flexDirection:'row', flexWrap:'wrap', marginTop:8 },
  choice:{
    borderWidth:1, borderColor:'#E5E7EB', borderRadius:9999, paddingVertical:10, paddingHorizontal:16, marginRight:8
  },
  choiceLarge:{
    borderWidth:1, borderColor:'#E5E7EB', borderRadius:12, paddingVertical:14, paddingHorizontal:18, marginRight:8, marginTop:8
  },
  choiceActive:{ backgroundColor:'#DCFCE7', borderColor:'#22C55E' },
  choiceText:{ color:'#374151', textTransform:'capitalize', fontWeight:'600' },
  choiceTextActive:{ color:'#065F46' },
  cta:{ backgroundColor:'#22C55E', marginTop:24, paddingVertical:16, borderRadius:12, alignItems:'center' },
  ctaDisabled:{ opacity:0.6 },
  ctaText:{ color:'#fff', fontWeight:'700', fontSize:16 }
});
