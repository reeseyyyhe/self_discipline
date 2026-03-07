import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";
import * as store from "./store.ts";

const app = new Hono();
// 按 Supabase 文档，Edge Function 收到的 path 形如 `/server/health`，
// 其中 `server` 是函数名（slug），因此这里前缀应为 `/server`。
const PREFIX = "/server";

app.use("*", logger(console.log));
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "X-User-Id"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  })
);

function supabaseAuth() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  return createClient(url, key);
}

/** Resolve current user id: JWT (Supabase Auth) or X-User-Id header for dev. */
async function getUserIdFromRequest(c: { req: { header: (s: string) => string | undefined } }): Promise<string | null> {
  const auth = c.req.header("Authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
  if (bearer) {
    const supabase = supabaseAuth();
    if (supabase) {
      const { data: { user }, error } = await supabase.auth.getUser(bearer);
      if (!error && user?.id) return user.id;
    }
  }
  return c.req.header("X-User-Id") ?? null;
}

/** Middleware: set userId in context; optional auth (no 401). */
app.use(PREFIX + "/*", async (c, next) => {
  const userId = await getUserIdFromRequest(c);
  c.set("userId", userId);
  await next();
});

function requireAuth(c: { get: (k: string) => string | null }): string | null {
  const id = c.get("userId");
  if (!id) return null;
  return id;
}

// ----- Health -----
app.get(PREFIX + "/health", (c) => c.json({ status: "ok" }));

// ----- Auth / Session -----
app.get(PREFIX + "/session", async (c) => {
  const userId = c.get("userId") as string | null;
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  let user = await store.getUser(userId);
  if (!user) {
    const supabase = supabaseAuth();
    if (supabase) {
      const { data: authUser } = await supabase.auth.admin.getUserById(userId);
      if (authUser?.user) {
        const u = authUser.user;
        user = { id: u.id, name: u.user_metadata?.name ?? u.email?.split("@")[0] ?? "用户", avatar: u.user_metadata?.avatar ?? "", bio: u.user_metadata?.bio };
        await store.upsertUser(user);
      }
    }
  }
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json({ user });
});

app.post(PREFIX + "/signup", async (c) => {
  const body = await c.req.json<{ email: string; password: string; name?: string; avatar?: string; bio?: string }>();
  const supabase = supabaseAuth();
  if (!supabase) return c.json({ error: "Auth not configured" }, 503);
  const { data, error } = await supabase.auth.admin.createUser({
    email: body.email,
    password: body.password,
    email_confirm: true,
    user_metadata: { name: body.name, avatar: body.avatar, bio: body.bio },
  });
  if (error) return c.json({ error: error.message }, 400);
  const u = data.user;
  if (u) {
    const user: store.User = {
      id: u.id,
      name: body.name ?? u.email?.split("@")[0] ?? "用户",
      avatar: body.avatar ?? "",
      bio: body.bio,
    };
    await store.upsertUser(user);
  }
  return c.json({ userId: data.user?.id });
});

// ----- Users -----
app.get(PREFIX + "/users/:userId", async (c) => {
  const id = c.req.param("userId");
  const user = await store.getUser(id);
  if (!user) return c.json({ error: "User not found" }, 404);
  return c.json(user);
});

app.put(PREFIX + "/users/:userId", async (c) => {
  const current = requireAuth(c);
  if (!current) return c.json({ error: "Unauthorized" }, 401);
  const id = c.req.param("userId");
  if (id !== current) return c.json({ error: "Forbidden" }, 403);
  const body = await c.req.json<Partial<store.User>>();
  const existing = await store.getUser(id);
  const user: store.User = existing
    ? { ...existing, ...body, id }
    : { id, name: body.name ?? "用户", avatar: body.avatar ?? "", bio: body.bio };
  await store.upsertUser(user);
  return c.json(user);
});

// ----- Goals -----
app.get(PREFIX + "/goals", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const goals = await store.getGoals(userId);
  return c.json(goals);
});

