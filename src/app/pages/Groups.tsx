import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Plus, Users as UsersIcon, ChevronRight, Search } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { groupStore, dataStore } from '../data/mockData';
import { Group } from '../types';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { useAuth } from '../authContext';

const groupAvatars = ['🌅', '💪', '📚', '🏃', '🧘', '✍️', '🎯', '🎨', '⚡', '🌟'];

export default function Groups() {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [allGroups, setAllGroups] = useState<Group[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const currentUser = dataStore.getCurrentUser();
  const { isAuthenticated } = useAuth();
  
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    avatar: '🎯',
    category: 'general' as Group['category'],
  });
  
  useEffect(() => {
    if (!isAuthenticated) {
      setMyGroups([]);
      setAllGroups([]);
      return;
    }
    loadGroups();
  }, [isAuthenticated]);
  
  const loadGroups = () => {
    const userGroups = groupStore.getUserGroups(currentUser.id);
    const allGroupsList = groupStore.getGroups();
    
    setMyGroups(userGroups);
    setAllGroups(allGroupsList);
  };
  
  const handleCreateGroup = () => {
    if (!newGroup.name.trim()) {
      toast.error('请输入群组名称');
      return;
    }
    
    const group: Group = {
      id: `group-${Date.now()}`,
      name: newGroup.name,
      description: newGroup.description,
      avatar: newGroup.avatar,
      creatorId: currentUser.id,
      memberIds: [currentUser.id],
      createdAt: new Date().toISOString(),
      category: newGroup.category,
    };
    
    groupStore.createGroup(group);
    loadGroups();
    setIsCreateDialogOpen(false);
    setNewGroup({
      name: '',
      description: '',
      avatar: '🎯',
      category: 'general',
    });
    toast.success('群组创建成功！');
  };
  
  const handleJoinGroup = (groupId: string) => {
    groupStore.joinGroup(groupId, currentUser.id);
    loadGroups();
    toast.success('加入群组成功！');
  };
  
  const handleLeaveGroup = (groupId: string) => {
    if (!confirm('确定要退出该群组吗？')) return;
    groupStore.leaveGroup(groupId, currentUser.id);
    loadGroups();
    toast.success('已退出群组');
  };
  
  const filteredGroups = allGroups.filter((group) => {
    if (myGroups.find((g) => g.id === group.id)) return false;
    if (!searchQuery.trim()) return true;
    
    const q = searchQuery.toLowerCase();
    return (
      group.name.toLowerCase().includes(q) ||
      group.description.toLowerCase().includes(q) ||
      group.id.toLowerCase().includes(q)
    );
  });
  
  const categoryLabels = {
    health: '健康',
    study: '学习',
    work: '工作',
    lifestyle: '生活方式',
    general: '综合',
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 text-white">
        <div className="max-w-md mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold">打卡群组</h1>
              <p className="text-blue-100 text-sm">找到志同道合的小伙伴</p>
            </div>
            {isAuthenticated ? (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="secondary" className="gap-1">
                    <Plus className="w-4 h-4" />
                    创建群组
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>创建新群组</DialogTitle>
                    <DialogDescription>
                      创建一个打卡群组，邀请好友一起互相监督
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label>选择头像</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {groupAvatars.map((avatar) => (
                          <button
                            key={avatar}
                            onClick={() => setNewGroup({ ...newGroup, avatar })}
                            className={`text-3xl p-2 rounded-lg transition-colors ${
                              newGroup.avatar === avatar
                                ? 'bg-blue-100 ring-2 ring-blue-500'
                                : 'hover:bg-gray-100'
                            }`}
                          >
                            {avatar}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="name">群组名称</Label>
                      <Input
                        id="name"
                        placeholder="例如：早起打卡团"
                        value={newGroup.name}
                        onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="description">群组描述</Label>
                      <Textarea
                        id="description"
                        placeholder="介绍一下群组的目标..."
                        value={newGroup.description}
                        onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="category">分类</Label>
                      <Select
                        value={newGroup.category}
                        onValueChange={(value: Group['category']) =>
                          setNewGroup({ ...newGroup, category: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">综合</SelectItem>
                          <SelectItem value="health">健康</SelectItem>
                          <SelectItem value="study">学习</SelectItem>
                          <SelectItem value="work">工作</SelectItem>
                          <SelectItem value="lifestyle">生活方式</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <Button onClick={handleCreateGroup} className="w-full">
                      创建群组
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            ) : (
              <Button size="sm" variant="outline" asChild>
                <Link to="/login">登录后创建群组</Link>
              </Button>
            )}
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="搜索群名、简介或群ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/20 border-white/30 text-white placeholder:text-blue-100"
              />
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="max-w-md mx-auto px-4 py-4">
        <Tabs defaultValue="my" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="my">
              我的群组 {isAuthenticated ? `(${myGroups.length})` : ''}
            </TabsTrigger>
            <TabsTrigger value="discover">发现群组</TabsTrigger>
          </TabsList>
          
          <TabsContent value="my" className="space-y-3">
            {!isAuthenticated ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">游客模式</h3>
                <p className="text-gray-500 mb-4">
                  登录后可以查看你加入的群组，并和大家一起打卡。
                </p>
                <Button asChild>
                  <Link to="/login">去登录</Link>
                </Button>
              </Card>
            ) : myGroups.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">👥</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有加入群组</h3>
                <p className="text-gray-500 mb-4">
                  加入或创建群组，和朋友一起打卡
                </p>
              </Card>
            ) : (
              myGroups.map((group) => (
                <Card key={group.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <Link to={`/groups/${group.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-4xl w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl">
                        {group.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {group.name}
                          </h3>
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                            {categoryLabels[group.category]}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 truncate mb-2">
                          {group.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <UsersIcon className="w-3 h-3" />
                          <span>{group.memberIds.length} 成员</span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 break-all">
                          群ID：{group.id}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    </Link>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLeaveGroup(group.id)}
                      className="ml-2"
                    >
                      退出
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="discover" className="space-y-3">
            {filteredGroups.length === 0 ? (
              <Card className="p-12 text-center">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery ? '没有找到相关群组' : '没有更多群组'}
                </h3>
                <p className="text-gray-500">
                  {searchQuery ? '试试其他关键词' : '创建一个新的群组吧'}
                </p>
              </Card>
            ) : (
              filteredGroups.map((group) => (
                <Card key={group.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-4xl w-14 h-14 flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl flex-shrink-0">
                      {group.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {group.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full flex-shrink-0">
                          {categoryLabels[group.category]}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{group.description}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <UsersIcon className="w-3 h-3" />
                          <span>{group.memberIds.length} 成员</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleJoinGroup(group.id)}
                          className="gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          加入
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      <BottomNav />
    </div>
  );
}
