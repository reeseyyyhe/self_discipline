import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Target, Plus, TrendingUp, Calendar, Trash2, Circle, CheckCircle, MessageSquare, Pencil } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { dataStore, groupStore } from '../data/mockData';
import { Goal, CheckIn } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { useAuth } from '../authContext';

const emojiOptions = ['🏃', '🌅', '📚', '💪', '🧘', '✍️', '🎯', '🎨', '🎵', '🍎', '💧', '🚴'];

export default function Goals() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isCheckInDialogOpen, setIsCheckInDialogOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  
  // Form states
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    icon: '🎯',
    targetDays: 30,
    durationMinutes: 30,
    category: 'lifestyle' as Goal['category'],
  });
  const [editGoal, setEditGoal] = useState({
    title: '',
    description: '',
    icon: '🎯',
    targetDays: 30,
    durationMinutes: 30,
    category: 'lifestyle' as Goal['category'],
  });
  
  const [checkInForm, setCheckInForm] = useState({
    note: '',
    mood: 'good' as CheckIn['mood'],
    shareToGroups: [] as string[],
  });
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      setGoals([]);
      setCheckIns([]);
      return;
    }
    loadData();
  }, [isAuthenticated]);
  
  const loadData = () => {
    const allGoals = dataStore.getGoals();
    const currentUserId = dataStore.getCurrentUser().id;
    const allCheckIns = dataStore.getCheckIns(currentUserId);
    
    setGoals(allGoals);
    setCheckIns(allCheckIns);
  };
  
  const categoryLabels: Record<Goal['category'], string> = {
    health: '健康',
    study: '学习',
    work: '工作',
    lifestyle: '生活方式',
    general: '通用',
  };
  
  const handleAddGoal = () => {
    if (!newGoal.title.trim()) {
      toast.error('请输入目标名称');
      return;
    }
    
    const goal: Goal = {
      id: `goal-${Date.now()}`,
      title: newGoal.title,
      description: newGoal.description,
      icon: newGoal.icon,
      targetDays: newGoal.targetDays,
      durationMinutes: Number.isFinite(newGoal.durationMinutes) && newGoal.durationMinutes > 0
        ? newGoal.durationMinutes
        : 30,
      category: newGoal.category,
      createdAt: new Date().toISOString(),
    };
    
    dataStore.addGoal(goal);
    loadData();
    setIsAddDialogOpen(false);
    setNewGoal({
      title: '',
      description: '',
      icon: '🎯',
      targetDays: 30,
      durationMinutes: 30,
      category: 'lifestyle',
    });
    toast.success('目标添加成功！');
  };
  
  const handleDeleteGoal = (goalId: string) => {
    if (confirm('确定要删除这个目标吗？')) {
      dataStore.deleteGoal(goalId);
      loadData();
      toast.success('目标已删除');
    }
  };
  
  const handleCheckIn = () => {
    if (!selectedGoal) return;
    
    const today = new Date().toISOString().split('T')[0];
    const existingCheckIn = checkIns.find(
      (c) => c.goalId === selectedGoal.id && c.date === today
    );
    
    const checkIn: CheckIn = {
      id: `checkin-${Date.now()}`,
      goalId: selectedGoal.id,
      userId: dataStore.getCurrentUser().id,
      date: today,
      completed: true,
      note: checkInForm.note,
      mood: checkInForm.mood,
      timestamp: new Date().toISOString(),
    };
    
    dataStore.addCheckIn(checkIn);
    
    // Share to selected groups
    if (checkInForm.shareToGroups.length > 0) {
      checkInForm.shareToGroups.forEach((groupId) => {
        groupStore.shareCheckInToGroup(groupId, checkIn);
      });
    }
    
    loadData();
    setIsCheckInDialogOpen(false);
    setSelectedGoal(null);
    setCheckInForm({ note: '', mood: 'good', shareToGroups: [] });
    
    const messages = [];
    if (checkInForm.note.trim()) {
      messages.push('已分享到好友圈');
    }
    if (checkInForm.shareToGroups.length > 0) {
      messages.push(`已分享到${checkInForm.shareToGroups.length}个群组`);
    }
    
    toast.success(messages.length > 0 ? `打卡成功！${messages.join('、')}` : '打卡成功！');
  };
  
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
  
  const openCheckInDialog = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsCheckInDialogOpen(true);
  };
  
  const openEditDialog = (goal: Goal) => {
    setEditingGoal(goal);
    setEditGoal({
      title: goal.title,
      description: goal.description,
      icon: goal.icon,
      targetDays: goal.targetDays,
      durationMinutes: goal.durationMinutes ?? 30,
      category: goal.category,
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateGoal = () => {
    if (!editingGoal) return;
    if (!editGoal.title.trim()) {
      toast.error('请输入目标名称');
      return;
    }
    
    dataStore.updateGoal(editingGoal.id, {
      title: editGoal.title,
      description: editGoal.description,
      icon: editGoal.icon,
      targetDays: editGoal.targetDays,
      durationMinutes:
        Number.isFinite(editGoal.durationMinutes) && editGoal.durationMinutes > 0
          ? editGoal.durationMinutes
          : editingGoal.durationMinutes,
      category: editGoal.category,
    });
    loadData();
    setIsEditDialogOpen(false);
    setEditingGoal(null);
    toast.success('目标已更新');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900">我的目标</h1>
            {isAuthenticated ? (
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="gap-1">
                    <Plus className="w-4 h-4" />
                    添加目标
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>添加新目标</DialogTitle>
                    <DialogDescription>
                      创建一个新的自律目标，设定天数并开始坚持
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>选择图标</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            onClick={() => setNewGoal({ ...newGoal, icon: emoji })}
                            className={`text-3xl p-2 rounded-lg transition-colors ${
                              newGoal.icon === emoji
                                ? 'bg-blue-100 ring-2 ring-blue-500'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="title">目标名称</Label>
                      <Input
                        id="title"
                        placeholder="例如：每天运动30分钟"
                        value={newGoal.title}
                        onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">目标描述</Label>
                      <Textarea
                        id="description"
                        placeholder="添加一些描述..."
                        value={newGoal.description}
                        onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">分类</Label>
                      <Select
                        value={newGoal.category}
                        onValueChange={(value: Goal['category']) =>
                          setNewGoal({ ...newGoal, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="health">健康</SelectItem>
                          <SelectItem value="study">学习</SelectItem>
                          <SelectItem value="work">工作</SelectItem>
                          <SelectItem value="lifestyle">生活方式</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="targetDays">目标天数</Label>
                      <Input
                        id="targetDays"
                        type="number"
                        min="1"
                        value={newGoal.targetDays}
                        onChange={(e) =>
                          setNewGoal({ ...newGoal, targetDays: parseInt(e.target.value) || 30 })
                        }
                      />
                    </div>
                    
                    <div>
                      <Label>每次完成预计用时</Label>
                      <div className="mt-2 flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          className="w-20"
                          value={Math.floor(newGoal.durationMinutes / 60)}
                          onChange={(e) => {
                            const hours = parseInt(e.target.value) || 0;
                            const mins = newGoal.durationMinutes % 60;
                            setNewGoal({ ...newGoal, durationMinutes: hours * 60 + mins });
                          }}
                        />
                        <span className="text-sm text-gray-600">小时</span>
                        <Input
                          type="number"
                          min="0"
                          max="59"
                          className="w-20"
                          value={newGoal.durationMinutes % 60}
                          onChange={(e) => {
                            let mins = parseInt(e.target.value) || 0;
                            if (mins < 0) mins = 0;
                            if (mins > 59) mins = 59;
                            const hours = Math.floor(newGoal.durationMinutes / 60);
                            setNewGoal({ ...newGoal, durationMinutes: hours * 60 + mins });
                          }}
                        />
                        <span className="text-sm text-gray-600">分钟</span>
                      </div>
                    </div>
                    
                    <Button onClick={handleAddGoal} className="w-full">
                      创建目标
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/login">登录后添加目标</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      
      {/* Goals List */}
      <div className="max-w-md mx-auto px-4 py-6">
        {!isAuthenticated ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">游客模式</h3>
            <p className="text-gray-500 mb-4">
              登录后可以创建和管理你的自律目标，并记录每日打卡。
            </p>
            <Button asChild>
              <Link to="/login">去登录</Link>
            </Button>
          </Card>
        ) : goals.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有目标</h3>
            <p className="text-gray-500 mb-6">点击右上角添加你的第一个自律目标</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const streak = getGoalStreak(goal.id);
              const todayCheckIn = getTodayCheckIn(goal.id);
              const isCompleted = todayCheckIn?.completed;
              const completionRate = Math.round((streak / goal.targetDays) * 100);
              
              return (
                <Card key={goal.id} className="p-5 bg-white">
                  <div className="flex gap-4">
                    <div className="text-5xl">{goal.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-900 text-lg truncate">{goal.title}</h3>
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full flex-shrink-0">
                              {categoryLabels[goal.category]}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{goal.description}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(goal)}
                            className="text-gray-400 hover:text-blue-600"
                          >
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteGoal(goal.id)}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-3 mt-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">进度</span>
                          <span className="font-semibold text-gray-900">
                            {streak} / {goal.targetDays} 天
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(completionRate, 100)}%` }}
                          />
                        </div>
                        
                        <div className="flex items-center gap-2 pt-2">
                          {isCompleted ? (
                            <Button disabled className="flex-1 gap-2">
                              <CheckCircle className="w-4 h-4" />
                              今日已完成
                            </Button>
                          ) : (
                            <Button
                              onClick={() => openCheckInDialog(goal)}
                              className="flex-1 gap-2"
                            >
                              <Circle className="w-4 h-4" />
                              今日打卡
                            </Button>
                          )}
                        </div>
                        
                        {streak > 0 && (
                          <div className="flex items-center justify-center gap-2 text-orange-600 bg-orange-50 rounded-lg py-2 mt-2">
                            <span className="text-xl">🔥</span>
                            <span className="font-semibold">连续坚持 {streak} 天</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      {/* Check-in Dialog */}
      <Dialog open={isCheckInDialogOpen} onOpenChange={setIsCheckInDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>打卡 - {selectedGoal?.title}</DialogTitle>
            <DialogDescription>
              记录今天的完成情况并分享到群组
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>今天的心情</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[
                  { value: 'great', emoji: '😄', label: '很棒' },
                  { value: 'good', emoji: '😊', label: '不错' },
                  { value: 'okay', emoji: '😐', label: '一般' },
                  { value: 'bad', emoji: '😔', label: '不好' },
                ].map((mood) => (
                  <button
                    key={mood.value}
                    onClick={() => setCheckInForm({ ...checkInForm, mood: mood.value as any })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      checkInForm.mood === mood.value
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{mood.emoji}</div>
                    <div className="text-xs text-gray-600">{mood.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="note">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  分享到好友圈（可选）
                </div>
              </Label>
              <Textarea
                id="note"
                placeholder="分享今天的感受和收获..."
                value={checkInForm.note}
                onChange={(e) => setCheckInForm({ ...checkInForm, note: e.target.value })}
                className="mt-2"
                rows={3}
              />
              <p className="text-xs text-gray-500 mt-1">
                {checkInForm.note.trim() ? '✓ 将分享到好友圈' : '不填写则不分享'}
              </p>
            </div>
            
            <div>
              <Label>
                <div className="flex items-center gap-2 mb-2">
                  <span>👥</span>
                  分享到群组（可选）
                </div>
              </Label>
              {(() => {
                const currentUser = dataStore.getCurrentUser();
                const myGroups = groupStore.getUserGroups(currentUser.id);
                
                if (myGroups.length === 0) {
                  return (
                    <p className="text-sm text-gray-500 py-2">
                      你还没有加入任何群组
                    </p>
                  );
                }
                
                return (
                  <div className="space-y-2 border rounded-lg p-3 max-h-40 overflow-y-auto">
                    {myGroups.map((group) => {
                      const isChecked = checkInForm.shareToGroups.includes(group.id);
                      return (
                        <div key={group.id} className="flex items-center gap-2">
                          <Checkbox
                            id={`group-${group.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setCheckInForm({
                                  ...checkInForm,
                                  shareToGroups: [...checkInForm.shareToGroups, group.id],
                                });
                              } else {
                                setCheckInForm({
                                  ...checkInForm,
                                  shareToGroups: checkInForm.shareToGroups.filter(id => id !== group.id),
                                });
                              }
                            }}
                          />
                          <label
                            htmlFor={`group-${group.id}`}
                            className="flex items-center gap-2 flex-1 cursor-pointer"
                          >
                            <span className="text-lg">{group.avatar}</span>
                            <span className="text-sm font-medium text-gray-900">{group.name}</span>
                          </label>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              {checkInForm.shareToGroups.length > 0 && (
                <p className="text-xs text-green-600 mt-1">
                  ✓ 将分享到 {checkInForm.shareToGroups.length} 个群组
                </p>
              )}
            </div>
            
            <Button onClick={handleCheckIn} className="w-full">
              完成打卡
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Edit Goal Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑目标</DialogTitle>
            <DialogDescription>修改目标信息并更新你的自律计划</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>选择图标</Label>
              <div className="grid grid-cols-6 gap-2 mt-2">
                {emojiOptions.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => setEditGoal({ ...editGoal, icon: emoji })}
                    className={`text-3xl p-2 rounded-lg transition-colors ${
                      editGoal.icon === emoji
                        ? 'bg-blue-100 ring-2 ring-blue-500'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-title">目标名称</Label>
              <Input
                id="edit-title"
                placeholder="例如：每天运动30分钟"
                value={editGoal.title}
                onChange={(e) => setEditGoal({ ...editGoal, title: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-description">目标描述</Label>
              <Textarea
                id="edit-description"
                placeholder="添加一些描述..."
                value={editGoal.description}
                onChange={(e) => setEditGoal({ ...editGoal, description: e.target.value })}
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">分类</Label>
              <Select
                value={editGoal.category}
                onValueChange={(value: Goal['category']) =>
                  setEditGoal({ ...editGoal, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="health">健康</SelectItem>
                  <SelectItem value="study">学习</SelectItem>
                  <SelectItem value="work">工作</SelectItem>
                  <SelectItem value="lifestyle">生活方式</SelectItem>
                  <SelectItem value="general">通用</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-targetDays">目标天数</Label>
              <Input
                id="edit-targetDays"
                type="number"
                min="1"
                value={editGoal.targetDays}
                onChange={(e) =>
                  setEditGoal({
                    ...editGoal,
                    targetDays: parseInt(e.target.value) || 30,
                  })
                }
              />
            </div>
            
            <div>
              <Label>每次完成预计用时</Label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  min="0"
                  className="w-20"
                  value={Math.floor(editGoal.durationMinutes / 60)}
                  onChange={(e) => {
                    const hours = parseInt(e.target.value) || 0;
                    const mins = editGoal.durationMinutes % 60;
                    setEditGoal({ ...editGoal, durationMinutes: hours * 60 + mins });
                  }}
                />
                <span className="text-sm text-gray-600">小时</span>
                <Input
                  type="number"
                  min="0"
                  max="59"
                  className="w-20"
                  value={editGoal.durationMinutes % 60}
                  onChange={(e) => {
                    let mins = parseInt(e.target.value) || 0;
                    if (mins < 0) mins = 0;
                    if (mins > 59) mins = 59;
                    const hours = Math.floor(editGoal.durationMinutes / 60);
                    setEditGoal({ ...editGoal, durationMinutes: hours * 60 + mins });
                  }}
                />
                <span className="text-sm text-gray-600">分钟</span>
              </div>
            </div>
            
            <Button onClick={handleUpdateGoal} className="w-full">
              保存修改
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      <BottomNav />
    </div>
  );
}