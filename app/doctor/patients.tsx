import Ionicons from '@expo/vector-icons/Ionicons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { User } from 'firebase/auth';

import { auth } from '../../firebase/firebaseConfig';
import { invitePatientByEmail, listDoctorPatients, type DoctorPatientLink } from '../../src/utils/doctorPatients';
import { createGeneratedPlan, listUserGeneratedPlans, type GeneratedPlan } from '../../src/utils/generatedPlans';
import { createRoutine, listUserRoutines, type Routine } from '../../src/utils/userRotuines';
import type { Profile } from '../../src/types';
import { getJSON } from '../../src/utils/storage';

export default function PatientsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ invite?: string; email?: string }>();

  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<DoctorPatientLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [doctorRoutines, setDoctorRoutines] = useState<Routine[]>([]);
  const [doctorGeneratedPlans, setDoctorGeneratedPlans] = useState<GeneratedPlan[]>([]);
  const [assignTarget, setAssignTarget] = useState<DoctorPatientLink | null>(null);
  const [assigningPlanId, setAssigningPlanId] = useState<string | null>(null);
  const invitePromptedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const p = await getJSON<Profile>('profile');
      setProfile(p);
    })();
  }, []);

  useEffect(() => {
    let active = true;
    const loadPlans = async () => {
      const user = auth.currentUser;
      if (!user) {
        if (active) {
          setDoctorRoutines([]);
          setDoctorGeneratedPlans([]);
        }
        return;
      }
      try {
        const [manual, generated] = await Promise.all([
          listUserRoutines(user.uid),
          listUserGeneratedPlans(user.uid),
        ]);
        if (!active) return;
        setDoctorRoutines(manual);
        setDoctorGeneratedPlans(generated);
      } catch (err) {
        console.error('Failed to load plans', err);
      }
    };
    loadPlans();
    return () => {
      active = false;
    };
  }, []);

  const loadPatients = useCallback(
    async (mode: 'full' | 'silent' = 'full') => {
      const user = auth.currentUser;
      if (!user) {
        setPatients([]);
        setLoading(false);
        setRefreshing(false);
        Alert.alert('Not signed in', 'Please sign in as a doctor to load patients.');
        return;
      }
      if (mode === 'full') setLoading(true);
      try {
        const list = await listDoctorPatients(user.uid);
        setPatients(list);
      } catch (err) {
        console.error('Failed to load patients', err);
        Alert.alert('Error', 'Unable to load your patients right now.');
      } finally {
        if (mode === 'full') setLoading(false);
        else setRefreshing(false);
      }
    },
    [],
  );

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPatients('silent');
  }, [loadPatients]);

  const handleInviteSubmit = useCallback(async () => {
    const email = inviteEmail.trim();
    if (!email) {
      Alert.alert('Email required', 'Please enter a patient email to send an invite.');
      return;
    }
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Not signed in', 'Please sign in as a doctor to send invites.');
      return;
    }
    setSendingInvite(true);
    try {
      const doctorName = profile?.firstName ?? user.displayName ?? 'Doctor';
      await invitePatientByEmail(user, email, { doctorName });
      Alert.alert('Invite sent', `An invite was sent to ${email}.`);
      setInviteModalVisible(false);
      setInviteEmail('');
      loadPatients();
    } catch (err: any) {
      console.error('Failed to send invite', err);
      Alert.alert('Error', err?.message ?? 'Could not send invite.');
    } finally {
      setSendingInvite(false);
    }
  }, [inviteEmail, loadPatients, profile]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return patients;
    return patients.filter((p) => {
      const name = (p.patientName ?? '').toLowerCase();
      const email = (p.invitedEmail ?? '').toLowerCase();
      const profileName = `${p.patientProfile?.firstName ?? ''} ${p.patientProfile?.lastName ?? ''}`.toLowerCase();
      const status = (p.status ?? '').toLowerCase();
      return (
        name.includes(q) ||
        email.includes(q) ||
        profileName.includes(q) ||
        status.includes(q)
      );
    });
  }, [patients, query]);

  const openInviteModal = useCallback((prefill?: string) => {
    if (prefill) setInviteEmail(prefill);
    setInviteModalVisible(true);
  }, []);

  const inviteParam = typeof params.invite === 'string' ? params.invite : undefined;
  const emailParam = typeof params.email === 'string' ? params.email : undefined;

  useEffect(() => {
    if (!inviteParam) return;
    if (invitePromptedRef.current) return;
    invitePromptedRef.current = true;
    openInviteModal(emailParam);
  }, [inviteParam, emailParam, openInviteModal]);

  const handleAssignPlan = useCallback(
    async (
      patient: DoctorPatientLink,
      plan: { kind: 'routine' | 'generated'; data: Routine | GeneratedPlan }
    ) => {
      if (!patient.patientUid) {
        Alert.alert('Unavailable', 'This patient must accept the invite before assigning plans.');
        return;
      }
      const pseudoPatient = { uid: patient.patientUid } as User;
      const planKey = `${plan.kind}:${plan.data.id}`;
      setAssigningPlanId(planKey);
      try {
        const basePayload = {
          name: plan.data.name || 'Untitled Plan',
          description: plan.data.description || '',
          duration: plan.data.duration,
          visibility: plan.data.visibility ?? 'Private',
          exercises: plan.data.exercises ?? [],
          summary: plan.data.summary,
        };
        if (plan.kind === 'routine') {
          await createRoutine(pseudoPatient, basePayload);
        } else {
          await createGeneratedPlan(pseudoPatient, basePayload);
        }
        Alert.alert('Plan assigned', `${basePayload.name} is now available to ${patient.patientName ?? 'your patient'}.`);
        setAssignTarget(null);
      } catch (err: any) {
        console.error('Failed to assign plan', err);
        Alert.alert('Error', err?.message ?? 'Could not assign this plan.');
      } finally {
        setAssigningPlanId(null);
      }
    },
    [],
  );

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color="#22c55e" />
          <Text style={styles.loadingText}>Loading patients…</Text>
        </View>
      );
    }

    if (filtered.length === 0) {
      return (
        <View style={styles.emptyWrap}>
          <Ionicons name="people-outline" size={36} color="#9ca3af" />
          <Text style={styles.emptyText}>
            {patients.length === 0 ? 'No patients yet. Invite someone to get started.' : `No patients match “${query}”.`}
          </Text>
        </View>
      );
    }

    return filtered.map((p) => {
      const profileName = `${p.patientProfile?.firstName ?? ''} ${p.patientProfile?.lastName ?? ''}`.trim();
      const name = profileName || p.patientName || p.invitedEmail || 'Pending invite';
      const sub = p.patientProfile?.email ?? patientSubLabel(p);
      const statusLabel = humanStatus(p.status);
      const progress = Number.isFinite(p.progressPercent) ? Math.round(p.progressPercent ?? 0) : 0;
      const isActive = p.status === 'active' && !!p.patientUid;

      return (
        <View key={p.id} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={[styles.avatar, avatarBg(p.status)]}>
                <Text style={styles.avatarText}>{initials(p)}</Text>
              </View>
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.cardTitle} numberOfLines={1}>{name}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{sub}</Text>
              </View>
            </View>
            <View style={[styles.badge, badgeStyle(p.status)]}>
              <Text style={[styles.badgeText, badgeTextStyle(p.status)]}>{statusLabel}</Text>
            </View>
          </View>

          <View style={[styles.rowBetween, { marginTop: 12 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={styles.metaLabel}>Progress: </Text>
              <Text style={styles.metaValue}>{progress}%</Text>
            </View>

            {isActive ? (
              <TouchableOpacity
                style={styles.outlineBtn}
                onPress={() => setAssignTarget(p)}
                accessibilityRole="button"
              >
                <Text style={styles.outlineBtnText}>Assign Routine</Text>
              </TouchableOpacity>
            ) : (
              <View style={[styles.outlineBtn, styles.outlineBtnDisabled]}>
                <Text style={[styles.outlineBtnText, styles.outlineBtnTextMuted]}>{statusButtonText(p.status)}</Text>
              </View>
            )}
          </View>
        </View>
      );
    });
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Patients</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={{ padding: 16 }}>
        <View style={styles.searchActions}>
          <View style={[styles.searchWrap, { flex: 1 }]}>
            <Ionicons name="search-outline" size={18} color="#6b7280" style={styles.searchIcon} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search patients..."
              placeholderTextColor="#9ca3af"
              style={styles.searchInput}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            style={styles.inviteBtn}
            onPress={() => openInviteModal()}
          >
            <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
            <Text style={styles.inviteBtnText}>Invite</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 }}
        refreshControl={<RefreshControl tintColor="#fff" refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        {renderContent()}
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
            <Text style={styles.modalSub}>Send them an email invite to connect and track progress.</Text>

            <TextInput
              value={inviteEmail}
              onChangeText={setInviteEmail}
              placeholder="patient@email.com"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              style={[styles.searchInput, { width: '100%', backgroundColor: '#F3F4F6', color: '#111827' }]}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.outlineBtn, styles.modalCancelBtn]}
                onPress={() => {
                  setInviteModalVisible(false);
                  setInviteEmail('');
                }}
              >
                <Text style={styles.outlineBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.primaryBtn, styles.modalActionSpacer, sendingInvite && styles.primaryBtnDisabled]}
                onPress={handleInviteSubmit}
                disabled={sendingInvite}
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

      <Modal
        visible={!!assignTarget}
        transparent
        animationType="fade"
        onRequestClose={() => setAssignTarget(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.assignModalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Assign routine</Text>
              <TouchableOpacity accessibilityRole="button" onPress={() => setAssignTarget(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#111827" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>
              Share one of your routines or AI plans with {assignTarget?.patientName ?? assignTarget?.invitedEmail ?? 'this patient'}.
            </Text>

            <ScrollView style={{ maxHeight: 420 }} contentContainerStyle={{ paddingBottom: 8 }}>
              <Text style={styles.modalSectionTitle}>Saved Routines</Text>
              {doctorRoutines.length === 0 ? (
                <Text style={styles.modalEmptyText}>No saved routines yet.</Text>
              ) : (
                doctorRoutines.map((plan) => {
                  const key = `routine:${plan.id}`;
                  const busy = assigningPlanId === key;
                  const exercisesCount = plan.summary?.totalExercises ?? plan.exercises?.length ?? 0;
                  return (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{plan.name || 'Untitled Routine'}</Text>
                        <Text style={styles.planMeta}>
                          {exercisesCount} exercises · {plan.duration ?? 'duration n/a'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={[styles.planAssignBtn, busy && styles.disabledBtn]}
                        onPress={() => assignTarget && handleAssignPlan(assignTarget, { kind: 'routine', data: plan })}
                        disabled={busy}
                      >
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.planAssignBtnText}>Assign</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}

              <Text style={[styles.modalSectionTitle, { marginTop: 20 }]}>AI Plans</Text>
              {doctorGeneratedPlans.length === 0 ? (
                <Text style={styles.modalEmptyText}>No generated plans yet.</Text>
              ) : (
                doctorGeneratedPlans.map((plan) => {
                  const key = `generated:${plan.id}`;
                  const busy = assigningPlanId === key;
                  const exercisesCount = plan.summary?.totalExercises ?? plan.exercises?.length ?? 0;
                  return (
                    <View key={plan.id} style={styles.planCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.planTitle}>{plan.name || 'AI Plan'}</Text>
                        <Text style={styles.planMeta}>
                          {exercisesCount} exercises · {plan.duration ?? 'duration n/a'}
                        </Text>
                      </View>
                      <TouchableOpacity
                        accessibilityRole="button"
                        style={[styles.planAssignBtn, busy && styles.disabledBtn]}
                        onPress={() => assignTarget && handleAssignPlan(assignTarget, { kind: 'generated', data: plan })}
                        disabled={busy}
                      >
                        {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.planAssignBtnText}>Assign</Text>}
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function initials(p: DoctorPatientLink) {
  if (p.patientName) {
    return p.patientName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((chunk) => chunk[0]?.toUpperCase() ?? '')
      .join('') || 'PT';
  }
  if (p.invitedEmail) {
    return p.invitedEmail[0]?.toUpperCase() ?? 'PT';
  }
  return 'PT';
}

function avatarBg(status: DoctorPatientLink['status']) {
  switch (status) {
    case 'active': return { backgroundColor: '#22c55e' };
    case 'pending': return { backgroundColor: '#38bdf8' };
    case 'invited': return { backgroundColor: '#a78bfa' };
    case 'declined': return { backgroundColor: '#f87171' };
    default: return { backgroundColor: '#6b7280' };
  }
}

function badgeStyle(status: DoctorPatientLink['status']) {
  switch (status) {
    case 'active': return { backgroundColor: '#DCFCE7' };
    case 'pending': return { backgroundColor: '#E0F2FE' };
    case 'invited': return { backgroundColor: '#EDE9FE' };
    case 'declined': return { backgroundColor: '#FEE2E2' };
    default: return { backgroundColor: '#E5E7EB' };
  }
}

function badgeTextStyle(status: DoctorPatientLink['status']) {
  switch (status) {
    case 'active': return { color: '#166534' };
    case 'pending': return { color: '#075985' };
    case 'invited': return { color: '#6D28D9' };
    case 'declined': return { color: '#991B1B' };
    default: return { color: '#111827' };
  }
}

function humanStatus(status: DoctorPatientLink['status']) {
  switch (status) {
    case 'active': return 'Active';
    case 'pending': return 'Pending';
    case 'invited': return 'Invited';
    case 'declined': return 'Declined';
    default: return 'Unknown';
  }
}

function patientSubLabel(p: DoctorPatientLink) {
  if (p.status === 'active' && p.patientUid) return 'Connected';
  if (p.status === 'pending') return 'Awaiting acceptance';
  if (p.status === 'invited') return 'Invite sent';
  if (p.status === 'declined') return 'Invite declined';
  return 'Pending';
}

function statusButtonText(status: DoctorPatientLink['status']) {
  switch (status) {
    case 'pending': return 'Awaiting acceptance';
    case 'invited': return 'Invite sent';
    case 'declined': return 'Invite declined';
    default: return 'Unavailable';
  }
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
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: '#374151' },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 18 },

  searchActions: { flexDirection: 'row', alignItems: 'center' },
  searchWrap: { position: 'relative' },
  searchIcon: { position: 'absolute', left: 12, top: 12 },
  searchInput: {
    backgroundColor: '#1f2937',
    color: '#fff',
    paddingVertical: 10,
    paddingLeft: 38,
    paddingRight: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },

  inviteBtn: {
    backgroundColor: '#22c55e',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  inviteBtnText: { color: '#fff', fontWeight: '700' },

  card: { backgroundColor: '#ffffff', borderRadius: 12, padding: 14, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#ffffff', fontWeight: '700' },
  cardTitle: { color: '#111827', fontWeight: '600' },
  cardSub: { color: '#6b7280', fontSize: 12, marginTop: 2 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 9999 },
  badgeText: { fontWeight: '600', fontSize: 12 },

  metaLabel: { color: '#6b7280', fontSize: 13 },
  metaValue: { color: '#111827', fontWeight: '700', fontSize: 13 },

  outlineBtn: {
    borderWidth: 1, borderColor: '#D1D5DB', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
    backgroundColor: '#fff',
  },
  outlineBtnText: { color: '#111827', fontWeight: '600' },
  outlineBtnDisabled: { borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  outlineBtnTextMuted: { color: '#9ca3af' },

  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#22c55e',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: '#fff', fontWeight: '700' },

  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  assignModalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
  },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSub: { color: '#6b7280', marginTop: 4, marginBottom: 16 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  modalCloseBtn: { padding: 4 },
  modalSectionTitle: { color: '#111827', fontWeight: '700', marginTop: 8 },
  modalActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 16 },
  modalCancelBtn: { marginRight: 10 },
  modalActionSpacer: { marginLeft: 10 },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  planTitle: { color: '#111827', fontWeight: '600' },
  planMeta: { color: '#6b7280', marginTop: 4, fontSize: 12 },
  planAssignBtn: {
    backgroundColor: '#22c55e',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginLeft: 12,
  },
  planAssignBtnText: { color: '#fff', fontWeight: '700' },

  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: { color: '#9ca3af', marginTop: 8 },
  emptyWrap: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  disabledBtn: { opacity: 0.6 },
});
