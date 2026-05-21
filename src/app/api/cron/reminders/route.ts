import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { scheduleReminderTasks } from "@/lib/reminder-scheduler";
import type { NotificationRhythm } from "@/lib/models";

function isAuthorized(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;
  return Boolean(expected && authHeader === expected);
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const usersSnapshot = await getAdminDb().collection("users").get();
    let userCount = 0;
    let momentCount = 0;

    for (const userDoc of usersSnapshot.docs) {
      userCount += 1;

      const userRef = userDoc.ref;
      const [settingsSnap, momentsSnap] = await Promise.all([
        userRef.collection("meta").doc("settings").get(),
        userRef.collection("moments").get(),
      ]);

      const settings = settingsSnap.data() ?? {};
      const notificationRhythm = (settings.notificationRhythm ?? "day_before") as NotificationRhythm;
      const timeZone = typeof settings.timezone === "string" && settings.timezone ? settings.timezone : "UTC";

      for (const momentDoc of momentsSnap.docs) {
        const moment = momentDoc.data() as { date?: string; time?: string; alertDate?: string; alertTime?: string };
        if (!moment.date) continue;

        await scheduleReminderTasks({
          uid: userDoc.id,
          momentId: momentDoc.id,
          moment: {
            date: moment.date,
            time: moment.time,
            alertDate: moment.alertDate,
            alertTime: moment.alertTime,
          },
          notificationRhythm,
          timeZone,
        });
        momentCount += 1;
      }
    }

    return NextResponse.json({ ok: true, users: userCount, moments: momentCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to resync reminders." },
      { status: 500 },
    );
  }
}
