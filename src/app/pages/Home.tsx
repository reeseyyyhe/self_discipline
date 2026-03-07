import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, TrendingUp, Award, Plus, Clock } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { Goal, CheckIn } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';
import { useAuth } from '../authContext';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../components/ui/chart';
import { PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import { api } from '../data/apiClient';

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      // 游客模式下不加载任何用户数据
      setGoals([]);
      setCheckIns([]);
      setTodayStats({ completed: 0, total: 0 });
      return;
    }

    const load = async () => {
      try {
        setIsLoading(true);
        const [goalsRes, checkInsRes] = await Promise.all([
          api.getGoals(),
          api.getCheckIns(),
        ]);
        setGoals(goalsRes);
        setCheckIns(checkInsRes);

        const todayStr = new Date().toISOString().split('T')[0];
        const todayCheckIns = checkInsRes.filter((c) => c.date === todayStr);
        setTodayStats({
          completed: todayCheckIns.filter((c) => c.completed).length,
          total: goalsRes.length,
        });
      } catch (error) {
        console.error('加载首页数据失败', error);
        toast.error('加载首页数据失败，请稍后重试');
      } finally {
        setIsLoading(false);
      }
    };

    void load();
  }, [isAuthenticated]);
  
  const getGoalStreak = (goalId: string) => {
    const goalCheckIns = checkIns
      .filter((c) => c.goalId === goalId && c.completed)
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
  };
  
  const getTodayCheckIn = (goalId: string) => {
    const today = new Date().toISOString().split('T')[0];
    return checkIns.find((c) => c.goalId === goalId && c.date === today);
  };
  
  const completionRate = todayStats.total > 0 
    ? Math.round((todayStats.completed / todayStats.total) * 100) 
    : 0;

  const today = new Date().toISOString().split('T')[0];
  const todayDurationData = (() => {
    if (!isAuthenticated) return { items: [] as { goalId: string; label: string; minutes: number }[], totalMinutes: 0 };

    const byGoal = new Map<string, number>();
    checkIns
      .filter((c) => c.date === today && c.completed)
      .forEach((c) => {
        const goal = goals.find((g) => g.id === c.goalId);
        if (!goal) return;
        const per = goal.durationMinutes ?? 0;
        if (per <= 0) return;
        byGoal.set(c.goalId, (byGoal.get(c.goalId) || 0) + per);
      });

    const items = Array.from(byGoal.entries()).map(([goalId, minutes]) => {
      const goal = goals.find((g) => g.id === goalId)!;
      return {
        goalId,
        label: goal.title,
        minutes,
      };
    });

    const totalMinutes = items.reduce((sum, item) => sum + item.minutes, 0);
    return { items, totalMinutes };
  })();

  const chartConfig = todayDurationData.items.reduce(
    (acc, item, index) => {
      acc[item.goalId] = {
        label: item.label,
        color: `hsl(${(index * 70) % 360} 80% 55%)`,
      };
      return acc;
    },
    {} as Record<string, { label: string; color: string }>,
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white p-6">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold mb-2">自律打卡</h1>
          <p className="text-blue-100">坚持每一天，遇见更好的自己</p>
          
          {/* Today's Progress */}
          <Card className="mt-6 bg-white/10 backdrop-blur border-white/20 text-white">
            <div className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  <span className="font-medium">今日进度</span>
                </div>
                <span className="text-2xl font-bold">
                  {isAuthenticated ? `${completionRate}%` : '--'}
                </span>
              </div>
              <Progress value={isAuthenticated ? completionRate : 0} className="h-2 bg-white/20" />
              <p className="text-sm text-blue-100 mt-2">
                {isAuthenticated
                  ? `已完成 ${todayStats.completed} / ${todayStats.total} 个目标`
                  : '登录后可查看你的目标完成情况'}
              </p>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {isAuthenticated ? goals.length : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {isAuthenticated ? '进行中目标' : '登录后可查看'}
                </p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                <Award className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {isAuthenticated
                    ? Math.max(...goals.map((g) => getGoalStreak(g.id)), 0)
                    : '--'}
                </p>
                <p className="text-xs text-gray-500">
                  {isAuthenticated ? '最长连续' : '登录后可查看'}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Today Time Summary */}
      {isAuthenticated && (
        <div className="max-w-md mx-auto px-4 mt-4">
          <Card className="p-4 bg-white shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <h2 className="text-sm font-semibold text-gray-900">当日打卡时间</h2>
              </div>
              <span className="text-xs text-gray-500">
                {todayDurationData.totalMinutes > 0
                  ? `共 ${
                      Math.floor(todayDurationData.totalMinutes / 60) || ''
                    }${Math.floor(todayDurationData.totalMinutes / 60) ? '小时' : ''}${
                      todayDurationData.totalMinutes % 60
                    } 分钟`
                  : '今天还没有记录时间'}
              </span>
            </div>

            {todayDurationData.items.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-6">
                完成打卡时，会根据每个目标设置的预计用时，统计今日总打卡时间。
              </p>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <ChartContainer
                  config={chartConfig}
                  className="w-full sm:w-1/2 h-40"
                >
                  <PieChart>
                    <Pie
                      data={todayDurationData.items}
                      dataKey="minutes"
                      nameKey="label"
                      innerRadius={32}
                      outerRadius={60}
                      paddingAngle={4}
                      strokeWidth={2}
                    >
                      {todayDurationData.items.map((item) => (
                        <Cell
                          key={item.goalId}
                          fill={`var(--color-${item.goalId})`}
                        />
                      ))}
                    </Pie>
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  </PieChart>
                </ChartContainer>

                <div className="flex-1 space-y-2">
                  {todayDurationData.items.map((item) => {
                    const percent =
                      todayDurationData.totalMinutes > 0
                        ? Math.round((item.minutes / todayDurationData.totalMinutes) * 100)
                        : 0;
                    return (
                      <div key={item.goalId} className="flex items-center justify-between text-xs">
                        <span className="truncate max-w-[140px]" title={item.label}>
                          {item.label}
                        </span>
                        <span className="text-gray-500">
                          {Math.floor(item.minutes / 60) ? `${Math.floor(item.minutes / 60)}小时` : ''}
                          {item.minutes % 60}分 · {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
      
      {/* Goals List */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">我的目标</h2>
          <Button size="sm" className="gap-1" asChild>
            <Link to={isAuthenticated ? '/goals' : '/login'}>
              <Plus className="w-4 h-4" />
              {isAuthenticated ? '添加目标' : '登录后添加'}
            </Link>
          </Button>
        </div>
        
        <div className="space-y-3">
          {!isAuthenticated ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">
                登录后可以创建、管理并打卡你的自律目标。
              </p>
              <Button asChild>
                <Link to="/login">去登录</Link>
              </Button>
            </Card>
          ) : goals.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500 mb-4">还没有设置目标</p>
              <Button asChild>
                <Link to="/goals">开始添加目标</Link>
              </Button>
            </Card>
          ) : (
            goals.map((goal) => {
              const streak = getGoalStreak(goal.id);
              const todayCheckIn = getTodayCheckIn(goal.id);
              const isCompleted = todayCheckIn?.completed;
              
              return (
                <Link key={goal.id} to="/goals">
                  <Card className={`p-4 transition-all hover:shadow-md ${
                    isCompleted ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200' : 'bg-white'
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{goal.icon}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {goal.title}
                          </h3>
                          {isCompleted && (
                            <span className="px-2 py-0.5 bg-green-600 text-white text-xs rounded-full">
                              已完成
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{goal.description}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="text-orange-600 font-medium">
                            🔥 连续 {streak} 天
                          </span>
                          <span className="text-gray-400">·</span>
                          <span className="text-gray-500">
                            目标 {goal.targetDays} 天
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              );
            })
          )}
        </div>
      </div>
      
      <BottomNav />
    </div>
  );
}