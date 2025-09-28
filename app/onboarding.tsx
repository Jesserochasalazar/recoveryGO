// app/onboarding.tsx
import { useRouter } from "expo-router";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";
import { Button, StyleSheet, Text, View } from "react-native";
import { auth } from "../firebase/firebaseConfig";

const db = getFirestore();

export default function OnBoardingScreen() {
  const router = useRouter();

  async function completeOnboarding() {
    const user = auth.currentUser;
    if (!user) return; // safety; user should be signed in

    await setDoc(
      doc(db, "users", user.uid),
      {
        uid: user.uid,
        email: user.email ?? "",
        onboarded: true,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    router.replace("/(tabs)/dashboard");
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>OnBoarding Screen</Text>
      {/* …your profile choices UI here… */}
      <Button title="Continue" onPress={completeOnboarding} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#25292e", alignItems: "center", justifyContent: "center" },
  text: { color: "#fff" },
});
