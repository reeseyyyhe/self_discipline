import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar as CalendarIcon, Users, Award, TrendingUp, Settings as SettingsIcon } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { dataStore } from '../data/mockData';
import { User, Goal, CheckIn } from '../types';
import { Card } from '../components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Button } from '../components/ui/button';
import { useAuth } from '../authContext';
import { api } from '../data/apiClient';
import { toast } from 'sonner';

export default function Profile() {
  const { isAuthenticated, user: authUser } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 pb-20">
        <div className="max-w-md mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">请登录</h1>
          <p className="text-sm text-gray-500 mb-6">
            当前为游客模式，登录后可以同步你的自律数据、查看完整统计。
          </p>
          <div className="space-y-3">
            <Button className="w-full" asChild>
              <Link to="/login">登录</Link>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <Link to="/register">注册新账号</Link>
            </Button>
          </div>
        </div>
        <BottomNav />
      </div>
    );
  }

  const baseUser = dataStore.getCurrentUser();
  const mergedUser: User = authUser
    ? {
        ...baseUser,
        ...authUser,
        id: baseUser.id,
      }
    : baseUser;

  const [currentUser] = useState<User>(mergedUser);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [friends] = useState<User[]>(dataStore.getUsers().filter((u) => u.id !== currentUser.id));
  
  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      try {
        const [allGoals, userCheckIns] = await Promise.all([
          api.getGoals(),
          api.getCheckIns(),
        ]);
        if (cancelled) return;
        setGoals(allGoals);
        setCheckIns(userCheckIns);
      } catch (error) {
        console.error('加载个人数据失败', error);
        toast.error('加载个人数据失败，请稍后再试');
      }
    };
    loadData();
    return () => {
      cancelled = true;
    };
  }, [currentUser.id]);
  
  // Calculate stats
  const totalCheckIns = checkIns.filter((c) => c.completed).length;
  const longestStreak = Math.max(
    ...goals.map((goal) => {
      const goalCheckIns = checkIns
        .filter((c) => c.goalId === goal.id && c.completed)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      let streak = 0;
      const today = new Date();
      
      for (const checkIn of goalCheckIns) {
        const checkInDate = new Date(checkIn.date);
        const expectedDate = new Date(today);
        expectedDate.setDate(expectedDate.getDate() - streak);
        
        if (checkInDate.toDateString() === expectedDate.toDateString()) {
          streak++;
        } else {
          break;
        }
      }
      
      return streak;
    }),
    0
  );
  
  const daysActive = Math.floor(
    (Date.now() - new Date(goals[0]?.createdAt || Date.now()).getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // Get calendar data for last 30 days
  const getCalendarData = () => {
    const data: { date: string; count: number }[] = [];
    const today = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayCheckIns = checkIns.filter((c) => c.date === dateStr && c.completed);
      
      data.push({
        date: dateStr,
        count: dayCheckIns.length,
      });
    }
    
    return data;
  };
  
  const calendarData = getCalendarData();
  const maxCount = Math.max(...calendarData.map((d) => d.count), 1);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-md mx-auto px-4 py-8">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <Avatar className="w-20 h-20 ring-4 ring-white/30">
                <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
                <AvatarFallback>{currentUser.name[0]}</AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-2xl font-bold mb-1">{currentUser.name}</h1>
                <p className="text-blue-100">{currentUser.bio}</p>
              </div>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="text-white hover:bg-white/15 rounded-full"
              asChild
            >
              <Link to="/settings">
                <SettingsIcon className="w-5 h-5" />
              </Link>
            </Button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-3 text-center">
              <div className="text-2xl font-bold mb-1">{goals.length}</div>
              <div className="text-xs text-blue-100">进行目标</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-3 text-center">
              <div className="text-2xl font-bold mb-1">{totalCheckIns}</div>
              <div className="text-xs text-blue-100">总打卡数</div>
            </Card>
            <Card className="bg-white/10 backdrop-blur border-white/20 text-white p-3 text-center">
              <div className="text-2xl font-bold mb-1">{longestStreak}</div>
              <div className="text-xs text-blue-100">最长连续</div>
            </Card>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-6">
        <Tabs defaultValue="calendar" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="calendar">打卡日历</TabsTrigger>
            <TabsTrigger value="friends">好友列表</TabsTrigger>
          </TabsList>
          
          <TabsContent value="calendar" className="mt-4 space-y-4">
            {/* Calendar Heatmap */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <CalendarIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">最近30天打卡记录</h3>
              </div>
              
              <div className="grid grid-cols-10 gap-1.5">
                {calendarData.map((day) => {
                  const intensity = day.count === 0 ? 0 : Math.ceil((day.count / maxCount) * 4);
                  const colors = [
                    'bg-gray-100',
                    'bg-green-200',
                    'bg-green-400',
                    'bg-green-600',
                    'bg-green-700',
                  ];
                  
                  return (
                    <div
                      key={day.date}
                      className={`aspect-square rounded ${colors[intensity]} transition-colors cursor-pointer hover:ring-2 hover:ring-blue-400`}
                      title={`${day.date}: ${day.count} 次打卡`}
                    />
                  );
                })}
              </div>
              
              <div className="flex items-center justify-end gap-2 mt-3 text-xs text-gray-500">
                <span>少</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded bg-gray-100" />
                  <div className="w-3 h-3 rounded bg-green-200" />
                  <div className="w-3 h-3 rounded bg-green-400" />
                  <div className="w-3 h-3 rounded bg-green-600" />
                  <div className="w-3 h-3 rounded bg-green-700" />
                </div>
                <span>多</span>
              </div>
            </Card>
            
            {/* Achievements */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">我的成就</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {[
                  { icon: '🎯', title: '目标达人', desc: `已创建 ${goals.length} 个目标` },
                  { icon: '🔥', title: '坚持之星', desc: `最长连续 ${longestStreak} 天` },
                  { icon: '📅', title: '活跃会员', desc: `活跃 ${daysActive} 天` },
                  { icon: '✨', title: '打卡大师', desc: `累计打卡 ${totalCheckIns} 次` },
                ].map((achievement, index) => (
                  <div
                    key={index}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-3 text-center"
                  >
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="font-semibold text-gray-900 text-sm mb-1">
                      {achievement.title}
                    </div>
                    <div className="text-xs text-gray-600">{achievement.desc}</div>
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Statistics */}
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">数据统计</h3>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">平均完成率</span>
                  <span className="font-semibold text-gray-900">
                    {goals.length > 0
                      ? Math.round(
                          (checkIns.filter((c) => c.completed).length /
                            (goals.length * 30)) *
                            100
                        )
                      : 0}
                    %
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b">
                  <span className="text-gray-600">本周打卡</span>
                  <span className="font-semibold text-gray-900">
                    {
                      checkIns.filter((c) => {
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return new Date(c.date) >= weekAgo && c.completed;
                      }).length
                    }
                    次
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-gray-600">本月打卡</span>
                  <span className="font-semibold text-gray-900">
                    {
                      checkIns.filter((c) => {
                        const monthAgo = new Date();
                        monthAgo.setDate(monthAgo.getDate() - 30);
                        return new Date(c.date) >= monthAgo && c.completed;
                      }).length
                    }
                    次
                  </span>
                </div>
              </div>
            </Card>
          </TabsContent>
          
          <TabsContent value="friends" className="mt-4">
            <Card className="divide-y">
              <div className="p-4 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-600" />
                  <h3 className="font-semibold text-gray-900">
                    好友列表 ({friends.length})
                  </h3>
                </div>
              </div>
              
              {friends.map((friend) => {
                const friendCheckIns = dataStore.getCheckIns(friend.id);
                const friendGoals = goals;
                
                const friendStreak = Math.max(
                  ...friendGoals.map((goal) => {
                    const goalCheckIns = friendCheckIns
                      .filter((c) => c.goalId === goal.id && c.completed)
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                    
                    let streak = 0;
                    const today = new Date();
                    
                    for (const checkIn of goalCheckIns) {
                      const checkInDate = new Date(checkIn.date);
                      const expectedDate = new Date(today);
                      expectedDate.setDate(expectedDate.getDate() - streak);
                      
                      if (checkInDate.toDateString() === expectedDate.toDateString()) {
                        streak++;
                      } else {
                        break;
                      }
                    }
                    
                    return streak;
                  }),
                  0
                );
                
                return (
                  <div key={friend.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={friend.avatar} alt={friend.name} />
                        <AvatarFallback>{friend.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-900">{friend.name}</h4>
                        <p className="text-sm text-gray-500 truncate">{friend.bio}</p>
                      </div>
                      {friendStreak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                          <span className="text-orange-600">🔥</span>
                          <span className="text-sm font-medium text-orange-700">
                            {friendStreak}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  );
}
