import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Target, TrendingUp, Award, Calendar, Heart, MessageCircle as MessageCircleIcon } from 'lucide-react';
import { dataStore, groupStore } from '../data/mockData';
import { User, SocialPost, CheckIn, Goal, Group } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Badge } from '../components/ui/badge';

export default function UserProfile() {
  const { userId } = useParams();
  const [user, setUser] = useState<User | null>(null);
  const [userPosts, setUserPosts] = useState<SocialPost[]>([]);
  const [userCheckIns, setUserCheckIns] = useState<CheckIn[]>([]);
  const [userGoals, setUserGoals] = useState<Goal[]>([]);
  const [userGroups, setUserGroups] = useState<Group[]>([]);
  const [stats, setStats] = useState({
    totalCheckIns: 0,
    currentStreak: 0,
    totalDays: 0,
    completionRate: 0,
  });
  
  const currentUser = dataStore.getCurrentUser();
  const isCurrentUser = userId === currentUser.id;
  
  useEffect(() => {
    if (userId) {
      loadUserData();
    }
  }, [userId]);
  
  const loadUserData = () => {
    if (!userId) return;
    
    // Get user info
    const users = dataStore.getUsers();
    const foundUser = users.find((u) => u.id === userId);
    setUser(foundUser || null);
    
    // Get user's social posts
    const allPosts = dataStore.getSocialPosts();
    const posts = allPosts.filter((p) => p.userId === userId);
    setUserPosts(posts);
    
    // Get user's check-ins
    const checkIns = dataStore.getAllCheckIns().filter((c) => c.userId === userId);
    setUserCheckIns(checkIns);
    
    // Get user's goals
    const goals = dataStore.getGoals();
    setUserGoals(goals);
    
    // Get user's groups
    const groups = groupStore.getUserGroups(userId);
    setUserGroups(groups);
    
    // Calculate stats
    calculateStats(checkIns, goals);
  };
  
  const calculateStats = (checkIns: CheckIn[], goals: Goal[]) => {
    const completedCheckIns = checkIns.filter((c) => c.completed);
    const totalCheckIns = completedCheckIns.length;
    
    // Calculate current streak
    const sortedCheckIns = completedCheckIns
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    let streak = 0;
    const today = new Date();
    for (const checkIn of sortedCheckIns) {
      const checkInDate = new Date(checkIn.date);
      const expectedDate = new Date(today);
      expectedDate.setDate(expectedDate.getDate() - streak);
      
      if (checkInDate.toDateString() === expectedDate.toDateString()) {
        streak++;
      } else {
        break;
      }
    }
    
    // Calculate total days (unique dates)
    const uniqueDates = new Set(completedCheckIns.map((c) => c.date));
    const totalDays = uniqueDates.size;
    
    // Calculate completion rate
    const today7Days = new Date();
    today7Days.setDate(today7Days.getDate() - 7);
    const last7DaysCheckIns = completedCheckIns.filter((c) => 
      new Date(c.date) >= today7Days
    );
    const expectedCheckIns = goals.length * 7;
    const completionRate = expectedCheckIns > 0 
      ? Math.round((last7DaysCheckIns.length / expectedCheckIns) * 100)
      : 0;
    
    setStats({
      totalCheckIns,
      currentStreak: streak,
      totalDays,
      completionRate,
    });
  };
  
  const handleLikePost = (postId: string) => {
    dataStore.likePost(postId, currentUser.id);
    loadUserData();
  };
  
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    if (diffDays < 7) return `${diffDays}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };
  
  const getMoodEmoji = (mood: string) => {
    const emojis = {
      great: '😄',
      good: '😊',
      okay: '😐',
      bad: '😔',
    };
    return emojis[mood as keyof typeof emojis] || '😊';
  };
  
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">用户不存在</p>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center gap-3 mb-6">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" asChild>
              <Link to={isCurrentUser ? '/profile' : '/social'}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="text-xl font-bold">用户主页</h1>
          </div>
          
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-white/30">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-1">{user.name}</h2>
              <p className="text-blue-100 text-sm mb-3">{user.bio}</p>
              {isCurrentUser && (
                <Button size="sm" variant="secondary" asChild>
                  <Link to="/profile">编辑资料</Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="max-w-md mx-auto px-4 -mt-6">
        <div className="grid grid-cols-4 gap-2">
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.totalCheckIns}</div>
            <div className="text-xs text-gray-500 mt-1">总打卡</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.currentStreak}</div>
            <div className="text-xs text-gray-500 mt-1">连续天</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.totalDays}</div>
            <div className="text-xs text-gray-500 mt-1">坚持天</div>
          </Card>
          <Card className="p-3 text-center">
            <div className="text-2xl font-bold text-purple-600">{stats.completionRate}%</div>
            <div className="text-xs text-gray-500 mt-1">完成率</div>
          </Card>
        </div>
      </div>
      
      {/* Content Tabs */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="posts">动态 ({userPosts.length})</TabsTrigger>
            <TabsTrigger value="goals">目标 ({userGoals.length})</TabsTrigger>
            <TabsTrigger value="groups">群组 ({userGroups.length})</TabsTrigger>
          </TabsList>
          
          {/* Posts Tab */}
          <TabsContent value="posts" className="space-y-4 mt-4">
            {userPosts.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">📝</div>
                <p className="text-gray-500">
                  {isCurrentUser ? '你还没有发布动态' : '该用户还没有发布动态'}
                </p>
              </Card>
            ) : (
              userPosts.map((post) => (
                <Card key={post.id} className="p-4">
                  <div className="flex gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.userAvatar} alt={post.userName} />
                      <AvatarFallback>{post.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-gray-900">{post.userName}</span>
                        <span className="text-xs text-gray-400">{formatDate(post.timestamp)}</span>
                      </div>
                      
                      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-3 mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Target className="w-4 h-4 text-blue-600" />
                          <span className="font-medium text-gray-900">{post.goalTitle}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <TrendingUp className="w-4 h-4" />
                            <span>连续 {post.checkInStreak} 天</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span>{getMoodEmoji(post.mood)}</span>
                            <span className="capitalize">{post.mood}</span>
                          </div>
                        </div>
                      </div>
                      
                      {post.note && (
                        <p className="text-gray-700 mb-3">{post.note}</p>
                      )}
                      
                      <div className="flex items-center gap-4 pt-2 border-t">
                        <button
                          onClick={() => handleLikePost(post.id)}
                          className="flex items-center gap-1 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              post.likes.includes(currentUser.id)
                                ? 'fill-red-500 text-red-500'
                                : ''
                            }`}
                          />
                          <span className="text-sm">{post.likes.length}</span>
                        </button>
                        <div className="flex items-center gap-1 text-gray-500">
                          <MessageCircleIcon className="w-4 h-4" />
                          <span className="text-sm">{post.comments.length}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
          
          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-3 mt-4">
            {userGoals.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🎯</div>
                <p className="text-gray-500">
                  {isCurrentUser ? '你还没有设置目标' : '该用户还没有设置目标'}
                </p>
              </Card>
            ) : (
              userGoals.map((goal) => {
                const goalCheckIns = userCheckIns.filter((c) => c.goalId === goal.id && c.completed);
                const progress = goalCheckIns.length;
                const progressPercent = Math.min((progress / goal.targetDays) * 100, 100);
                
                // Calculate streak
                const sortedCheckIns = goalCheckIns
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                
                let streak = 0;
                const today = new Date();
                for (const checkIn of sortedCheckIns) {
                  const checkInDate = new Date(checkIn.date);
                  const expectedDate = new Date(today);
                  expectedDate.setDate(expectedDate.getDate() - streak);
                  
                  if (checkInDate.toDateString() === expectedDate.toDateString()) {
                    streak++;
                  } else {
                    break;
                  }
                }
                
                return (
                  <Card key={goal.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{goal.icon}</div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{goal.title}</h3>
                        <p className="text-sm text-gray-500 mb-3">{goal.description}</p>
                        
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {progress}/{goal.targetDays} 天
                          </Badge>
                          {streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-600">
                              <span>🔥</span>
                              <span className="text-sm font-medium">{streak} 天连续</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </TabsContent>
          
          {/* Groups Tab */}
          <TabsContent value="groups" className="space-y-3 mt-4">
            {userGroups.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <p className="text-gray-500">
                  {isCurrentUser ? '你还没有加入群组' : '该用户还没有加入群组'}
                </p>
              </Card>
            ) : (
              userGroups.map((group) => (
                <Card key={group.id} className="p-4" asChild>
                  <Link to={`/groups/${group.id}`}>
                    <div className="flex items-center gap-3">
                      <div className="text-4xl w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                        {group.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1">{group.name}</h3>
                        <p className="text-sm text-gray-500 truncate">{group.description}</p>
                        <p className="text-xs text-gray-400 mt-1">{group.memberIds.length} 成员</p>
                      </div>
                    </div>
                  </Link>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
