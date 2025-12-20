import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDocFromServer, getFirestore, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";

import { firebaseApp, ensureAnonAuth } from "../firebase";
import { SHOP_ID } from "../models/firestoreModels";

const DEVICE_KEY = "deviceId";

const db = getFirestore(firebaseApp);

function sessionDoc(userId: string) {
  return doc(db, "shops", SHOP_ID, "attendantSessions", userId);
}

function isOfflineError(error: any) {
  const code = String(error?.code || "");
  return code.includes("unavailable") || code.includes("network") || code.includes("failed-precondition");
}

async function getDeviceId() {
  const saved = await AsyncStorage.getItem(DEVICE_KEY);
  if (saved) return saved;

  const next = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  await AsyncStorage.setItem(DEVICE_KEY, next);
  return next;
}

export async function claimAttendantSession(userId: string, name: string) {
  try {
    await ensureAnonAuth();
    const deviceId = await getDeviceId();
    const ref = sessionDoc(userId);

    const IN_USE = "SESSION_IN_USE";

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.deviceId && data.deviceId !== deviceId) {
          throw new Error(IN_USE);
        }

        tx.set(
          ref,
          {
            userId,
            name,
            deviceId,
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        return;
      }

      tx.set(ref, {
        userId,
        name,
        deviceId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    });

    return { ok: true as const };
  } catch (error: any) {
    if (String(error?.message) === "SESSION_IN_USE") {
      return { ok: false as const, reason: "in-use" as const };
    }
    if (isOfflineError(error)) {
      return { ok: false as const, reason: "offline" as const };
    }
    return { ok: false as const, reason: "error" as const };
  }
}

export async function validateAttendantSession(userId: string) {
  try {
    await ensureAnonAuth();
    const deviceId = await getDeviceId();
    const ref = sessionDoc(userId);
    const snap = await getDocFromServer(ref);

    if (!snap.exists()) {
      return { ok: false as const, reason: "missing" as const };
    }

    const data = snap.data();
    if (data?.deviceId && data.deviceId !== deviceId) {
      return { ok: false as const, reason: "in-use" as const };
    }

    await setDoc(
      ref,
      {
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );

    return { ok: true as const };
  } catch (error: any) {
    if (isOfflineError(error)) {
      return { ok: false as const, reason: "offline" as const };
    }
    return { ok: false as const, reason: "error" as const };
  }
}

export async function releaseAttendantSession(userId: string) {
  try {
    await ensureAnonAuth();
    const deviceId = await getDeviceId();
    const ref = sessionDoc(userId);

    const NOT_OWNER = "SESSION_NOT_OWNER";

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists()) {
        return;
      }

      const data = snap.data();
      if (data?.deviceId && data.deviceId !== deviceId) {
        throw new Error(NOT_OWNER);
      }

      tx.delete(ref);
    });

    return { ok: true as const };
  } catch (error: any) {
    if (String(error?.message) === "SESSION_NOT_OWNER") {
      return { ok: false as const, reason: "not-owner" as const };
    }
    if (isOfflineError(error)) {
      return { ok: false as const, reason: "offline" as const };
    }
    return { ok: false as const, reason: "error" as const };
  }
}
