export interface User {
  id: string;
  name: string;
  avatar: string;
  bio?: string;
  email?: string;
  phone?: string;
  createdAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetDays: number;
  /**
   * 每次完成目标预计用时（单位：分钟）
   */
  durationMinutes: number;
  category: 'health' | 'study' | 'work' | 'lifestyle' | 'general';
  createdAt: string;
  userId?: string;
}

export interface CheckIn {
  id: string;
  goalId: string;
  userId: string;
  date: string;
  completed: boolean;
  note?: string;
  mood?: 'great' | 'good' | 'okay';
  timestamp: string;
  sharedGroupIds?: string[];
}

export interface Comment {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  creatorId: string;
  memberIds: string[];
  createdAt: string;
  category: 'health' | 'study' | 'work' | 'lifestyle' | 'general';
}

export interface GroupMessage {
  id: string;
  groupId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  content: string;
  type: 'text' | 'checkin' | 'system';
  metadata?: {
    goalTitle?: string;
    goalIcon?: string;
    streak?: number;
  };
  timestamp: string;
}

export interface GroupChallenge {
  id: string;
  groupId: string;
  title: string;
  description: string;
  type: 'total_checkins' | 'streak' | 'consistency';
  startDate: string;
  endDate: string;
  creatorId: string;
  participants: string[];
  prizes?: string[];
  status: 'upcoming' | 'active' | 'completed';
}

export interface MemberDailyStats {
  userId: string;
  userName: string;
  userAvatar: string;
  date: string;
  completedCount: number;
  totalGoals: number;
  completionRate: number;
  currentStreak: number;
}

export interface SocialPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  goalTitle: string;
  checkInStreak: number;
  note: string;
  mood: 'great' | 'good' | 'okay';
  timestamp: string;
  likes: string[];
  comments: Comment[];
}