import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { auth } from '../../firebase/firebaseConfig';
import type { Profile } from '../../src/types';
import { invitePatientByEmail } from '../../src/utils/doctorPatients';
import { getJSON } from '../../src/utils/storage';

export default function DoctorDashboardScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>('profile');
      setProfile(p);
    })();
  }, []);

  const displayName = profile
    ? `${profile.userType === 'doctor' ? 'Dr. ' : ''}${profile.firstName}`
    : 'Dr. Alex';

  
  const subTitle = 'Doctor/Therapist'; 

  return (
    <View style={styles.screen}>
      {/* Custom Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.h1}>{displayName}</Text>
          <Text style={styles.h2}>{subTitle}</Text>
        </View>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.push('/doctor/settings')}
          style={styles.iconBtn}
        >
          <Ionicons name="settings-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push('/doctor/patients')}
        >
          <Ionicons name="people-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Manage Patients</Text>
            <Text style={styles.actionSub}>View and assign routines</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => setInviteModalVisible(true)}
        >
          <Ionicons name="person-add-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Invite Patients</Text>
            <Text style={styles.actionSub}>Send a connection email</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push('/doctor/plans')}
        >
          <Ionicons name="document-text-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>AI Plans</Text>
            <Text style={styles.actionSub}>Generate and share programs</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.actionCard}
          onPress={() => router.push('/doctor/create')}
        >
          <Ionicons name="add-circle-outline" size={22} color="#111827" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.actionTitle}>Create New Routine</Text>
            <Text style={styles.actionSub}>Build custom recovery plans</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#6b7280" />
        </TouchableOpacity>

        {/* Optional: quick stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>18</Text>
            <Text style={styles.statLabel}>Active Patients</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5</Text>
            <Text style={styles.statLabel}>Plans Pending</Text>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={inviteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInviteModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Invite a patient</Text>
            <Text style={styles.modalSub}>Send them an email to connect with your practice.</Text>

            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="patient@email.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              style={styles.modalInput}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.outlineBtn, styles.modalBtn]}
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteEmail('');
                }}
                accessibilityRole="button"
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryBtn, styles.modalBtn, sendingInvite && styles.primaryBtnDisabled]}
                onPress={async () => {
                  const email = inviteEmail.trim();
                  if (!email) {
                    Alert.alert('Email required', 'Please enter a patient email.');
                    return;
                  }
                  const user = auth.currentUser;
                  if (!user) {
                    Alert.alert('Not signed in', 'Please sign in as a doctor to invite patients.');
                    return;
                  }
                  setSendingInvite(true);
                  try {
                    const doctorName = profile?.firstName ?? user.displayName ?? 'Doctor';
                    await invitePatientByEmail(user, email, { doctorName });
                    Alert.alert('Invite sent', `An invite was sent to ${email}.`);
                    setInviteModalVisible(false);
                    setInviteEmail('');
                  } catch (err: any) {
                    Alert.alert('Error', err?.message ?? 'Could not send invite.');
                  } finally {
                    setSendingInvite(false);
                  }
                }}
                disabled={sendingInvite}
                accessibilityRole="button"
              >
                {sendingInvite ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" style={{ marginRight: 6 }} />
                    <Text style={styles.primaryBtnText}>Send Invite</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#111827' },

  header: {
    paddingTop: 22,
    paddingBottom: 14,
    paddingHorizontal: 16,
    backgroundColor: '#25292e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  h1: { color: '#fff', fontWeight: '700', fontSize: 20 },
  h2: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  iconBtn: { padding: 8, borderRadius: 9999, backgroundColor: '#374151' },

  body: { padding: 16 },
  sectionTitle: { color: '#fff', fontWeight: '700', fontSize: 18, marginBottom: 10 },

  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionTitle: { color: '#111827', fontWeight: '600' },
  actionSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  statsRow: { flexDirection: 'row', marginTop: 8 },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingVertical: 16,
    alignItems: 'center',
    marginRight: 8,
  },
  statNumber: { color: '#22c55e', fontWeight: '800', fontSize: 20 },
  statLabel: { color: '#6b7280', fontSize: 12 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSub: { color: '#6b7280', marginTop: 4, marginBottom: 16 },
  modalInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#111827',
    backgroundColor: '#F3F4F6',
  },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 },
  modalBtn: { marginLeft: 10 },
  outlineBtn: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { color: '#111827', fontWeight: '600' },
  primaryBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },
});
// Note: Adjust the import paths for Profile type and getJSON function based on your project structure.
