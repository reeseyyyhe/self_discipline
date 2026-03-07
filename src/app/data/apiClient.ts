/**
 * API 客户端：与后端 /make-server-129677f0 通信。
 * 使用前设置 setAuthToken(token) 或 setDevUserId(id)；否则请求无认证。
 */
import type {
  Goal,
  CheckIn,
  User,
  SocialPost,
  Group,
  GroupMessage,
  GroupChallenge,
  MemberDailyStats,
  Comment,
} from "../types";

const BASE =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) ||
  "";
/** Supabase anon key：调用 Edge Function 时网关要求带此 header，否则返回 401 */
const ANON_KEY =
  (typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_SUPABASE_ANON_KEY) || "";

let authToken: string | null = null;
let devUserId: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function setDevUserId(userId: string | null) {
  devUserId = userId;
}

function headers(): HeadersInit {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  // Supabase 网关要求带 Authorization，否则 401；有 JWT 用 JWT，否则用 anon key
  if (authToken) h["Authorization"] = `Bearer ${authToken}`;
  else if (ANON_KEY) h["Authorization"] = `Bearer ${ANON_KEY}`;
  if (devUserId) h["X-User-Id"] = devUserId;
  return h;
}

async function get<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.json();
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: body != null ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.json();
}

async function put<T>(path: string, body: unknown): Promise<T> {
  const r = await fetch(`${BASE}${path}`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
  return r.json();
}

async function del(path: string): Promise<void> {
  const r = await fetch(`${BASE}${path}`, { method: "DELETE", headers: headers() });
  if (!r.ok) throw new Error(await r.text().catch(() => r.statusText));
}

const P = "";

export const api = {
  getSession: () => get<{ user: User }>(`${P}/session`),
  signup: (body: { email: string; password: string; name?: string; avatar?: string; bio?: string }) =>
    post<{ userId: string }>(`${P}/signup`, body),

  getUser: (userId: string) => get<User>(`${P}/users/${userId}`),
  updateUser: (userId: string, body: Partial<User>) => put<User>(`${P}/users/${userId}`, body),

  getGoals: () => get<Goal[]>(`${P}/goals`),
  addGoal: (goal: Omit<Goal, "id" | "createdAt">) => post<Goal>(`${P}/goals`, goal),
  updateGoal: (goalId: string, updates: Partial<Goal>) => put<Goal>(`${P}/goals/${goalId}`, updates),
  deleteGoal: (goalId: string) => del(`${P}/goals/${goalId}`),

  getCheckIns: (goalId?: string) =>
    get<CheckIn[]>(goalId ? `${P}/checkins?goalId=${encodeURIComponent(goalId)}` : `${P}/checkins`),
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "userId" | "timestamp">) =>
    post<CheckIn>(`${P}/checkins`, checkIn),
  shareCheckIn: (checkIn: CheckIn, groupIds: string[]) =>
    post(`${P}/checkins/share`, { checkIn, groupIds }),

  getGroups: () => get<Group[]>(`${P}/groups`),
  getGroup: (groupId: string) => get<Group>(`${P}/groups/${groupId}`),
  discoverGroups: (q?: string) =>
    get<Group[]>(q ? `${P}/groups/discover?q=${encodeURIComponent(q)}` : `${P}/groups/discover`),
  createGroup: (group: Omit<Group, "id" | "creatorId" | "memberIds" | "createdAt">) =>
    post<Group>(`${P}/groups`, group),
  joinGroup: (groupId: string) => post<Group>(`${P}/groups/${groupId}/join`),
  leaveGroup: (groupId: string) => post(`${P}/groups/${groupId}/leave`),
  getGroupMembers: (groupId: string) => get<User[]>(`${P}/groups/${groupId}/members`),
  getGroupStats: (groupId: string, date?: string) =>
    get<MemberDailyStats[]>(
      date ? `${P}/groups/${groupId}/stats?date=${date}` : `${P}/groups/${groupId}/stats`
    ),
  getGroupMessages: (groupId: string) => get<GroupMessage[]>(`${P}/groups/${groupId}/messages`),
  sendMessage: (groupId: string, content: string, type: "text" | "checkin" | "system" = "text") =>
    post<GroupMessage>(`${P}/groups/${groupId}/messages`, { content, type }),
  getGroupChallenges: (groupId: string) => get<GroupChallenge[]>(`${P}/groups/${groupId}/challenges`),

  createChallenge: (
    body: Omit<GroupChallenge, "id" | "creatorId" | "participants" | "status"> & {
      durationDays?: number;
    }
  ) => post<GroupChallenge>(`${P}/challenges`, body),
  joinChallenge: (challengeId: string) => post<GroupChallenge>(`${P}/challenges/${challengeId}/join`),
  getChallengeLeaderboard: (challengeId: string) =>
    get<{ userId: string; userName: string; userAvatar: string; score: number; rank: number }[]>(
      `${P}/challenges/${challengeId}/leaderboard`
    ),

  shareCheckInToSocial: (checkInId: string) =>
    post<SocialPost>(`${P}/social/posts`, { checkInId }),

  getSocialPosts: () => get<SocialPost[]>(`${P}/social/posts`),
  likePost: (postId: string) => post<{ likes: string[] }>(`${P}/posts/${postId}/like`),
  addComment: (postId: string, content: string) =>
    post<Comment>(`${P}/posts/${postId}/comments`, { content }),
};
