import { GoogleAuth } from "google-auth-library";
import type { NotificationRhythm } from "./models";

type SchedulableMoment = {
  date: string;
  time?: string;
};

type ReminderType = "day_before" | "ten_minutes_before";

const DEFAULT_HOUR = 9;
const DEFAULT_MINUTE = 0;

function getRequiredEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is missing on the server.`);
  return value;
}

function parseLocalDateTime(date: string, time?: string) {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = (time && /^\d{2}:\d{2}$/.test(time) ? time : `${String(DEFAULT_HOUR).padStart(2, "0")}:${String(DEFAULT_MINUTE).padStart(2, "0")}`)
    .split(":")
    .map(Number);

  return { year, month, day, hours, minutes };
}

function getUtcDateForLocal(date: string, time: string | undefined, timeZone: string) {
  const local = parseLocalDateTime(date, time);
  const approxUtc = new Date(Date.UTC(local.year, local.month - 1, local.day, local.hours, local.minutes, 0));

  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(approxUtc);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const asIfUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  const desiredUtc = Date.UTC(local.year, local.month - 1, local.day, local.hours, local.minutes, 0);
  return new Date(approxUtc.getTime() - (asIfUtc - desiredUtc));
}

function getScheduleTimes(moment: SchedulableMoment, rhythm: NotificationRhythm, timeZone: string) {
  const eventUtc = getUtcDateForLocal(moment.date, moment.time, timeZone);
  const schedules: Array<{ type: ReminderType; scheduleTime: string }> = [];

  if (rhythm === "day_before" || rhythm === "both") {
    schedules.push({
      type: "day_before",
      scheduleTime: new Date(eventUtc.getTime() - (24 * 60 * 60 * 1000)).toISOString(),
    });
  }

  if (moment.time && (rhythm === "ten_minutes_before" || rhythm === "both")) {
    schedules.push({
      type: "ten_minutes_before",
      scheduleTime: new Date(eventUtc.getTime() - (10 * 60 * 1000)).toISOString(),
    });
  }

  return schedules.filter((item) => new Date(item.scheduleTime).getTime() > Date.now());
}

function makeTaskId(uid: string, momentId: string, type: ReminderType, date: string, time?: string) {
  return `${uid}_${momentId}_${type}_${date}_${time ?? "09-00"}`
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .slice(0, 450);
}

async function getAccessToken() {
  const auth = new GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });
  const token = await auth.getAccessToken();
  if (!token) throw new Error("Unable to get Google Cloud access token.");
  return token;
}

export async function scheduleReminderTasks(params: {
  uid: string;
  momentId: string;
  moment: SchedulableMoment;
  notificationRhythm: NotificationRhythm;
  timeZone: string;
}) {
  const projectId = getRequiredEnv("CLOUD_TASKS_PROJECT_ID");
  const location = getRequiredEnv("CLOUD_TASKS_LOCATION");
  const queue = getRequiredEnv("CLOUD_TASKS_QUEUE");
  const appBaseUrl = getRequiredEnv("APP_BASE_URL").replace(/\/$/, "");
  const cronSecret = getRequiredEnv("CRON_SECRET");

  const parent = `projects/${projectId}/locations/${location}/queues/${queue}`;
  const schedules = getScheduleTimes(params.moment, params.notificationRhythm, params.timeZone);
  const accessToken = await getAccessToken();

  await Promise.all(schedules.map(async ({ type, scheduleTime }) => {
    const taskId = makeTaskId(params.uid, params.momentId, type, params.moment.date, params.moment.time);
    const response = await fetch(`https://cloudtasks.googleapis.com/v2/${parent}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        task: {
          name: `${parent}/tasks/${taskId}`,
          scheduleTime,
          httpRequest: {
            httpMethod: "POST",
            url: `${appBaseUrl}/api/tasks/reminder-dispatch`,
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${cronSecret}`,
            },
            body: Buffer.from(JSON.stringify({
              uid: params.uid,
              momentId: params.momentId,
              reminderType: type,
              expectedDate: params.moment.date,
              expectedTime: params.moment.time ?? null,
            })).toString("base64"),
          },
        },
      }),
    });

    if (response.ok || response.status === 409) {
      return;
    }

    const payload = await response.text();
    throw new Error(`Cloud Tasks create failed: ${payload}`);
  }));
}
