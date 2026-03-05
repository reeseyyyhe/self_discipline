import { Goal, CheckIn, User, SocialPost, Group, GroupMessage, GroupChallenge, MemberDailyStats } from '../types';

// Mock current user
export const currentUser: User = {
  id: 'user-1',
  name: '我',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop',
  bio: '每天进步一点点 💪',
};

// Mock friends
export const mockUsers: User[] = [
  currentUser,
  {
    id: 'user-2',
    name: '小明',
    avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=150&h=150&fit=crop',
    bio: '健身达人',
  },
  {
    id: 'user-3',
    name: '小红',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop',
    bio: '早起一族',
  },
  {
    id: 'user-4',
    name: '阿强',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop',
    bio: '读书爱好者',
  },
];

// Mock goals
const initialGoals: Goal[] = [
  {
    id: 'goal-1',
    title: '每天运动30分钟',
    description: '保持健康体魄',
    icon: '🏃',
    targetDays: 100,
    category: 'health',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'goal-2',
    title: '早上6点起床',
    description: '早睡早起身体好',
    icon: '🌅',
    targetDays: 30,
    category: 'lifestyle',
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'goal-3',
    title: '阅读1小时',
    description: '每天读书充实自己',
    icon: '📚',
    targetDays: 60,
    category: 'study',
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock check-ins for multiple users
const generateCheckIns = (): CheckIn[] => {
  const checkIns: CheckIn[] = [];
  const now = new Date();
  
  mockUsers.forEach((user) => {
    initialGoals.forEach((goal) => {
      // Generate check-ins for the last 10 days
      for (let i = 0; i < 10; i++) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        
        // 70% chance of completing
        const completed = Math.random() > 0.3;
        
        if (completed) {
          checkIns.push({
            id: `checkin-${user.id}-${goal.id}-${i}`,
            goalId: goal.id,
            userId: user.id,
            date: date.toISOString().split('T')[0],
            completed: true,
            note: i === 0 && user.id === 'user-1' ? '' : ['今天状态不错！', '坚持就是胜利', '感觉很棒', ''][Math.floor(Math.random() * 4)],
            mood: ['great', 'good', 'okay'][Math.floor(Math.random() * 3)] as any,
            timestamp: date.toISOString(),
          });
        }
      }
    });
  });
  
  return checkIns;
};

// Mock social posts
const generateSocialPosts = (checkIns: CheckIn[]): SocialPost[] => {
  const posts: SocialPost[] = [];
  
  // Get recent check-ins (last 3 days) from all users
  const now = new Date();
  const threeDaysAgo = new Date(now);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  const recentCheckIns = checkIns.filter(
    (ci) => new Date(ci.timestamp) >= threeDaysAgo && ci.note
  );
  
  recentCheckIns.forEach((checkIn) => {
    const user = mockUsers.find((u) => u.id === checkIn.userId);
    const goal = initialGoals.find((g) => g.id === checkIn.goalId);
    
    if (user && goal) {
      // Calculate streak
      const userGoalCheckIns = checkIns
        .filter((ci) => ci.userId === user.id && ci.goalId === goal.id && ci.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      for (const ci of userGoalCheckIns) {
        const checkInDate = new Date(ci.date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (checkInDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }
      
      posts.push({
        id: `post-${checkIn.id}`,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        goalTitle: goal.title,
        checkInStreak: streak,
        note: checkIn.note || '',
        mood: checkIn.mood || 'good',
        timestamp: checkIn.timestamp,
        likes: mockUsers
          .filter(() => Math.random() > 0.5)
          .map((u) => u.id),
        comments: [],
      });
    }
  });
  
  return posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

// Initialize data
let goals = [...initialGoals];
let checkIns = generateCheckIns();
let socialPosts = generateSocialPosts(checkIns);

// Storage functions
export const dataStore = {
  // Goals
  getGoals: () => goals,
  addGoal: (goal: Goal) => {
    goals = [...goals, goal];
    return goal;
  },
  updateGoal: (id: string, updates: Partial<Goal>) => {
    goals = goals.map((g) => (g.id === id ? { ...g, ...updates } : g));
    return goals.find((g) => g.id === id);
  },
  deleteGoal: (id: string) => {
    goals = goals.filter((g) => g.id !== id);
    checkIns = checkIns.filter((c) => c.goalId !== id);
    socialPosts = socialPosts.filter((p) => {
      const goal = goals.find((g) => g.title === p.goalTitle);
      return goal?.id !== id;
    });
  },

  // Check-ins
  getCheckIns: (userId?: string, goalId?: string) => {
    let filtered = checkIns;
    if (userId) filtered = filtered.filter((c) => c.userId === userId);
    if (goalId) filtered = filtered.filter((c) => c.goalId === goalId);
    return filtered;
  },
  getAllCheckIns: () => {
    return checkIns;
  },
  addCheckIn: (checkIn: CheckIn) => {
    // Remove existing check-in for same date and goal
    checkIns = checkIns.filter(
      (c) => !(c.userId === checkIn.userId && c.goalId === checkIn.goalId && c.date === checkIn.date)
    );
    checkIns = [...checkIns, checkIn];
    
    // Add to social posts if there's a note
    if (checkIn.note && checkIn.completed) {
      const user = mockUsers.find((u) => u.id === checkIn.userId);
      const goal = goals.find((g) => g.id === checkIn.goalId);
      
      if (user && goal) {
        // Calculate streak
        const userGoalCheckIns = checkIns
          .filter((ci) => ci.userId === user.id && ci.goalId === goal.id && ci.completed)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        
        let streak = 0;
        const today = new Date();
        for (const ci of userGoalCheckIns) {
          const checkInDate = new Date(ci.date);
          const expectedDate = new Date(today);
          expectedDate.setDate(expectedDate.getDate() - streak);
          
          if (checkInDate.toDateString() === expectedDate.toDateString()) {
            streak++;
          } else {
            break;
          }
        }
        
        const newPost: SocialPost = {
          id: `post-${checkIn.id}`,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          goalTitle: goal.title,
          checkInStreak: streak,
          note: checkIn.note,
          mood: checkIn.mood || 'good',
          timestamp: checkIn.timestamp,
          likes: [],
          comments: [],
        };
        
        socialPosts = [newPost, ...socialPosts];
      }
    }
    
    return checkIn;
  },

  // Social
  getSocialPosts: () => socialPosts,
  likePost: (postId: string, userId: string) => {
    socialPosts = socialPosts.map((post) => {
      if (post.id === postId) {
        const likes = post.likes.includes(userId)
          ? post.likes.filter((id) => id !== userId)
          : [...post.likes, userId];
        return { ...post, likes };
      }
      return post;
    });
  },
  addComment: (postId: string, comment: Omit<Comment, 'id'>) => {
    socialPosts = socialPosts.map((post) => {
      if (post.id === postId) {
        return {
          ...post,
          comments: [...post.comments, { ...comment, id: `comment-${Date.now()}` }],
        };
      }
      return post;
    });
  },

  // Users
  getUsers: () => mockUsers,
  getCurrentUser: () => currentUser,
};

// Mock Groups
const initialGroups: Group[] = [
  {
    id: 'group-1',
    name: '早起打卡团',
    description: '早起的鸟儿有虫吃，一起养成早起好习惯！',
    avatar: '🌅',
    creatorId: 'user-2',
    memberIds: ['user-1', 'user-2', 'user-3'],
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'lifestyle',
  },
  {
    id: 'group-2',
    name: '健身俱乐部',
    description: '一起锻炼，互相监督，打造完美身材',
    avatar: '💪',
    creatorId: 'user-1',
    memberIds: ['user-1', 'user-2', 'user-4'],
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'health',
  },
  {
    id: 'group-3',
    name: '读书会',
    description: '每天阅读一小时，知识改变命运',
    avatar: '📚',
    creatorId: 'user-4',
    memberIds: ['user-1', 'user-3', 'user-4'],
    createdAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'study',
  },
];

// Generate group messages
const generateGroupMessages = (): GroupMessage[] => {
  const messages: GroupMessage[] = [];
  const now = new Date();
  
  initialGroups.forEach((group) => {
    // System welcome message
    messages.push({
      id: `msg-${group.id}-welcome`,
      groupId: group.id,
      userId: 'system',
      userName: '系统',
      userAvatar: '🤖',
      content: `欢迎加入${group.name}！让我们一起坚持打卡，互相激励！`,
      type: 'system',
      timestamp: group.createdAt,
    });
    
    // Generate some chat messages
    const messageTemplates = [
      '今天也要加油！',
      '大家早上好！',
      '坚持就是胜利！',
      '感觉状态很好',
      '今天完成目标了',
      '继续保持！',
    ];
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(now);
      date.setHours(date.getHours() - i * 3);
      
      const member = group.memberIds[Math.floor(Math.random() * group.memberIds.length)];
      const user = mockUsers.find((u) => u.id === member);
      
      if (user) {
        messages.push({
          id: `msg-${group.id}-${i}`,
          groupId: group.id,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content: messageTemplates[Math.floor(Math.random() * messageTemplates.length)],
          type: 'text',
          timestamp: date.toISOString(),
        });
      }
    }
    
    // Add some check-in messages
    const todayCheckIns = checkIns.filter((c) => {
      const checkInDate = new Date(c.date);
      const today = new Date();
      return checkInDate.toDateString() === today.toDateString() && 
             group.memberIds.includes(c.userId);
    });
    
    todayCheckIns.slice(0, 2).forEach((checkIn) => {
      const user = mockUsers.find((u) => u.id === checkIn.userId);
      const goal = goals.find((g) => g.id === checkIn.goalId);
      
      if (user && goal) {
        messages.push({
          id: `msg-checkin-${checkIn.id}`,
          groupId: group.id,
          userId: user.id,
          userName: user.name,
          userAvatar: user.avatar,
          content: '完成了今日打卡',
          type: 'checkin',
          metadata: {
            goalTitle: goal.title,
            goalIcon: goal.icon,
            streak: Math.floor(Math.random() * 10) + 1,
          },
          timestamp: checkIn.timestamp,
        });
      }
    });
  });
  
  return messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
};

// Generate group challenges
const generateGroupChallenges = (): GroupChallenge[] => {
  const now = new Date();
  const challenges: GroupChallenge[] = [];
  
  // Active challenge
  const activeStart = new Date(now);
  activeStart.setDate(activeStart.getDate() - 3);
  const activeEnd = new Date(now);
  activeEnd.setDate(activeEnd.getDate() + 4);
  
  challenges.push({
    id: 'challenge-1',
    groupId: 'group-1',
    title: '7天早起挑战',
    description: '连续7天早上6点前打卡，培养早起习惯',
    type: 'streak',
    startDate: activeStart.toISOString(),
    endDate: activeEnd.toISOString(),
    creatorId: 'user-2',
    participants: ['user-1', 'user-2', 'user-3'],
    prizes: ['冠军奖章', '早起达人称号'],
    status: 'active',
  });
  
  // Upcoming challenge
  const upcomingStart = new Date(now);
  upcomingStart.setDate(upcomingStart.getDate() + 2);
  const upcomingEnd = new Date(now);
  upcomingEnd.setDate(upcomingEnd.getDate() + 16);
  
  challenges.push({
    id: 'challenge-2',
    groupId: 'group-2',
    title: '30天健身打卡赛',
    description: '比比谁的打卡次数最多，坚持锻炼30天',
    type: 'total_checkins',
    startDate: upcomingStart.toISOString(),
    endDate: upcomingEnd.toISOString(),
    creatorId: 'user-1',
    participants: ['user-1', 'user-2'],
    prizes: ['健身达人', '坚持之星', '进步最快奖'],
    status: 'upcoming',
  });
  
  // Completed challenge
  const completedStart = new Date(now);
  completedStart.setDate(completedStart.getDate() - 20);
  const completedEnd = new Date(now);
  completedEnd.setDate(completedEnd.getDate() - 6);
  
  challenges.push({
    id: 'challenge-3',
    groupId: 'group-3',
    title: '14天阅读马拉松',
    description: '每天阅读打卡，看谁完成率最高',
    type: 'consistency',
    startDate: completedStart.toISOString(),
    endDate: completedEnd.toISOString(),
    creatorId: 'user-4',
    participants: ['user-1', 'user-3', 'user-4'],
    prizes: ['阅读冠军'],
    status: 'completed',
  });
  
  return challenges;
};

let groups = [...initialGroups];
let groupMessages = generateGroupMessages();
let groupChallenges = generateGroupChallenges();

// Extend dataStore with group functions
export const groupStore = {
  // Groups
  getGroups: () => groups,
  getGroup: (groupId: string) => groups.find((g) => g.id === groupId),
  getUserGroups: (userId: string) => groups.filter((g) => g.memberIds.includes(userId)),
  createGroup: (group: Group) => {
    groups = [...groups, group];
    // Add welcome message
    const welcomeMsg: GroupMessage = {
      id: `msg-${group.id}-welcome`,
      groupId: group.id,
      userId: 'system',
      userName: '系统',
      userAvatar: '🤖',
      content: `欢迎加入${group.name}！让我们一起坚持打卡，互相激励！`,
      type: 'system',
      timestamp: new Date().toISOString(),
    };
    groupMessages = [...groupMessages, welcomeMsg];
    return group;
  },
  joinGroup: (groupId: string, userId: string) => {
    groups = groups.map((g) => {
      if (g.id === groupId && !g.memberIds.includes(userId)) {
        const user = mockUsers.find((u) => u.id === userId);
        const joinMsg: GroupMessage = {
          id: `msg-join-${Date.now()}`,
          groupId,
          userId: 'system',
          userName: '系统',
          userAvatar: '🤖',
          content: `${user?.name} 加入了群组`,
          type: 'system',
          timestamp: new Date().toISOString(),
        };
        groupMessages = [...groupMessages, joinMsg];
        return { ...g, memberIds: [...g.memberIds, userId] };
      }
      return g;
    });
  },
  leaveGroup: (groupId: string, userId: string) => {
    groups = groups.map((g) => {
      if (g.id === groupId) {
        const user = mockUsers.find((u) => u.id === userId);
        const leaveMsg: GroupMessage = {
          id: `msg-leave-${Date.now()}`,
          groupId,
          userId: 'system',
          userName: '系统',
          userAvatar: '🤖',
          content: `${user?.name} 离开了群组`,
          type: 'system',
          timestamp: new Date().toISOString(),
        };
        groupMessages = [...groupMessages, leaveMsg];
        return { ...g, memberIds: g.memberIds.filter((id) => id !== userId) };
      }
      return g;
    });
  },

  // Messages
  getGroupMessages: (groupId: string) => 
    groupMessages.filter((m) => m.groupId === groupId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
  sendMessage: (message: GroupMessage) => {
    groupMessages = [...groupMessages, message];
    return message;
  },
  shareCheckInToGroup: (groupId: string, checkIn: CheckIn) => {
    const user = mockUsers.find((u) => u.id === checkIn.userId);
    const goal = goals.find((g) => g.id === checkIn.goalId);
    
    if (user && goal) {
      // Calculate streak
      const userGoalCheckIns = checkIns
        .filter((ci) => ci.userId === user.id && ci.goalId === goal.id && ci.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      for (const ci of userGoalCheckIns) {
        const checkInDate = new Date(ci.date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (checkInDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }
      
      const message: GroupMessage = {
        id: `msg-checkin-${Date.now()}`,
        groupId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        content: '完成了今日打卡',
        type: 'checkin',
        metadata: {
          goalTitle: goal.title,
          goalIcon: goal.icon,
          streak,
        },
        timestamp: new Date().toISOString(),
      };
      
      groupMessages = [...groupMessages, message];
      return message;
    }
  },

  // Challenges
  getGroupChallenges: (groupId: string) => 
    groupChallenges.filter((c) => c.groupId === groupId),
  getAllChallenges: () => groupChallenges,
  createChallenge: (challenge: GroupChallenge) => {
    groupChallenges = [...groupChallenges, challenge];
    // Send notification message
    const group = groups.find((g) => g.id === challenge.groupId);
    if (group) {
      const notifyMsg: GroupMessage = {
        id: `msg-challenge-${Date.now()}`,
        groupId: challenge.groupId,
        userId: 'system',
        userName: '系统',
        userAvatar: '🤖',
        content: `🏆 新活动「${challenge.title}」已创建，快来参加！`,
        type: 'system',
        timestamp: new Date().toISOString(),
      };
      groupMessages = [...groupMessages, notifyMsg];
    }
    return challenge;
  },
  joinChallenge: (challengeId: string, userId: string) => {
    groupChallenges = groupChallenges.map((c) => {
      if (c.id === challengeId && !c.participants.includes(userId)) {
        return { ...c, participants: [...c.participants, userId] };
      }
      return c;
    });
  },

  // Daily Stats
  getGroupDailyStats: (groupId: string, date: string): MemberDailyStats[] => {
    const group = groups.find((g) => g.id === groupId);
    if (!group) return [];
    
    return group.memberIds.map((userId) => {
      const user = mockUsers.find((u) => u.id === userId);
      const userCheckIns = checkIns.filter((c) => c.userId === userId && c.date === date && c.completed);
      const userGoals = goals;
      
      // Calculate current streak
      const allUserCheckIns = checkIns
        .filter((c) => c.userId === userId && c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      for (const ci of allUserCheckIns) {
        const checkInDate = new Date(ci.date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (checkInDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }
      
      return {
        userId,
        userName: user?.name || '',
        userAvatar: user?.avatar || '',
        date,
        completedCount: userCheckIns.length,
        totalGoals: userGoals.length,
        completionRate: userGoals.length > 0 ? Math.round((userCheckIns.length / userGoals.length) * 100) : 0,
        currentStreak: streak,
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  },
  
  getChallengeLeaderboard: (challengeId: string) => {
    const challenge = groupChallenges.find((c) => c.id === challengeId);
    if (!challenge) return [];
    
    const startDate = new Date(challenge.startDate);
    const endDate = new Date(challenge.endDate);
    
    return challenge.participants.map((userId) => {
      const user = mockUsers.find((u) => u.id === userId);
      
      // Get check-ins in challenge period
      const challengeCheckIns = checkIns.filter((c) => {
        const checkInDate = new Date(c.date);
        return c.userId === userId && 
               c.completed && 
               checkInDate >= startDate && 
               checkInDate <= endDate;
      });
      
      let score = 0;
      if (challenge.type === 'total_checkins') {
        score = challengeCheckIns.length;
      } else if (challenge.type === 'streak') {
        // Calculate longest streak during challenge
        const dates = challengeCheckIns.map((c) => c.date).sort();
        let maxStreak = 0;
        let currentStreak = 0;
        
        dates.forEach((date, i) => {
          if (i === 0) {
            currentStreak = 1;
          } else {
            const prevDate = new Date(dates[i - 1]);
            const currDate = new Date(date);
            const diffDays = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              currentStreak++;
            } else {
              maxStreak = Math.max(maxStreak, currentStreak);
              currentStreak = 1;
            }
          }
        });
        score = Math.max(maxStreak, currentStreak);
      } else if (challenge.type === 'consistency') {
        // Completion rate
        const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const uniqueDays = new Set(challengeCheckIns.map((c) => c.date)).size;
        score = Math.round((uniqueDays / totalDays) * 100);
      }
      
      return {
        userId,
        userName: user?.name || '',
        userAvatar: user?.avatar || '',
        score,
        rank: 0, // Will be set after sorting
      };
    }).sort((a, b) => b.score - a.score)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  },
};