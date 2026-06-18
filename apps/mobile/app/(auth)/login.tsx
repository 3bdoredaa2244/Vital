/**
 * Login — email + password with forgot-password reset and Google OAuth.
 */
import { zodResolver } from '@hookform/resolvers/zod';
import { type LoginInput, loginSchema } from '@vital/shared';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Pressable, Text, View } from 'react-native';

import { Button, FormField, Screen, toast } from '@/components/ui';
import { colors } from '@/constants/theme';
import { ApiError, authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function Login() {
  const router = useRouter();
  const applySession = useAuthStore((s) => s.applySession);
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    setSubmitting(true);
    try {
      const res = await authApi.login(data);
      await applySession(res.access_token, res.refresh_token);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        toast.error('Invalid email or password');
      } else if (err instanceof ApiError) {
        toast.error(err.message);
      } else {
        toast.error('Could not sign in');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const onForgot = async () => {
    const email = getValues('email');
    if (!email) {
      toast.info('Enter your email first');
      return;
    }
    await authApi.resetPassword(email).catch(() => undefined);
    toast.success('If that email exists, a reset link is on its way');
  };

  return (
    <Screen scroll>
      <Text className="mb-1 mt-6 font-display" style={{ color: colors.white, fontSize: 34 }}>
        Welcome back
      </Text>
      <Text className="mb-8 font-body" style={{ color: colors.textDim, fontSize: 14 }}>
        Sign in to continue.
      </Text>

      <FormField control={control} name="email" label="Email" keyboardType="email-address" error={errors.email?.message} />
      <FormField control={control} name="password" label="Password" secureTextEntry error={errors.password?.message} />

      <Pressable className="mb-6 self-end" onPress={onForgot}>
        <Text className="font-body" style={{ color: colors.cyan, fontSize: 13 }}>
          Forgot password?
        </Text>
      </Pressable>

      <Button label="Sign In" onPress={handleSubmit(onSubmit)} loading={submitting} />

      <View className="my-5 flex-row items-center">
        <View className="flex-1" style={{ height: 1, backgroundColor: colors.border }} />
        <Text className="mx-3 font-mono" style={{ color: colors.textMuted, fontSize: 11 }}>
          OR
        </Text>
        <View className="flex-1" style={{ height: 1, backgroundColor: colors.border }} />
      </View>

      <Button
        label="Continue with Google"
        variant="secondary"
        icon="Chrome"
        onPress={() => toast.info('Google sign-in opens via Supabase OAuth')}
      />

      <Pressable className="mt-6 items-center" onPress={() => router.replace('/(auth)/signup')}>
        <Text className="font-body" style={{ color: colors.textDim, fontSize: 13 }}>
          New to VITAL? <Text style={{ color: colors.gold }}>Create an account</Text>
        </Text>
      </Pressable>
    </Screen>
  );
}
