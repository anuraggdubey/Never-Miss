import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb, getAdminMessaging } from "@/lib/firebase-admin";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization");
    const idToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!idToken) {
      return NextResponse.json({ error: "Missing bearer token." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const devicesSnapshot = await getAdminDb()
      .collection("users")
      .doc(decoded.uid)
      .collection("devices")
      .where("notificationEnabled", "==", true)
      .get();
    const tokens = devicesSnapshot.docs
      .map((doc) => doc.get("token"))
      .filter((value): value is string => Boolean(value));

    if (!tokens.length) {
      return NextResponse.json({ error: "No enabled devices found for this user." }, { status: 400 });
    }

    const response = await getAdminMessaging().sendEachForMulticast({
      tokens,
      notification: {
        title: "NeverMiss test reminder",
        body: "A saved date is coming up tomorrow.",
      },
      data: {
        route: "/notifications",
        kind: "test",
      },
      webpush: {
        fcmOptions: {
          link: "/notifications",
        },
      },
    });

    return NextResponse.json({
      successCount: response.successCount,
      failureCount: response.failureCount,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Push send failed." },
      { status: 500 },
    );
  }
}
