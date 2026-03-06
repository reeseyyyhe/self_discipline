import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../authContext';

type PasswordLoginValues = {
  identifier: string; // 邮箱或手机号
  password: string;
};

type SmsLoginValues = {
  phone: string;
  code: string;
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const {
    register: pwRegister,
    handleSubmit: handlePwSubmit,
    formState: pwState,
  } = useForm<PasswordLoginValues>({
    defaultValues: {
      identifier: '',
      password: '',
    },
  });

  const {
    register: smsRegister,
    handleSubmit: handleSmsSubmit,
    formState: smsState,
  } = useForm<SmsLoginValues>({
    defaultValues: {
      phone: '',
      code: '',
    },
  });

  const onSubmitPassword = async (values: PasswordLoginValues) => {
    try {
      await login({ identifier: values.identifier, password: values.password, mode: 'password' });
      navigate('/profile', { replace: true });
    } catch (error) {
      console.error('login error', error);
    }
  };

  const onSubmitSms = async (values: SmsLoginValues) => {
    try {
      if (!values.code.trim()) {
        return;
      }
      await login({ identifier: values.phone, mode: 'sms' });
      navigate('/profile', { replace: true });
    } catch (error) {
      console.error('sms login error', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-500/10 to-purple-500/5 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">欢迎回来</h1>
          <p className="text-sm text-gray-500">选择一种方式登录你的自律账号</p>
        </div>

        <Card className="p-6 shadow-sm">
          <Tabs defaultValue="password">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="password">账号密码登录</TabsTrigger>
              <TabsTrigger value="sms">手机号验证码登录</TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="space-y-5">
              <form className="space-y-5" onSubmit={handlePwSubmit(onSubmitPassword)}>
                <div className="space-y-2">
                  <Label htmlFor="identifier">邮箱 / 手机号</Label>
                  <Input
                    id="identifier"
                    placeholder="name@example.com 或 138****0000"
                    autoComplete="username"
                    {...pwRegister('identifier', { required: '请输入邮箱或手机号' })}
                  />
                  {pwState.errors.identifier && (
                    <p className="text-xs text-red-500 mt-1">{pwState.errors.identifier.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">密码</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="请输入密码"
                    autoComplete="current-password"
                    {...pwRegister('password', { required: '请输入密码' })}
                  />
                  {pwState.errors.password && (
                    <p className="text-xs text-red-500 mt-1">{pwState.errors.password.message}</p>
                  )}
                </div>

                <div className="flex items-center justify-end text-xs text-gray-500">
                  <button type="button" className="text-blue-600 hover:underline">
                    忘记密码？
                  </button>
                </div>

                <Button type="submit" className="w-full" disabled={pwState.isSubmitting}>
                  {pwState.isSubmitting ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="sms" className="space-y-5">
              <form className="space-y-5" onSubmit={handleSmsSubmit(onSubmitSms)}>
                <div className="space-y-2">
                  <Label htmlFor="phone">手机号</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="请输入手机号"
                    autoComplete="tel"
                    {...smsRegister('phone', { required: '请输入手机号' })}
                  />
                  {smsState.errors.phone && (
                    <p className="text-xs text-red-500 mt-1">{smsState.errors.phone.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="code">验证码</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      placeholder="请输入验证码"
                      {...smsRegister('code', { required: '请输入验证码' })}
                    />
                    <Button type="button" variant="outline" className="whitespace-nowrap">
                      获取验证码
                    </Button>
                  </div>
                  {smsState.errors.code && (
                    <p className="text-xs text-red-500 mt-1">{smsState.errors.code.message}</p>
                  )}
                  <p className="text-xs text-gray-400">
                    当前为本地 Mock，任意验证码均视为有效。
                  </p>
                </div>

                <Button type="submit" className="w-full" disabled={smsState.isSubmitting}>
                  {smsState.isSubmitting ? '登录中...' : '登录'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-xs text-gray-500">
            还没有账号？{' '}
            <Link to="/register" className="text-blue-600 font-medium hover:underline">
              立即注册
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}

