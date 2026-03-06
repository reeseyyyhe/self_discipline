import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { Heart, MessageCircle, Send, Flame } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { dataStore } from '../data/mockData';
import { SocialPost, Comment } from '../types';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '../components/ui/avatar';
import { useAuth } from '../authContext';

const moodEmojis = {
  great: '😄',
  good: '😊',
  okay: '😐',
  bad: '😔',
};

export default function Social() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const currentUser = dataStore.getCurrentUser();
  const { isAuthenticated } = useAuth();
  
  useEffect(() => {
    if (!isAuthenticated) {
      setPosts([]);
      setCommentInputs({});
      return;
    }
    loadPosts();
  }, [isAuthenticated]);
  
  const loadPosts = () => {
    setPosts(dataStore.getSocialPosts());
  };
  
  const handleLike = (postId: string) => {
    dataStore.likePost(postId, currentUser.id);
    loadPosts();
  };
  
  const handleComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    
    const comment: Omit<Comment, 'id'> = {
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content,
      timestamp: new Date().toISOString(),
    };
    
    dataStore.addComment(postId, comment);
    setCommentInputs({ ...commentInputs, [postId]: '' });
    loadPosts();
  };
  
  const formatTime = (timestamp: string) => {
    const now = new Date();
    const postTime = new Date(timestamp);
    const diffMs = now.getTime() - postTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return '刚刚';
    if (diffMins < 60) return `${diffMins}分钟前`;
    if (diffHours < 24) return `${diffHours}小时前`;
    
    // 一天以上：显示确切日期
    return postTime.toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' });
  };
  
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">好友圈</h1>
          <p className="text-sm text-gray-500">和朋友一起坚持自律</p>
        </div>
      </div>
      
      {/* Posts Feed */}
      <div className="max-w-md mx-auto px-4 py-4">
        {!isAuthenticated ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">游客模式</h3>
            <p className="text-gray-500 mb-4">
              好友圈展示你和朋友的打卡动态。登录后可以看到彼此的坚持。
            </p>
            <Button asChild>
              <Link to="/login">去登录</Link>
            </Button>
          </Card>
        ) : posts.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无动态</h3>
            <p className="text-gray-500">
              完成打卡并分享感受<br />让好友看到你的坚持
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const isLiked = post.likes.includes(currentUser.id);
              const showComments = post.comments.length > 0;
              
              return (
                <Card key={post.id} className="p-4 bg-white">
                  {/* User Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={post.userAvatar} alt={post.userName} />
                      <AvatarFallback>{post.userName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-gray-900">{post.userName}</span>
                        <span className="text-gray-400">·</span>
                        <span className="text-sm text-gray-500">{formatTime(post.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-gray-600">打卡</span>
                        <span className="font-medium text-gray-900">{post.goalTitle}</span>
                      </div>
                    </div>
                    <div className="text-2xl">{moodEmojis[post.mood]}</div>
                  </div>
                  
                  {/* Post Content */}
                  <div className="mb-3">
                    <p className="text-gray-800 leading-relaxed">{post.note}</p>
                  </div>
                  
                  {/* Streak Badge */}
                  {post.checkInStreak > 0 && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-orange-50 to-red-50 rounded-full mb-3">
                      <Flame className="w-4 h-4 text-orange-500" />
                      <span className="text-sm font-medium text-orange-700">
                        连续打卡 {post.checkInStreak} 天
                      </span>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="flex items-center gap-4 pt-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleLike(post.id)}
                      className={`gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes.length > 0 ? post.likes.length : '点赞'}</span>
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-2 text-gray-500">
                      <MessageCircle className="w-4 h-4" />
                      <span>{post.comments.length > 0 ? post.comments.length : '评论'}</span>
                    </Button>
                  </div>
                  
                  {/* Comments */}
                  {showComments && (
                    <div className="mt-3 pt-3 border-t space-y-3">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="flex gap-2">
                          <Avatar className="w-6 h-6 flex-shrink-0">
                            <AvatarImage src={comment.userAvatar} alt={comment.userName} />
                            <AvatarFallback>{comment.userName[0]}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="bg-gray-50 rounded-lg px-3 py-2">
                              <span className="font-medium text-gray-900 text-sm">
                                {comment.userName}
                              </span>
                              <p className="text-gray-700 text-sm mt-0.5">{comment.content}</p>
                            </div>
                            <span className="text-xs text-gray-400 mt-1 inline-block">
                              {formatTime(comment.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Comment Input */}
                  <div className="mt-3 pt-3 border-t">
                    <div className="flex gap-2">
                      <Input
                        placeholder="写下你的评论..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) =>
                          setCommentInputs({ ...commentInputs, [post.id]: e.target.value })
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleComment(post.id);
                          }
                        }}
                        className="flex-1"
                      />
                      <Button
                        size="sm"
                        onClick={() => handleComment(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
      
      <BottomNav />
    </div>
  );
}
