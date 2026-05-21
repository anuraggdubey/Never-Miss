import { NextResponse } from "next/server";
import { getAdminDb, getAdminMessaging } from "@/lib/firebase-admin";
import type { NotificationRhythm } from "@/lib/models";

type ReminderType = "day_before" | "ten_minutes_before" | "custom";

function parseTimeToMinutes(value?: string | null) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return 9 * 60;
  const [hours, minutes] = value.split(":").map(Number);
  return (hours * 60) + minutes;
}

function getLocalParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";

  return {
    date: `${get("year")}-${get("month")}-${get("day")}`,
    minutes: (Number(get("hour") || "0") * 60) + Number(get("minute") || "0"),
  };
}

function addDays(dateString: string, days: number) {
  const [year, month, day] = dateString.split("-").map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return utcDate.toISOString().slice(0, 10);
}

function isStillDue(args: {
  reminderType: ReminderType;
  rhythm: NotificationRhythm;
  localDate: string;
  localMinutes: number;
  eventDate: string;
  eventTime?: string | null;
  alertDate?: string | null;
  alertTime?: string | null;
}) {
  if (args.reminderType === "custom") {
    const alertMinutes = parseTimeToMinutes(args.alertTime);
    return Boolean(args.alertDate) &&
      args.localDate === args.alertDate &&
      args.localMinutes >= alertMinutes &&
      args.localMinutes < alertMinutes + 10;
  }

  const eventMinutes = parseTimeToMinutes(args.eventTime);
  const rhythmAllows = args.rhythm === "both" || args.rhythm === args.reminderType;
  if (!rhythmAllows) return false;

  if (args.reminderType === "day_before") {
    return args.localDate === addDays(args.eventDate, -1) &&
      args.localMinutes >= eventMinutes &&
      args.localMinutes < eventMinutes + 10;
  }

  if (!args.eventTime) return false;

  return args.localDate === args.eventDate &&
    args.localMinutes >= eventMinutes - 10 &&
    args.localMinutes < eventMinutes;
}

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : null;

  if (!expected || authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  try {
    const body = await request.json() as {
      uid?: string;
      momentId?: string;
      reminderType?: ReminderType;
      expectedDate?: string;
      expectedSourceDate?: string;
      expectedAlertDate?: string | null;
      expectedAlertTime?: string | null;
      expectedTime?: string | null;
    };

    if (!body.uid || !body.momentId || !body.reminderType || !body.expectedDate) {
      return NextResponse.json({ error: "Missing reminder payload." }, { status: 400 });
    }

    const userRef = getAdminDb().collection("users").doc(body.uid);
    const [momentSnap, devicesSnap, settingsSnap] = await Promise.all([
      userRef.collection("moments").doc(body.momentId).get(),
      userRef.collection("devices").where("notificationEnabled", "==", true).get(),
      userRef.collection("meta").doc("settings").get(),
    ]);

    if (!momentSnap.exists) {
      return NextResponse.json({ ok: true, skipped: "moment-missing" });
    }

    const moment = momentSnap.data() as { name?: string; occasion?: string; date?: string; time?: string | null; alertDate?: string | null; alertTime?: string | null };
    if (!moment.name || !moment.occasion || !moment.date) {
      return NextResponse.json({ ok: true, skipped: "moment-invalid" });
    }

    if (body.expectedSourceDate && moment.date !== body.expectedSourceDate) {
      return NextResponse.json({ ok: true, skipped: "moment-changed" });
    }

    if ((moment.time ?? null) !== (body.expectedTime ?? null)) {
      return NextResponse.json({ ok: true, skipped: "moment-changed" });
    }

    if ((moment.alertDate ?? null) !== (body.expectedAlertDate ?? null) || (moment.alertTime ?? null) !== (body.expectedAlertTime ?? null)) {
      return NextResponse.json({ ok: true, skipped: "moment-changed" });
    }

    const settings = settingsSnap.data() ?? {};
    const timeZone = typeof settings.timezone === "string" && settings.timezone ? settings.timezone : "UTC";
    const rhythm = (settings.notificationRhythm ?? "day_before") as NotificationRhythm;
    const localNow = getLocalParts(new Date(), timeZone);

    if (!isStillDue({
      reminderType: body.reminderType,
      rhythm,
      localDate: localNow.date,
      localMinutes: localNow.minutes,
      eventDate: body.expectedDate,
      eventTime: moment.time,
      alertDate: body.expectedAlertDate ?? moment.alertDate ?? null,
      alertTime: body.expectedAlertTime ?? moment.alertTime ?? null,
    })) {
      return NextResponse.json({ ok: true, skipped: "no-longer-due" });
    }

    const tokens = devicesSnap.docs.map((doc) => doc.get("token")).filter((value): value is string => Boolean(value));
    if (!tokens.length) {
      return NextResponse.json({ ok: true, skipped: "no-devices" });
    }

    const response = await getAdminMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: body.reminderType === "custom"
          ? `Reminder for ${moment.name}`
          : body.reminderType === "day_before"
            ? `${moment.name}'s ${moment.occasion} is in 24 hours`
            : `${moment.name}'s ${moment.occasion} is in 10 minutes`,
        body: body.reminderType === "custom"
          ? `Your scheduled alert for ${moment.name} is due now.`
          : body.reminderType === "day_before"
            ? `A reminder is ready for ${moment.name}.`
            : `It's almost time to reach out to ${moment.name}.`,
      },
      data: {
        route: "/notifications",
        kind: body.reminderType,
        momentId: body.momentId,
      },
      webpush: {
        fcmOptions: {
          link: "/notifications",
        },
      },
    });

    return NextResponse.json({ ok: true, sent: response.successCount, failed: response.failureCount });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Reminder dispatch failed." },
      { status: 500 },
    );
  }
}
