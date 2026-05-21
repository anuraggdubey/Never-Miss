import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { defaultSettings, type AppUserProfile, type Moment, type PushDevice, type UserSettings, type WishDraft } from "./models";

function usersCollection() {
  return collection(db, "users");
}

function userDoc(uid: string) {
  return doc(usersCollection(), uid);
}

function userSettingsDoc(uid: string) {
  return doc(db, "users", uid, "meta", "settings");
}

function userMomentsCollection(uid: string) {
  return collection(db, "users", uid, "moments");
}

function userWishesCollection(uid: string) {
  return collection(db, "users", uid, "wishes");
}

function userDevicesCollection(uid: string) {
  return collection(db, "users", uid, "devices");
}

export async function ensureUserProfile(profile: AppUserProfile) {
  await setDoc(
    userDoc(profile.uid),
    {
      displayName: profile.displayName,
      email: profile.email,
      photoURL: profile.photoURL,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );

  const settingsRef = userSettingsDoc(profile.uid);
  const existingSettings = await getDoc(settingsRef);
  if (!existingSettings.exists()) {
    await setDoc(settingsRef, {
      ...defaultSettings,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function subscribeToSettings(uid: string, onValue: (settings: UserSettings) => void) {
  return onSnapshot(userSettingsDoc(uid), (snapshot) => {
    if (!snapshot.exists()) {
      onValue(defaultSettings);
      return;
    }

    const data = snapshot.data();
    onValue({
      theme: data.theme ?? defaultSettings.theme,
      notificationRhythm: data.notificationRhythm ?? defaultSettings.notificationRhythm,
      timezone: data.timezone ?? defaultSettings.timezone,
    });
  });
}

export async function updateSettings(uid: string, settings: Partial<UserSettings>) {
  await setDoc(
    userSettingsDoc(uid),
    {
      ...settings,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function subscribeToMoments(uid: string, onValue: (moments: Moment[]) => void) {
  const momentsQuery = query(userMomentsCollection(uid), orderBy("date", "asc"));
  return onSnapshot(momentsQuery, (snapshot) => {
    onValue(
      snapshot.docs.map((docSnapshot) => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as Moment[],
    );
  });
}

export async function createMoment(uid: string, moment: Omit<Moment, "id">) {
  const docRef = await addDoc(userMomentsCollection(uid), {
    ...moment,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
}

export async function updateMoment(uid: string, momentId: string, changes: Partial<Moment>) {
  await updateDoc(doc(db, "users", uid, "moments", momentId), {
    ...changes,
    updatedAt: serverTimestamp(),
  });
}

export async function saveWishDraft(uid: string, draft: Omit<WishDraft, "id">) {
  await addDoc(userWishesCollection(uid), {
    ...draft,
    createdAt: serverTimestamp(),
  });
}

export async function savePushDevice(uid: string, device: PushDevice) {
  await setDoc(
    doc(userDevicesCollection(uid), device.token),
    {
      ...device,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    },
    { merge: true },
  );
}
