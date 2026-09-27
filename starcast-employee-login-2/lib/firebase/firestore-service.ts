import { getFirestoreDb } from "./admin";
import { Timestamp, FieldValue } from "firebase-admin/firestore";

export interface InboundEmailRecord {
  id: string;
  resendEmailId?: string;
  from: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  rawPayload?: any;
  status: "open" | "in_progress" | "resolved";
  assignedTo?: string;
  createdAt: string | Date;
}

export interface UserProfileRecord {
  id: string;
  email: string;
  name?: string;
  image?: string;
  role?: string;
  isStaff?: boolean;
  isAdmin?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface ArticleRecord {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  authorId?: string;
  authorName?: string;
  category?: string;
  published: boolean;
  createdAt: string | Date;
  updatedAt?: string | Date;
}

export interface CommunityPostRecord {
  id: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  content: string;
  mediaUrls?: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: string | Date;
}

// Inbound Email Operations
export async function saveInboundEmail(email: Omit<InboundEmailRecord, "id" | "createdAt"> & { id?: string }): Promise<string> {
  const db = getFirestoreDb();
  const collection = db.collection("inbound_emails");
  const docRef = email.id ? collection.doc(email.id) : collection.doc();
  
  await docRef.set({
    ...email,
    id: docRef.id,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  return docRef.id;
}

export async function getInboundEmails(limitCount: number = 50): Promise<InboundEmailRecord[]> {
  try {
    const db = getFirestoreDb();
    const snapshot = await db.collection("inbound_emails")
      .orderBy("createdAt", "desc")
      .limit(limitCount)
      .get();

    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        resendEmailId: data.resendEmailId,
        from: data.from || "Unknown Sender",
        to: data.to || "support@starcast.online",
        subject: data.subject || "(No Subject)",
        text: data.text || "",
        html: data.html || "",
        status: data.status || "open",
        assignedTo: data.assignedTo,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
      };
    });
  } catch (err) {
    console.warn("[Firestore] Error fetching inbound emails:", err);
    return [];
  }
}

// User Profile Operations
export async function getUserProfile(userId: string): Promise<UserProfileRecord | null> {
  try {
    const db = getFirestoreDb();
    const doc = await db.collection("users").doc(userId).get();
    if (!doc.exists) return null;
    const data = doc.data()!;
    return {
      id: doc.id,
      email: data.email,
      name: data.name,
      image: data.image,
      role: data.role || "user",
      isStaff: !!data.isStaff,
      isAdmin: !!data.isAdmin,
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate().toISOString() : data.updatedAt,
    };
  } catch (err) {
    console.warn("[Firestore] Error getting user profile:", err);
    return null;
  }
}

export async function upsertUserProfile(profile: UserProfileRecord): Promise<void> {
  const db = getFirestoreDb();
  await db.collection("users").doc(profile.id).set({
    ...profile,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

// Article Operations
export async function getArticles(publishedOnly: boolean = true): Promise<ArticleRecord[]> {
  try {
    const db = getFirestoreDb();
    let query = db.collection("articles") as FirebaseFirestore.Query;
    if (publishedOnly) {
      query = query.where("published", "==", true);
    }
    const snapshot = await query.orderBy("createdAt", "desc").limit(30).get();
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || "Untitled",
        slug: data.slug || doc.id,
        excerpt: data.excerpt || "",
        content: data.content || "",
        coverImage: data.coverImage || "",
        authorId: data.authorId || "",
        authorName: data.authorName || "StarCast Staff",
        category: data.category || "News",
        published: !!data.published,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString()),
      };
    });
  } catch (err) {
    console.warn("[Firestore] Error getting articles:", err);
    return [];
  }
}
