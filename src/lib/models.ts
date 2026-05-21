export type Occasion = "birthday" | "anniversary" | "milestone" | "memory";
export type NotificationRhythm = "day_before" | "ten_minutes_before" | "both";

export interface AppUserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  theme: "light" | "dark";
  notificationRhythm: NotificationRhythm;
  timezone: string;
}

export interface Moment {
  id: string;
  name: string;
  occasion: Occasion;
  date: string;
  time?: string;
  relation?: string;
  note?: string;
  source?: string;
  yearsTracked: number;
  emoji?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WishDraft {
  id: string;
  personName: string;
  tone: string;
  occasion?: Occasion;
  details?: string;
  message: string;
  createdAt?: string;
}

export interface PushDevice {
  token: string;
  platform: "web";
  userAgent: string;
  notificationEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const defaultSettings: UserSettings = {
  theme: "light",
  notificationRhythm: "day_before",
  timezone: "UTC",
};