app.post(PREFIX + "/goals", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<Omit<store.Goal, "id" | "createdAt">>();
  const goal: store.Goal = {
    ...body,
    id: `goal-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };
  await store.addGoal(userId, goal);
  return c.json(goal);
});

app.put(PREFIX + "/goals/:goalId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const goalId = c.req.param("goalId");
  const body = await c.req.json<Partial<store.Goal>>();
  const updated = await store.updateGoal(userId, goalId, body);
  if (!updated) return c.json({ error: "Goal not found" }, 404);
  return c.json(updated);
});

app.delete(PREFIX + "/goals/:goalId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const goalId = c.req.param("goalId");
  await store.deleteGoal(userId, goalId);
  return c.json({ ok: true });
});

// ----- Checkins -----
app.get(PREFIX + "/checkins", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const goalId = c.req.query("goalId");
  let list = await store.getCheckInsList();
  list = list.filter((c) => c.userId === userId);
  if (goalId) list = list.filter((c) => c.goalId === goalId);
  return c.json(list);
});

app.post(PREFIX + "/checkins", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<Omit<store.CheckIn, "id" | "userId" | "timestamp">>();
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  const checkIn: store.CheckIn = {
    ...body,
    id: `checkin-${Date.now()}`,
    userId,
    timestamp: new Date().toISOString(),
  };
  await store.addCheckIn(checkIn);
  return c.json(checkIn);
});

app.post(PREFIX + "/checkins/share", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ checkIn: store.CheckIn; groupIds: string[] }>();
  const { checkIn, groupIds } = body;
  if (!checkIn || !groupIds?.length) return c.json({ error: "checkIn and groupIds required" }, 400);
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  const goals = await store.getGoals(userId);
  const goal = goals.find((g) => g.id === checkIn.goalId);
  if (!goal) return c.json({ error: "Goal not found" }, 404);

  const streak = await computeStreak(userId, checkIn.goalId);
  const msg: store.GroupMessage = {
    id: `msg-checkin-${Date.now()}`,
    groupId: "",
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: "完成了今日打卡",
    type: "checkin",
    metadata: { goalTitle: goal.title, goalIcon: goal.icon, streak },
    timestamp: new Date().toISOString(),
  };
  for (const gid of groupIds) {
    const group = await store.getGroup(gid);
    if (group && group.memberIds.includes(userId)) {
      await store.addMessage({ ...msg, id: `msg-${gid}-${Date.now()}`, groupId: gid });
    }
  }
  return c.json({ ok: true });
});

async function computeStreak(userId: string, goalId: string): Promise<number> {
  const list = await store.getCheckInsList();
  const sorted = list
    .filter((c) => c.userId === userId && c.goalId === goalId && c.completed)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const today = new Date();
  for (const c of sorted) {
    const d = new Date(c.date);
    const expected = new Date(today);
    expected.setDate(expected.getDate() - streak);
    if (d.toDateString() === expected.toDateString()) streak++;
    else break;
  }
  return streak;
}

// ----- Groups -----
app.get(PREFIX + "/groups", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const all = await store.getGroupsList();
  const mine = all.filter((g) => g.memberIds.includes(userId));
  return c.json(mine);
});

app.get(PREFIX + "/groups/discover", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const q = (c.req.query("q") ?? "").toLowerCase();
  const all = await store.getGroupsList();
  const myIds = new Set((await store.getGroupsList()).filter((g) => g.memberIds.includes(userId)).map((g) => g.id));
  let list = all.filter((g) => !myIds.has(g.id));
  if (q) {
    list = list.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.description.toLowerCase().includes(q) ||
        g.id.toLowerCase().includes(q)
    );
  }
  return c.json(list);
});

app.post(PREFIX + "/groups", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<Omit<store.Group, "id" | "creatorId" | "memberIds" | "createdAt">>();
  const group: store.Group = {
    ...body,
    id: `group-${Date.now()}`,
    creatorId: userId,
    memberIds: [userId],
    createdAt: new Date().toISOString(),
  };
  await store.addGroup(group);
  const welcome: store.GroupMessage = {
    id: `msg-${group.id}-welcome`,
    groupId: group.id,
    userId: "system",
    userName: "系统",
    userAvatar: "🤖",
    content: `欢迎加入${group.name}！让我们一起坚持打卡，互相激励！`,
    type: "system",
    timestamp: new Date().toISOString(),
  };
  await store.addMessage(welcome);
  return c.json(group);
});

app.post(PREFIX + "/groups/:groupId/join", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (group.memberIds.includes(userId)) return c.json(group);
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  await store.updateGroup(groupId, (g) => ({
    ...g,
    memberIds: [...g.memberIds, userId],
  }));
  const msg: store.GroupMessage = {
    id: `msg-join-${Date.now()}`,
    groupId,
    userId: "system",
    userName: "系统",
    userAvatar: "🤖",
    content: `${user.name} 加入了群组`,
    type: "system",
    timestamp: new Date().toISOString(),
  };
  await store.addMessage(msg);
  const updated = await store.getGroup(groupId);
  return c.json(updated!);
});

app.post(PREFIX + "/groups/:groupId/leave", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  await store.updateGroup(groupId, (g) => ({
    ...g,
    memberIds: g.memberIds.filter((id) => id !== userId),
  }));
  const msg: store.GroupMessage = {
    id: `msg-leave-${Date.now()}`,
    groupId,
    userId: "system",
    userName: "系统",
    userAvatar: "🤖",
    content: `${user.name} 离开了群组`,
    type: "system",
    timestamp: new Date().toISOString(),
  };
  await store.addMessage(msg);
  return c.json({ ok: true });
});

app.get(PREFIX + "/groups/:groupId", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const group = await store.getGroup(c.req.param("groupId"));
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  return c.json(group);
});

app.get(PREFIX + "/groups/:groupId/members", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const group = await store.getGroup(c.req.param("groupId"));
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  const users = await Promise.all(group.memberIds.map((id) => store.getUser(id)));
  return c.json(users.filter(Boolean));
});

app.get(PREFIX + "/groups/:groupId/stats", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  const date = c.req.query("date") ?? new Date().toISOString().split("T")[0];
  const goals = await store.getGoals(userId);
  const allCheckIns = await store.getCheckInsList();
  const stats: store.MemberDailyStats[] = await Promise.all(
    group.memberIds.map(async (uid) => {
      const u = await store.getUser(uid);
      const userGoals = await store.getGoals(uid);
      const dayCheckIns = allCheckIns.filter((c) => c.userId === uid && c.date === date && c.completed);
      let streak = 0;
      const sorted = allCheckIns
        .filter((c) => c.userId === uid && c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      const today = new Date();
      for (const ci of sorted) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - streak);
        if (new Date(ci.date).toDateString() === expected.toDateString()) streak++;
        else break;
      }
      return {
        userId: uid,
        userName: u?.name ?? "",
        userAvatar: u?.avatar ?? "",
        date,
        completedCount: dayCheckIns.length,
        totalGoals: userGoals.length,
        completionRate: userGoals.length ? Math.round((dayCheckIns.length / userGoals.length) * 100) : 0,
        currentStreak: streak,
      };
    })
  );
  stats.sort((a, b) => b.completedCount - a.completedCount);
  return c.json(stats);
});

// ----- Messages -----
app.get(PREFIX + "/groups/:groupId/messages", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  const messages = await store.getMessages(groupId);
  return c.json(messages);
});

app.post(PREFIX + "/groups/:groupId/messages", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  const body = await c.req.json<{ content: string; type?: "text" | "checkin" | "system" }>();
  const msg: store.GroupMessage = {
    id: `msg-${Date.now()}`,
    groupId,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: body.content ?? "",
    type: body.type ?? "text",
    timestamp: new Date().toISOString(),
  };
  await store.addMessage(msg);
  return c.json(msg);
});

// ----- Challenges -----
app.get(PREFIX + "/groups/:groupId/challenges", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const groupId = c.req.param("groupId");
  const group = await store.getGroup(groupId);
  if (!group) return c.json({ error: "Group not found" }, 404);
  if (!group.memberIds.includes(userId)) return c.json({ error: "Forbidden" }, 403);
  const list = await store.getChallenges(groupId);
  return c.json(list);
});

app.post(PREFIX + "/challenges", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<
    Omit<store.GroupChallenge, "id" | "creatorId" | "participants" | "status"> & { durationDays?: number }
  >();
  const durationDays = body.durationDays ?? 7;
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + durationDays);
  const challenge: store.GroupChallenge = {
    ...body,
    id: `challenge-${Date.now()}`,
    creatorId: userId,
    participants: [userId],
    status: "active",
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
  delete (challenge as Record<string, unknown>)["durationDays"];
  await store.addChallenge(challenge);
  const msg: store.GroupMessage = {
    id: `msg-challenge-${Date.now()}`,
    groupId: challenge.groupId,
    userId: "system",
    userName: "系统",
    userAvatar: "🤖",
    content: `🏆 新活动「${challenge.title}」已创建，快来参加！`,
    type: "system",
    timestamp: new Date().toISOString(),
  };
  await store.addMessage(msg);
  return c.json(challenge);
});

app.post(PREFIX + "/challenges/:challengeId/join", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const challengeId = c.req.param("challengeId");
  const allGroups = await store.getGroupsList();
  for (const g of allGroups) {
    const list = await store.getChallenges(g.id);
    const ch = list.find((c) => c.id === challengeId);
    if (ch) {
      if (ch.participants.includes(userId)) return c.json(ch);
      await store.updateChallenge(g.id, challengeId, (c) => ({
        ...c,
        participants: [...c.participants, userId],
      }));
      const updated = (await store.getChallenges(g.id)).find((c) => c.id === challengeId);
      return c.json(updated!);
    }
  }
  return c.json({ error: "Challenge not found" }, 404);
});

app.get(PREFIX + "/challenges/:challengeId/leaderboard", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const challengeId = c.req.param("challengeId");
  const allGroups = await store.getGroupsList();
  for (const g of allGroups) {
    const list = await store.getChallenges(g.id);
    const challenge = list.find((c) => c.id === challengeId);
    if (challenge) {
      const checkIns = await store.getCheckInsList();
      const start = new Date(challenge.startDate);
      const end = new Date(challenge.endDate);
      const entries = await Promise.all(
        challenge.participants.map(async (uid) => {
          const u = await store.getUser(uid);
          const inRange = checkIns.filter((c) => {
            const d = new Date(c.date);
            return c.userId === uid && c.completed && d >= start && d <= end;
          });
          let score = 0;
          if (challenge.type === "total_checkins") score = inRange.length;
          else if (challenge.type === "streak") {
            const dates = [...new Set(inRange.map((c) => c.date))].sort();
            let maxS = 0,
              cur = 0;
            for (let i = 0; i < dates.length; i++) {
              if (i === 0 || getDayDiff(dates[i], dates[i - 1]) === 1) cur++;
              else {
                maxS = Math.max(maxS, cur);
                cur = 1;
              }
            }
            score = Math.max(maxS, cur);
          } else if (challenge.type === "consistency") {
            const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
            score = totalDays ? Math.round((new Set(inRange.map((c) => c.date)).size / totalDays) * 100) : 0;
          }
          return { userId: uid, userName: u?.name ?? "", userAvatar: u?.avatar ?? "", score, rank: 0 };
        })
      );
      entries.sort((a, b) => b.score - a.score);
      entries.forEach((e, i) => (e.rank = i + 1));
      return c.json(entries);
    }
  }
  return c.json({ error: "Challenge not found" }, 404);
});

function getDayDiff(a: string, b: string): number {
  return Math.round((new Date(a).getTime() - new Date(b).getTime()) / (1000 * 60 * 60 * 24));
}

// ----- Social -----
app.post(PREFIX + "/social/posts", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const body = await c.req.json<{ checkInId: string }>();
  const checkInId = body.checkInId;
  if (!checkInId) return c.json({ error: "checkInId required" }, 400);

  const allCheckIns = await store.getCheckInsList();
  const checkIn = allCheckIns.find((ci) => ci.id === checkInId && ci.userId === userId);
  if (!checkIn) return c.json({ error: "Checkin not found" }, 404);
  if (!checkIn.note || !checkIn.note.trim()) return c.json({ error: "Note required" }, 400);

  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  const goal = await store.getGoal(userId, checkIn.goalId);
  if (!goal) return c.json({ error: "Goal not found" }, 404);

  const streak = await computeStreak(userId, checkIn.goalId);
  const post: store.SocialPost = {
    id: `post-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    goalTitle: goal.title,
    checkInStreak: streak,
    note: checkIn.note ?? "",
    mood: checkIn.mood ?? "good",
    timestamp: new Date().toISOString(),
    likes: [],
    comments: [],
  };
  await store.addSocialPost(post);
  return c.json(post);
});

