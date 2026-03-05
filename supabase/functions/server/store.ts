/**
 * KV-backed store for 自律目标监控 app.
 * Keys: users, goals:{userId}, checkins, groups, messages:{groupId}, challenges:{groupId}, social_posts
 */
import * as kv from "./kv_store.tsx";

const USERS = "users";
const GOALS_PREFIX = "goals:";
const CHECKINS = "checkins";
const GROUPS = "groups";
const MESSAGES_PREFIX = "messages:";
const CHALLENGES_PREFIX = "challenges:";
const SOCIAL_POSTS = "social_posts";

// Types aligned with frontend
export type User = {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  email?: string;
  createdAt?: string;
};

export type Goal = {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetDays: number;
  category: "health" | "study" | "work" | "lifestyle" | "general";
  createdAt: string;
  userId?: string;
};

export type CheckIn = {
  id: string;
  goalId: string;
  userId: string;
  date: string;
  completed: boolean;
  note?: string;
  mood?: "great" | "good" | "okay";
  timestamp: string;
  sharedGroupIds?: string[];
};

export type Group = {
  id: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
  category: "health" | "study" | "work" | "lifestyle" | "general";
};

export type GroupMessage = {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: "text" | "checkin" | "system";
  metadata?: { goalTitle?: string; goalIcon?: string; streak?: number };
  timestamp: string;
};

export type GroupChallenge = {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: "total_checkins" | "streak" | "consistency";
  startDate: string;
  endDate: string;
  creatorId: string;
  participants: string[];
  prizes?: string[];
  status: "upcoming" | "active" | "completed";
};

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
};

export type SocialPost = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalTitle: string;
  checkInStreak: number;
  note: string;
  mood: "great" | "good" | "okay";
  timestamp: string;
  likes: string[];
  comments: Comment[];
};

export type MemberDailyStats = {
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  completedCount: number;
  totalGoals: number;
  completionRate: number;
  currentStreak: number;
};

async function getJson<T>(key: string): Promise<T | null> {
  const v = await kv.get(key);
  return v as T | null;
}

async function setJson(key: string, value: unknown): Promise<void> {
  await kv.set(key, value);
}

// Users
export async function getUsers(): Promise<User[]> {
  const v = await getJson<User[]>(USERS);
  return v ?? [];
}

export async function getUser(id: string): Promise<User | null> {
  const users = await getUsers();
  return users.find((u) => u.id === id) ?? null;
}

export async function setUsers(users: User[]): Promise<void> {
  await setJson(USERS, users);
}

export async function upsertUser(user: User): Promise<void> {
  const users = await getUsers();
  const i = users.findIndex((u) => u.id === user.id);
  if (i >= 0) users[i] = user;
  else users.push(user);
  await setUsers(users);
}

// Goals (per user)
export async function getGoals(userId: string): Promise<Goal[]> {
  const v = await getJson<Goal[]>(GOALS_PREFIX + userId);
  return v ?? [];
}

export async function getGoal(userId: string, goalId: string): Promise<Goal | null> {
  const goals = await getGoals(userId);
  return goals.find((g) => g.id === goalId) ?? null;
}

export async function setGoals(userId: string, goals: Goal[]): Promise<void> {
  await setJson(GOALS_PREFIX + userId, goals);
}

export async function addGoal(userId: string, goal: Goal): Promise<Goal> {
  const goals = await getGoals(userId);
  goals.push({ ...goal, userId });
  await setGoals(userId, goals);
  return goal;
}

export async function updateGoal(userId: string, goalId: string, updates: Partial<Goal>): Promise<Goal | null> {
  const goals = await getGoals(userId);
  const i = goals.findIndex((g) => g.id === goalId);
  if (i < 0) return null;
  goals[i] = { ...goals[i], ...updates };
  await setGoals(userId, goals);
  return goals[i];
}

export async function deleteGoal(userId: string, goalId: string): Promise<boolean> {
  const goals = (await getGoals(userId)).filter((g) => g.id !== goalId);
  await setGoals(userId, goals);
  return true;
}

