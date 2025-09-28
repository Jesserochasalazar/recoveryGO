import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { useState } from "react";
import { Alert, Button, Text, TextInput, View } from "react-native";
import { auth } from "../firebase/firebaseConfig";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signInEmail = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Signed in!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const signUpEmail = async () => {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      Alert.alert("Account created!");
    } catch (e: any) {
      Alert.alert("Error", e.message);
    }
  };

  const signInGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      Alert.alert("Signed in with Google!");
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