app.get(PREFIX + "/social/posts", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const list = await store.getSocialPostsList();
  return c.json(list);
});

app.post(PREFIX + "/posts/:postId/like", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const postId = c.req.param("postId");
  const post = await store.findSocialPost(postId);
  if (!post) return c.json({ error: "Post not found" }, 404);
  const likes = post.likes.includes(userId) ? post.likes.filter((id) => id !== userId) : [...post.likes, userId];
  await store.updateSocialPost(postId, (p) => ({ ...p, likes }));
  return c.json({ likes });
});

app.post(PREFIX + "/posts/:postId/comments", async (c) => {
  const userId = requireAuth(c);
  if (!userId) return c.json({ error: "Unauthorized" }, 401);
  const user = await store.getUser(userId);
  if (!user) return c.json({ error: "User not found" }, 404);
  const postId = c.req.param("postId");
  const body = await c.req.json<{ content: string }>();
  const post = await store.findSocialPost(postId);
  if (!post) return c.json({ error: "Post not found" }, 404);
  const comment: store.Comment = {
    id: `comment-${Date.now()}`,
    userId: user.id,
    userName: user.name,
    userAvatar: user.avatar,
    content: body.content ?? "",
    timestamp: new Date().toISOString(),
  };
  await store.updateSocialPost(postId, (p) => ({ ...p, comments: [...p.comments, comment] }));
  return c.json(comment);
});

Deno.serve(app.fetch);
