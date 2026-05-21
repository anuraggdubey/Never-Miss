import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { scheduleReminderTasks } from "@/lib/reminder-scheduler";
import type { NotificationRhythm } from "@/lib/models";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const body = await request.json() as { momentId?: string; all?: boolean };

    const userRef = getAdminDb().collection("users").doc(decoded.uid);
    const settingsSnap = await userRef.collection("meta").doc("settings").get();
    const settings = settingsSnap.data() ?? {};
    const notificationRhythm = (settings.notificationRhythm ?? "day_before") as NotificationRhythm;
    const timeZone = typeof settings.timezone === "string" && settings.timezone ? settings.timezone : "UTC";

    const momentsSnap = body.all
      ? await userRef.collection("moments").get()
      : body.momentId
        ? await userRef.collection("moments").where("__name__", "==", body.momentId).get()
        : null;

    if (!momentsSnap) {
      return NextResponse.json({ error: "Provide momentId or all." }, { status: 400 });
    }

    await Promise.all(momentsSnap.docs.map((doc) => {
      const moment = doc.data() as { date?: string; time?: string };
      if (!moment.date) return Promise.resolve();

      return scheduleReminderTasks({
        uid: decoded.uid,
        momentId: doc.id,
        moment: {
          date: moment.date,
          time: moment.time,
        },
        notificationRhythm,
        timeZone,
      });
    }));

    return NextResponse.json({ ok: true, count: momentsSnap.size });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to sync reminders." },
      { status: 500 },
    );
  }
}
