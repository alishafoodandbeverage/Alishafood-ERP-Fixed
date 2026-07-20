import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import firebaseConfig from "../../firebase-applet-config.json";

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// In-memory token cache
let cachedAccessToken: string | null = null;

const provider = new GoogleAuthProvider();
provider.addScope("https://www.googleapis.com/auth/drive.file");

export const signInWithGoogleDrive = async (): Promise<string | null> => {
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential && credential.accessToken) {
      cachedAccessToken = credential.accessToken;
      return cachedAccessToken;
    }
    return null;
  } catch (error) {
    console.error("Firebase auth error:", error);
    throw error;
  }
};

export const getAccessToken = () => cachedAccessToken;

onAuthStateChanged(auth, (user) => {
  if (!user) {
    cachedAccessToken = null;
  }
});
