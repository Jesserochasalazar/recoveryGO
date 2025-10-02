// app/index.tsx
import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { auth } from "../firebase/firebaseConfig";

const db = getFirestore();

export default function SignInScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function postAuthRoute(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    const onboarded = snap.exists() ? snap.data()?.onboarded === true : false;
    if (onboarded) {
      router.replace("/patient/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }

  const signInEmail = async () => {
    setBusy(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  const signUpEmail = async () => {
    setBusy(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Account creation failed");
    } finally {
      setBusy(false);
    }
  };

  const signInGoogle = async () => {
    setBusy(true);
    try {
      const provider = new GoogleAuthProvider();
      // Works on web; on native you’ll likely swap to AuthSession (see notes below)
      const cred = await signInWithPopup(auth, provider);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Google sign-in failed");
    } finally {
      setBusy(false);
    }
  };

  const canSubmit = email.length > 3 && password.length >= 6;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#111827" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.screen}>
        {/* Brand */}
        <View style={styles.brandWrap}>
          <View style={styles.brandLogo}>
            <Text style={styles.brandLogoText}>R</Text>
          </View>
          <Text style={styles.brandTitle}>recoveryGO</Text>
          <Text style={styles.brandSub}>Your recovery companion</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          {/* Google first (v0 vibe) */}
          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.googleBtn, busy && styles.disabled]}
            onPress={signInGoogle}
            disabled={busy}
          >
            <View style={styles.googleRow}>
              {/* simple “G” to avoid svg dependency */}
              <Text style={styles.googleG}>G</Text>
              <Text style={styles.googleText}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.dividerWrap}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>Or</Text>
            <View style={styles.divider} />
          </View>

          {/* Email/Password */}
          <View style={{ marginTop: 4 }}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="alex@email.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              keyboardType="email-address"
              style={styles.input}
              editable={!busy}
            />
          </View>
          <View style={{ marginTop: 12 }}>
            <Text style={styles.label}>Password</Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              secureTextEntry
              style={styles.input}
              editable={!busy}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={[styles.primaryBtn, (!canSubmit || busy) && styles.primaryBtnDisabled]}
            onPress={mode === "signIn" ? signInEmail : signUpEmail}
            disabled={!canSubmit || busy}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {mode === "signIn" ? "Sign in" : "Create account"}
              </Text>
            )}
          </TouchableOpacity>

          {/* Mode toggle */}
          <View style={styles.switchRow}>
            <Text style={styles.switchText}>
              {mode === "signIn" ? "Don't have an account?" : "Already have an account?"}
            </Text>
            <TouchableOpacity
              onPress={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
              accessibilityRole="button"
            >
              <Text style={styles.switchLink}>
                {mode === "signIn" ? "Sign up" : "Sign in"}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Terms */}
        <Text style={styles.terms}>
          By continuing, you agree to our <Text style={styles.underline}>Terms of Service</Text> and{" "}
          <Text style={styles.underline}>Privacy Policy</Text>.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    alignItems: "center",
  },
  brandWrap: { alignItems: "center", marginTop: 24, marginBottom: 16 },
  brandLogo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#22c55e",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  brandLogoText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  brandTitle: { color: "#fff", fontSize: 24, fontWeight: "800" },
  brandSub: { color: "#9ca3af", marginTop: 2 },

  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3,
  },

  googleBtn: {
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    alignItems: "center",
  },
  googleRow: { flexDirection: "row", alignItems: "center" },
  googleG: { fontWeight: "800", marginRight: 10, color: "#4285f4", fontSize: 16, width: 18, textAlign: "center" },
  googleText: { color: "#111827", fontWeight: "700" },

  dividerWrap: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  divider: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  dividerText: { color: "#6b7280", marginHorizontal: 8, fontSize: 12 },

  label: { color: "#374151", fontWeight: "600", marginBottom: 6 },
  input: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#111827",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },

  primaryBtn: {
    marginTop: 16,
    backgroundColor: "#22c55e",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { color: "#fff", fontWeight: "800" },

  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 12 },
  switchText: { color: "#6b7280", marginRight: 6 },
  switchLink: { color: "#22c55e", fontWeight: "700" },

  terms: { color: "#9ca3af", fontSize: 12, textAlign: "center", marginTop: 14 },
  underline: { textDecorationLine: "underline" },

  disabled: { opacity: 0.6 },
});
