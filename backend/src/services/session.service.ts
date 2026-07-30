import mongoose from "mongoose";
import type { Collection, Document } from "mongodb";

/*
  Reads/revokes the express-session documents that connect-mongo stores in the
  `sessions` collection. Each doc is `{ _id: <sessionId>, session: <JSON string>,
  expires }` — connect-mongo serialises the session data to a STRING, so we match
  on the serialised `"userId":"..."` fragment and parse the JSON to read fields.
*/
interface SessionDoc extends Document {
  _id: string;
  session?: string;
  expires?: Date;
}

interface ParsedSession {
  userId?: string;
  ip?: string;
  userAgent?: string;
  createdAt?: number;
}

export interface SessionInfo {
  id: string;
  current: boolean;
  ip?: string;
  userAgent?: string;
  createdAt?: number;
  expires?: Date;
}

function sessions(): Collection<SessionDoc> {
  return mongoose.connection.collection(
    "sessions"
  ) as unknown as Collection<SessionDoc>;
}

// userId is always a 24-char hex ObjectId string, but escape defensively.
function userMatch(userId: string) {
  const safe = userId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { session: { $regex: `"userId":"${safe}"` } };
}

function parse(raw?: string): ParsedSession {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as ParsedSession;
  } catch {
    return {};
  }
}

async function listForUser(
  userId: string,
  currentSid: string
): Promise<SessionInfo[]> {
  const docs = await sessions().find(userMatch(userId)).toArray();

  return docs
    .map((d) => {
      const s = parse(d.session);
      return {
        id: String(d._id),
        current: String(d._id) === currentSid,
        ip: s.ip,
        userAgent: s.userAgent,
        createdAt: s.createdAt,
        expires: d.expires,
      };
    })
    .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
}

/** Deletes every session for the user except the current one. Returns the count. */
async function revokeOthers(
  userId: string,
  currentSid: string
): Promise<number> {
  const res = await sessions().deleteMany({
    ...userMatch(userId),
    _id: { $ne: currentSid },
  });
  return res.deletedCount ?? 0;
}

/** Deletes every session for a user (used after a password reset). */
async function revokeAll(userId: string): Promise<number> {
  const res = await sessions().deleteMany(userMatch(userId));
  return res.deletedCount ?? 0;
}

export const sessionService = { listForUser, revokeOthers, revokeAll };