// CheckIns (global list, filter by userId/goalId in API)
export async function getCheckInsList(): Promise<CheckIn[]> {
  const v = await getJson<CheckIn[]>(CHECKINS);
  return v ?? [];
}

export async function setCheckInsList(list: CheckIn[]): Promise<void> {
  await setJson(CHECKINS, list);
}

export async function addCheckIn(checkIn: CheckIn): Promise<CheckIn> {
  const list = await getCheckInsList();
  const filtered = list.filter(
    (c) => !(c.userId === checkIn.userId && c.goalId === checkIn.goalId && c.date === checkIn.date)
  );
  filtered.push(checkIn);
  await setCheckInsList(filtered);
  return checkIn;
}

// Groups
export async function getGroupsList(): Promise<Group[]> {
  const v = await getJson<Group[]>(GROUPS);
  return v ?? [];
}

export async function getGroup(groupId: string): Promise<Group | null> {
  const groups = await getGroupsList();
  return groups.find((g) => g.id === groupId) ?? null;
}

export async function setGroupsList(groups: Group[]): Promise<void> {
  await setJson(GROUPS, groups);
}

export async function addGroup(group: Group): Promise<Group> {
  const groups = await getGroupsList();
  groups.push(group);
  await setGroupsList(groups);
  return group;
}

export async function updateGroup(groupId: string, updater: (g: Group) => Group): Promise<Group | null> {
  const groups = await getGroupsList();
  const i = groups.findIndex((g) => g.id === groupId);
  if (i < 0) return null;
  groups[i] = updater(groups[i]);
  await setGroupsList(groups);
  return groups[i];
}

// Messages (per group)
export async function getMessages(groupId: string): Promise<GroupMessage[]> {
  const v = await getJson<GroupMessage[]>(MESSAGES_PREFIX + groupId);
  return (v ?? []).sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function addMessage(msg: GroupMessage): Promise<GroupMessage> {
  const list = await getMessages(msg.groupId);
  list.push(msg);
  await setJson(MESSAGES_PREFIX + msg.groupId, list);
  return msg;
}

// Challenges (per group)
export async function getChallenges(groupId: string): Promise<GroupChallenge[]> {
  const v = await getJson<GroupChallenge[]>(CHALLENGES_PREFIX + groupId);
  return v ?? [];
}

export async function setChallenges(groupId: string, list: GroupChallenge[]): Promise<void> {
  await setJson(CHALLENGES_PREFIX + groupId, list);
}

export async function addChallenge(c: GroupChallenge): Promise<GroupChallenge> {
  const list = await getChallenges(c.groupId);
  list.push(c);
  await setChallenges(c.groupId, list);
  return c;
}

export async function updateChallenge(
  groupId: string,
  challengeId: string,
  updater: (c: GroupChallenge) => GroupChallenge
): Promise<GroupChallenge | null> {
  const list = await getChallenges(groupId);
  const i = list.findIndex((c) => c.id === challengeId);
  if (i < 0) return null;
  list[i] = updater(list[i]);
  await setChallenges(groupId, list);
  return list[i];
}

// Social posts
export async function getSocialPostsList(): Promise<SocialPost[]> {
  const v = await getJson<SocialPost[]>(SOCIAL_POSTS);
  return (v ?? []).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function setSocialPostsList(list: SocialPost[]): Promise<void> {
  await setJson(SOCIAL_POSTS, list);
}

export async function updateSocialPost(
  postId: string,
  updater: (post: SocialPost) => SocialPost
): Promise<SocialPost | null> {
  const list = await getSocialPostsList();
  const i = list.findIndex((p) => p.id === postId);
  if (i < 0) return null;
  list[i] = updater(list[i]);
  await setSocialPostsList(list);
  return list[i];
}

export async function findSocialPost(postId: string): Promise<SocialPost | null> {
  const list = await getSocialPostsList();
  return list.find((p) => p.id === postId) ?? null;
}
