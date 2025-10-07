import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type AccountType = "patient" | "doctor";

export default function SettingsContent({ accountType }: { accountType: AccountType }) {
  return (
    <View style={styles.screen}>
      {/* Header (local, since tab headers are hidden) */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Accessibility */}
        <Text style={styles.sectionTitle}>Accessibility</Text>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <Ionicons name="volume-high-outline" size={20} color="#6b7280" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.cardTitle}>Text to Speech</Text>
                <Text style={styles.cardSub}>Read exercise instructions aloud</Text>
              </View>
            </View>
            {/* Static toggle look (no functionality) */}
            <View style={[styles.switch, { backgroundColor: "#22c55e" }]}>
              <View style={[styles.switchKnob, { alignSelf: "flex-end" }]} />
            </View>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <Ionicons name="text-outline" size={20} color="#6b7280" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.cardTitle}>Large Text</Text>
                <Text style={styles.cardSub}>Increase font size</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.pillBtn}>
              <Text style={styles.pillBtnText}>Large</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={styles.rowCenter}>
              <Ionicons name="contrast-outline" size={20} color="#6b7280" style={{ marginRight: 10 }} />
              <View>
                <Text style={styles.cardTitle}>High Contrast</Text>
                <Text style={styles.cardSub}>Better visibility</Text>
              </View>
            </View>
            {/* Off state */}
            <View style={[styles.switch, { backgroundColor: "#e5e7eb" }]}>
              <View style={[styles.switchKnob, { alignSelf: "flex-start" }]} />
            </View>
          </View>
        </View>

        {/* General */}
        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>General</Text>

        <TouchableOpacity style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Notifications</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Privacy</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card}>
          <View style={styles.rowBetween}>
            <Text style={styles.cardTitle}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={18} color="#9ca3af" />
          </View>
        </TouchableOpacity>

        {/* Patient-only section */}
        {accountType === "patient" && (
          <>
            <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Lock Screen Widget</Text>
            <View style={styles.card}>
              <View style={[styles.rowBetween, { marginBottom: 8 }]}>
                <Text style={styles.cardTitle}>Enable Widget</Text>
                {/* Off by default (UI only) */}
                <View style={[styles.switch, { backgroundColor: "#e5e7eb" }]}>
                  <View style={[styles.switchKnob, { alignSelf: "flex-start" }]} />
                </View>
              </View>
              <Text style={styles.cardSub}>
                Quick access to daily exercises from your lock screen. Widget refreshes daily and syncs with main app data.
              </Text>
            </View>
          </>
        )}

        {/* Spacer so last card isn't hidden under the tab bar */}
        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#111827" },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#1f2937", marginBottom: 10 },
  card: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  rowCenter: { flexDirection: "row", alignItems: "center" },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1f2937" },
  cardSub: { fontSize: 13, color: "#6b7280", marginTop: 2, lineHeight: 18 },
  pillBtn: {
    borderColor: "#e5e7eb",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
  pillBtnText: { color: "#1f2937", fontWeight: "600" },
  switch: {
    width: 44,
    height: 26,
    borderRadius: 999,
    padding: 3,
    justifyContent: "center",
  },
  switchKnob: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: "#ffffff",
  },
});
