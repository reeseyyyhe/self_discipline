import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Settings as SettingsIcon, ArrowLeft, Mail, Phone, User as UserIcon, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { useAuth } from '../authContext';

type ProfileFormValues = {
  name: string;
  email: string;
  phone: string;
};

type PasswordFormValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function Settings() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout, updateProfile } = useAuth();

  const {
    register: profileRegister,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
  } = useForm<ProfileFormValues>({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
    },
  });

  const {
    register: passwordRegister,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
  } = useForm<PasswordFormValues>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    if (user) {
      resetProfile({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user, resetProfile]);

  const onSubmitProfile = (values: ProfileFormValues) => {
    updateProfile({
      name: values.name.trim() || user?.name,
      email: values.email.trim() || undefined,
      phone: values.phone.trim() || undefined,
    });
  };

  const onSubmitPassword = (values: PasswordFormValues) => {
    if (!values.newPassword || values.newPassword !== values.confirmPassword) {
      return;
    }
    // 本地 mock，不真正保存密码，仅重置表单
    resetPassword({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/profile', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-8">
      <div className="bg-white border-b">
        <div className="max-w-md mx-auto px-4 py-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-gray-700" />
            <h1 className="text-base font-semibold text-gray-900">设置</h1>
          </div>
          <div className="w-5 h-5" />
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 space-y-4">
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">账号信息</h2>
          <p className="text-xs text-gray-500 mb-1">当前登录账号</p>
          <p className="text-sm text-gray-900 font-medium">
            {user?.email || user?.phone || '未绑定'}
          </p>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900">个人资料</h2>
          <form className="space-y-4" onSubmit={handleProfileSubmit(onSubmitProfile)}>
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center gap-1">
                <UserIcon className="w-4 h-4 text-gray-500" />
                昵称
              </Label>
              <Input
                id="name"
                placeholder="给自己起个名字"
                autoComplete="nickname"
                {...profileRegister('name')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-1">
                <Mail className="w-4 h-4 text-gray-500" />
                绑定邮箱
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                {...profileRegister('email')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-1">
                <Phone className="w-4 h-4 text-gray-500" />
                绑定手机号
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="请输入手机号"
                autoComplete="tel"
                {...profileRegister('phone')}
              />
            </div>

            <Button type="submit" className="w-full">
              保存资料
            </Button>
          </form>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-1">
            <Lock className="w-4 h-4 text-gray-500" />
            修改密码
          </h2>
          <form className="space-y-3" onSubmit={handlePasswordSubmit(onSubmitPassword)}>
            <div className="space-y-2">
              <Label htmlFor="currentPassword">当前密码</Label>
              <Input
                id="currentPassword"
                type="password"
                placeholder="当前密码"
                autoComplete="current-password"
                {...passwordRegister('currentPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newPassword">新密码</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="至少 6 位密码"
                autoComplete="new-password"
                {...passwordRegister('newPassword')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="再次输入新密码"
                autoComplete="new-password"
                {...passwordRegister('confirmPassword')}
              />
            </div>
            <p className="text-[11px] text-gray-400">
              当前为本地 Mock 环境，修改密码仅作为交互占位，不会真正生效。
            </p>
            <Button type="submit" className="w-full" variant="outline">
              保存密码
            </Button>
          </form>
        </Card>

        <Card className="p-4">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">其他</h2>
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            退出登录
          </Button>
        </Card>

        <div className="text-[11px] text-gray-400 text-center mt-2">
          所有设置目前仅保存在本地浏览器，用于产品流程体验。
        </div>
      </div>
    </div>
  );
}

