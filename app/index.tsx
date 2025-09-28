import { useRouter } from "expo-router";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { doc, getDoc, getFirestore } from "firebase/firestore";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../firebase/firebaseConfig";

const db = getFirestore();

export default function SignInScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function postAuthRoute(uid: string) {
    const snap = await getDoc(doc(db, "users", uid));
    const onboarded = snap.exists() ? snap.data()?.onboarded === true : false;
    if (onboarded) {
      router.replace("../(tabs)/dashboard");
    } else {
      router.replace("/onboarding");
    }
  }

  const signInEmail = async () => {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const signUpEmail = async () => {
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const signInGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(auth, provider);
      await postAuthRoute(cred.user.uid);
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Email:</Text>
      <TextInput value={email} onChangeText={setEmail} />
      <Text>Password:</Text>
      <TextInput secureTextEntry value={password} onChangeText={setPassword} />
      <Button title="Sign In" onPress={signInEmail} />
      <Button title="Sign Up" onPress={signUpEmail} />
      <Button title="Sign In with Google" onPress={signInGoogle} />
    </View>
  );
}

// Note: signInWithPopup may not work in React Native; consider using Expo AuthSession or another method for Google Sign-In.