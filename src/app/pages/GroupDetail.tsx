import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router';
import { ArrowLeft, Send, Trophy, BarChart3, MessageCircle, Plus, Crown, Medal, Award } from 'lucide-react';
import { groupStore, dataStore } from '../data/mockData';
import { Group, GroupMessage, GroupChallenge, MemberDailyStats } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';

export default function GroupDetail() {
  const { groupId } = useParams();
  const [group, setGroup] = useState<Group | null>(null);
  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [dailyStats, setDailyStats] = useState<MemberDailyStats[]>([]);
  const [challenges, setChallenges] = useState<GroupChallenge[]>([]);
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const currentUser = dataStore.getCurrentUser();
  
  const [newChallenge, setNewChallenge] = useState({
    title: '',
    description: '',
    type: 'total_checkins' as GroupChallenge['type'],
    durationDays: 7,
  });
  
  useEffect(() => {
    if (groupId) {
      loadGroupData();
    }
  }, [groupId]);
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const loadGroupData = () => {
    if (!groupId) return;
    
    const groupData = groupStore.getGroup(groupId);
    const groupMessages = groupStore.getGroupMessages(groupId);
    const today = new Date().toISOString().split('T')[0];
    const stats = groupStore.getGroupDailyStats(groupId, today);
    const groupChallenges = groupStore.getGroupChallenges(groupId);
    
    setGroup(groupData || null);
    setMessages(groupMessages);
    setDailyStats(stats);
    setChallenges(groupChallenges);
  };
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSendMessage = () => {
    if (!newMessage.trim() || !groupId) return;
    
    const message: GroupMessage = {
      id: `msg-${Date.now()}`,
      groupId,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: newMessage,
      type: 'text',
      timestamp: new Date().toISOString(),
    };
    
    groupStore.sendMessage(message);
    setNewMessage('');
    loadGroupData();
  };
  
  const handleCreateChallenge = () => {
    if (!newChallenge.title.trim() || !groupId) {
      toast.error('请填写活动标题');
      return;
    }
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + newChallenge.durationDays);
    
    const challenge: GroupChallenge = {
      id: `challenge-${Date.now()}`,
      groupId,
      title: newChallenge.title,
      description: newChallenge.description,
      type: newChallenge.type,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      creatorId: currentUser.id,
      participants: [currentUser.id],
      status: 'active',
    };
    
    groupStore.createChallenge(challenge);
    loadGroupData();
    setIsCreateChallengeOpen(false);
    setNewChallenge({
      title: '',
      description: '',
      type: 'total_checkins',
      durationDays: 7,
    });
    toast.success('活动创建成功！');
  };
  
  const handleJoinChallenge = (challengeId: string) => {
    groupStore.joinChallenge(challengeId, currentUser.id);
    loadGroupData();
    toast.success('参加活动成功！');
  };
  
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === -1) return '昨天';
    if (diffDays > 0) return `${diffDays}天后`;
    return date.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' });
  };
  
  const getChallengeTypeLabel = (type: GroupChallenge['type']) => {
    const labels = {
      total_checkins: '打卡总数',
      streak: '连续天数',
      consistency: '完成率',
    };
    return labels[type];
  };
  
  const getChallengeStatusBadge = (status: GroupChallenge['status']) => {
    const badges = {
      active: { text: '进行中', className: 'bg-green-100 text-green-700' },
      upcoming: { text: '即将开始', className: 'bg-blue-100 text-blue-700' },
      completed: { text: '已结束', className: 'bg-gray-100 text-gray-700' },
    };
    return badges[status];
  };
  
  if (!group) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">群组不存在</p>
      </div>
    );
  }
  
  const isCreator = group.creatorId === currentUser.id;
  const isMember = group.memberIds.includes(currentUser.id);
  
  return (
    <div className="min-h-screen bg-gray-50 pb-4">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
            <div className="flex items-center gap-3 mb-3">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/20" asChild>
              <Link to="/groups">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div className="text-3xl">{group.avatar}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg truncate">{group.name}</h1>
                {isCreator && (
                  <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-[11px] rounded-full">
                    <Crown className="w-3 h-3" />
                    群主
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-100">{group.memberIds.length} 成员</p>
            </div>
          </div>
          <p className="text-sm text-blue-100">{group.description}</p>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-md mx-auto">
        <Tabs defaultValue="chat" className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="chat" className="gap-1">
                <MessageCircle className="w-4 h-4" />
                群聊
              </TabsTrigger>
              <TabsTrigger value="stats" className="gap-1">
                <BarChart3 className="w-4 h-4" />
                统计
              </TabsTrigger>
              <TabsTrigger value="challenges" className="gap-1">
                <Trophy className="w-4 h-4" />
                活动
              </TabsTrigger>
            </TabsList>
          </div>
          
          {/* Chat Tab */}
          <TabsContent value="chat" className="mt-0 h-[calc(100vh-240px)] flex flex-col">
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.map((message) => {
                const isCurrentUser = message.userId === currentUser.id;
                const isSystem = message.type === 'system';
                const isCheckIn = message.type === 'checkin';
                const isCreatorUser = message.userId === group.creatorId;
                const isChallengeNotice =
                  isSystem && message.content.includes('新活动');
                
                if (isSystem) {
                  return (
                    <div key={message.id} className="flex justify-center">
                      <div
                        className={`text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                          isChallengeNotice
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {isChallengeNotice && <Trophy className="w-3 h-3" />}
                        {message.content}
                      </div>
                    </div>
                  );
                }
                
                if (isCheckIn) {
                  return (
                    <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                      <div className="flex items-start gap-2 max-w-[80%]">
                        {!isCurrentUser && (
                          <Link to={`/user/${message.userId}`}>
                            <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                              <AvatarImage src={message.userAvatar} alt={message.userName} />
                              <AvatarFallback>{message.userName[0]}</AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                        <div>
                          {!isCurrentUser && (
                            <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                              {message.userName}
                              {isCreatorUser && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px]">
                                  <Crown className="w-3 h-3" />
                                  群主
                                </span>
                              )}
                            </p>
                          )}
                          <div className={`rounded-lg p-3 ${
                            isCurrentUser 
                              ? 'bg-blue-500 text-white' 
                              : 'bg-white border border-gray-200'
                          }`}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-2xl">{message.metadata?.goalIcon}</span>
                              <div>
                                <p className="font-medium text-sm">{message.content}</p>
                                <p className={`text-xs ${isCurrentUser ? 'text-blue-100' : 'text-gray-500'}`}>
                                  {message.metadata?.goalTitle}
                                </p>
                              </div>
                            </div>
                            {message.metadata?.streak && message.metadata.streak > 1 && (
                              <div className="flex items-center gap-1 pt-2 border-t border-white/20">
                                <span className="text-sm">🔥</span>
                                <span className="text-xs">连续 {message.metadata.streak} 天</span>
                              </div>
                            )}
                          </div>
                          <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                        {isCurrentUser && (
                          <Link to={`/user/${message.userId}`}>
                            <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                              <AvatarImage src={message.userAvatar} alt={message.userName} />
                              <AvatarFallback>{message.userName[0]}</AvatarFallback>
                            </Avatar>
                          </Link>
                        )}
                      </div>
                    </div>
                  );
                }
                
                return (
                  <div key={message.id} className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}>
                    <div className="flex items-start gap-2 max-w-[70%]">
                      {!isCurrentUser && (
                        <Link to={`/user/${message.userId}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback>{message.userName[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                      <div>
                        {!isCurrentUser && (
                          <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                            {message.userName}
                            {isCreatorUser && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700 text-[10px]">
                                <Crown className="w-3 h-3" />
                                群主
                              </span>
                            )}
                          </p>
                        )}
                        <div className={`rounded-lg px-4 py-2 ${
                          isCurrentUser 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-white border border-gray-200'
                        }`}>
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isCurrentUser ? 'text-right' : ''}`}>
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                      {isCurrentUser && (
                        <Link to={`/user/${message.userId}`}>
                          <Avatar className="w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all">
                            <AvatarImage src={message.userAvatar} alt={message.userName} />
                            <AvatarFallback>{message.userName[0]}</AvatarFallback>
                          </Avatar>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Message Input */}
            <div className="border-t bg-white px-4 py-3">
              <div className="flex gap-2">
                <Input
                  placeholder="发送消息..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                  className="flex-1"
                />
                <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Stats Tab */}
          <TabsContent value="stats" className="px-4 space-y-4 mt-4">
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-blue-600" />
                今日打卡排行
              </h3>
              
              {dailyStats.length === 0 ? (
                <p className="text-center text-gray-500 py-8">今天还没有人打卡</p>
              ) : (
                <div className="space-y-3">
                  {dailyStats.map((stat, index) => (
                    <div key={stat.userId} className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                        index === 0 
                          ? 'bg-yellow-100 text-yellow-700'
                          : index === 1
                          ? 'bg-gray-100 text-gray-700'
                          : index === 2
                          ? 'bg-orange-100 text-orange-700'
                          : 'bg-gray-50 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={stat.userAvatar} alt={stat.userName} />
                        <AvatarFallback>{stat.userName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900">{stat.userName}</p>
                        <p className="text-xs text-gray-500">
                          完成 {stat.completedCount}/{stat.totalGoals} · 连续 {stat.currentStreak} 天
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{stat.completionRate}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
            
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 mb-3">成员列表</h3>
              <div className="space-y-3">
                {group.memberIds.map((memberId) => {
                  const member = dataStore.getUsers().find((u) => u.id === memberId);
                  const memberStat = dailyStats.find((s) => s.userId === memberId);
                  
                  if (!member) return null;
                  
                  return (
                    <div key={memberId} className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-gray-900">{member.name}</p>
                          {memberId === group.creatorId && (
                            <Crown className="w-4 h-4 text-yellow-500" />
                          )}
                        </div>
                        <p className="text-xs text-gray-500">{member.bio}</p>
                      </div>
                      {memberStat && memberStat.currentStreak > 0 && (
                        <div className="flex items-center gap-1 px-2 py-1 bg-orange-100 rounded-full">
                          <span className="text-orange-600">🔥</span>
                          <span className="text-sm font-medium text-orange-700">
                            {memberStat.currentStreak}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>
          </TabsContent>
          
          {/* Challenges Tab */}
          <TabsContent value="challenges" className="px-4 space-y-4 mt-4">
            <Dialog open={isCreateChallengeOpen} onOpenChange={setIsCreateChallengeOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  发起新活动
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>创建群组活动</DialogTitle>
                  <DialogDescription>
                    发起一个打卡挑战，和成员一起比赛
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="challenge-title">活动名称</Label>
                    <Input
                      id="challenge-title"
                      placeholder="例如：7天早起挑战"
                      value={newChallenge.title}
                      onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="challenge-description">活动描述</Label>
                    <Textarea
                      id="challenge-description"
                      placeholder="描述活动规则和目标..."
                      value={newChallenge.description}
                      onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="challenge-type">比赛类型</Label>
                    <Select
                      value={newChallenge.type}
                      onValueChange={(value: GroupChallenge['type']) =>
                        setNewChallenge({ ...newChallenge, type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="total_checkins">打卡总数</SelectItem>
                        <SelectItem value="streak">连续天数</SelectItem>
                        <SelectItem value="consistency">完成率</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="challenge-duration">活动时长（天）</Label>
                    <Input
                      id="challenge-duration"
                      type="number"
                      min="1"
                      max="90"
                      value={newChallenge.durationDays}
                      onChange={(e) =>
                        setNewChallenge({ ...newChallenge, durationDays: parseInt(e.target.value) || 7 })
                      }
                    />
                  </div>
                  
                  <Button onClick={handleCreateChallenge} className="w-full">
                    创建活动
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            
            {challenges.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有活动</h3>
                <p className="text-gray-500">
                  {isCreator ? '创建一个活动，激励大家一起打卡' : '等待群主发起活动'}
                </p>
              </Card>
            ) : (
              challenges.map((challenge) => {
                const statusBadge = getChallengeStatusBadge(challenge.status);
                const isParticipating = challenge.participants.includes(currentUser.id);
                const leaderboard = groupStore.getChallengeLeaderboard(challenge.id);
                
                return (
                  <Card key={challenge.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900">{challenge.title}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusBadge.className}`}>
                            {statusBadge.text}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{challenge.description}</p>
                        <div className="flex items-center gap-3 text-xs text-gray-400">
                          <span>类型：{getChallengeTypeLabel(challenge.type)}</span>
                          <span>·</span>
                          <span>
                            {formatDate(challenge.startDate)} - {formatDate(challenge.endDate)}
                          </span>
                        </div>
                      </div>
                      <Trophy className="w-6 h-6 text-yellow-500 flex-shrink-0" />
                    </div>
                    
                    {challenge.status === 'active' && !isParticipating && (
                      <Button
                        size="sm"
                        onClick={() => handleJoinChallenge(challenge.id)}
                        className="w-full mb-3"
                      >
                        参加活动
                      </Button>
                    )}
                    
                    {leaderboard.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Medal className="w-4 h-4" />
                          排行榜
                        </p>
                        <div className="space-y-2">
                          {leaderboard.slice(0, 3).map((entry) => (
                            <div key={entry.userId} className="flex items-center gap-2">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                entry.rank === 1
                                  ? 'bg-yellow-100 text-yellow-700'
                                  : entry.rank === 2
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-orange-100 text-orange-700'
                              }`}>
                                {entry.rank}
                              </span>
                              <Avatar className="w-6 h-6">
                                <AvatarImage src={entry.userAvatar} alt={entry.userName} />
                                <AvatarFallback>{entry.userName[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-sm text-gray-700 flex-1">{entry.userName}</span>
                              <span className="text-sm font-semibold text-blue-600">{entry.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {challenge.prizes && challenge.prizes.length > 0 && (
                      <div className="border-t pt-3 mt-3">
                        <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                          <Award className="w-4 h-4" />
                          奖励
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {challenge.prizes.map((prize, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-gradient-to-r from-yellow-50 to-orange-50 text-orange-700 text-xs rounded-full border border-orange-200"
                            >
                              {prize}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}