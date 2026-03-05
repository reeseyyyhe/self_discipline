import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Calendar, TrendingUp, Award, Plus } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { dataStore } from '../data/mockData';
import { Goal, CheckIn } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Progress } from '../components/ui/progress';

export default function Home() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [todayStats, setTodayStats] = useState({ completed: 0, total: 0 });
  
  useEffect(() => {
    const allGoals = dataStore.getGoals();
    const currentUserId = dataStore.getCurrentUser().id;
    const allCheckIns = dataStore.getCheckIns(currentUserId);
    
    setGoals(allGoals);
    setCheckIns(allCheckIns);
    
    // Calculate today's stats
    const today = new Date().toISOString().split('T')[0];
    const todayCheckIns = allCheckIns.filter((c) => c.date === today);
    setTodayStats({
      completed: todayCheckIns.filter((c) => c.completed).length,
      total: allGoals.length,
    });
  }, []);
  
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
                <span className="text-2xl font-bold">{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2 bg-white/20" />
              <p className="text-sm text-blue-100 mt-2">
                已完成 {todayStats.completed} / {todayStats.total} 个目标
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
                <p className="text-2xl font-bold text-gray-900">{goals.length}</p>
                <p className="text-xs text-gray-500">进行中目标</p>
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
                  {Math.max(...goals.map((g) => getGoalStreak(g.id)), 0)}
                </p>
                <p className="text-xs text-gray-500">最长连续</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      {/* Goals List */}
      <div className="max-w-md mx-auto px-4 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">我的目标</h2>
          <Button size="sm" className="gap-1" asChild>
            <Link to="/goals">
              <Plus className="w-4 h-4" />
              添加目标
            </Link>
          </Button>
        </div>
        
        <div className="space-y-3">
          {goals.length === 0 ? (
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