import React, { useState, useEffect, useRef } from "react";
import LeftPanel from "@/components/auth/LeftPanel";
import RightPanel from "@/components/auth/RightPanel";
import { AuthPageLayout } from "@/components/auth/AuthPageLayout";
import { useAuth } from "@/hooks/shared/useAuth";
import { getDashboardByRole } from "@/hooks/shared/useRoleRedirect";
import { useLocation, useNavigate } from 'react-router-dom';
import { authService } from "@/services/authService";
import { friendlyErrorMessage } from '@/utils/shared/friendlyError';
import { toAuthUser } from '@/utils/shared/authUser';

const getApiErrorMessage = (error: unknown): string | undefined => {
  if (
    typeof error !== "object" ||
    error === null ||
    !("response" in error)
  ) {
    return undefined;
  }

  const response = error.response;
  if (
    typeof response !== "object" ||
    response === null ||
    !("data" in response)
  ) {
    return undefined;
  }

  const data = response.data;
  if (
    typeof data !== "object" ||
    data === null ||
    !("message" in data) ||
    typeof data.message !== "string"
  ) {
    return undefined;
  }

  if ((error as { response?: { status?: number } }).response?.status === 401) {
    return 'Tên đăng nhập hoặc mật khẩu không chính xác. Vui lòng thử lại.';
  }
  return friendlyErrorMessage(error, 'Thông tin đăng nhập chưa chính xác hoặc tài khoản chưa thể truy cập. Vui lòng thử lại.');
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [passwordChangedNotice] = useState(() => sessionStorage.getItem('ojt_password_changed_notice') ?? '');
  const statusMessage = typeof location.state?.message === 'string' ? location.state.message : passwordChangedNotice;
  useEffect(() => { sessionStorage.removeItem('ojt_password_changed_notice'); }, []);

  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setAnimateIn(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsVisible(true); },
      { threshold: 0.3 }
    );
    if (statsRef.current) observer.observe(statsRef.current);
    return () => observer.disconnect();
  }, []);

  const loginWithCredentials = async (email: string, password: string) => {
    setIsLoading(true);
    setErrorMessage("");

    try {
      const loginResponse = await authService.login({
        email: email.trim(),
        password,
      });
      const profile = loginResponse.user ?? (await authService.getCurrentUser(loginResponse.token)).user;
      const accountUser = toAuthUser({
        ...profile, mustChangePassword: loginResponse.mustChangePassword ?? profile.mustChangePassword,
      });
      login(loginResponse.token, accountUser);
      navigate(accountUser.mustChangePassword ? '/change-password' : getDashboardByRole(accountUser.role), { replace: true });
    } catch (error) {
      const apiErrorMessage = getApiErrorMessage(error);
      if (apiErrorMessage) {
        setErrorMessage(apiErrorMessage);
      } else {
        setErrorMessage(friendlyErrorMessage(error, "Không thể đăng nhập. Vui lòng thử lại."));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    await loginWithCredentials(account, password);
  };

  return (
    <AuthPageLayout>
        <LeftPanel
          statsRef={statsRef}
          statsVisible={statsVisible}
        />

        <RightPanel
          animateIn={animateIn}
          account={account}
          onAccountChange={setAccount}
          password={password}
          onPasswordChange={setPassword}
          showPassword={showPassword}
          onTogglePassword={() => setShowPassword((v) => !v)}
          isLoading={isLoading}
          errorMessage={errorMessage}
          statusMessage={statusMessage}
          onSubmit={handleLogin}
          onQuickLogin={loginWithCredentials}
        />
    </AuthPageLayout>
  );
};

export default LoginPage;
