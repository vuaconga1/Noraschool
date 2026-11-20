"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { Routes } from "../../lib/constants/routes";
import { ArrowLeft, BookOpen, Eye, EyeOff, Target, Trophy } from "lucide-react";
import Notification from "../components/notification";
import Image from "next/image";
import { fetchSessionMe } from "@/lib/client/session-me";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "info" | "success" | "error";
    visible: boolean;
  }>({
    message: "",
    type: "info",
    visible: false,
  });

  const showNotification = (
    message: string,
    type: "info" | "success" | "error" = "info",
  ) => {
    setNotification({ message, type, visible: true });
  };

  const features = [
    {
      icon: <BookOpen className="w-6 h-6 text-white" />,
      text: "Truy cập hàng nghìn học liệu chất lượng",
    },
    {
      icon: <Target className="w-6 h-6 text-white" />,
      text: "Theo dõi tiến độ học tập cá nhân",
    },
    {
      icon: <Trophy className="w-6 h-6 text-white" />,
      text: "Tham gia cộng đồng học viên năng động",
    },
  ];

  useEffect(() => {
    fetchSessionMe().then((user) => {
      if (user) router.push(Routes.HOME);
    });
  }, [router]);

  const handleCredentialsLogin = async () => {
    const trimmedIdentifier = identifier.trim();
    if (!trimmedIdentifier || !password) {
      showNotification("Vui lòng nhập tên đăng nhập/email và mật khẩu", "error");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: trimmedIdentifier, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(data.message || "Đăng nhập thất bại", "error");
        setIsLoading(false);
        return;
      }

      if (data.user) setUser(data.user);
      showNotification(data.message || "Đăng nhập thành công", "success");
      router.push(Routes.HOME);
    } catch {
      showNotification("Có lỗi xảy ra, vui lòng thử lại", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCredentialsLogin();
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden font-[Lexend] z-9999 text-black">
      {/* LEFT SIDE (UI mẫu) */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[60%] relative bg-linear-to-br from-[#ffc3df] via-[#ffd6ea] to-[#b8e6ff] items-center justify-center overflow-hidden"
      >
        {/* Animated background */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-125 h-125 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        {/* Logo + Text */}
        <div className="relative z-10 px-16 max-w-4xl">
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            <div className="mb-12">
              <Image
                src="/assets/logo.png"
                alt="Nora Logo"
                width={280}
                height={280}
                className="mb-8 rounded-2xl bg-white/95 p-4 object-contain"
              />
            </div>

            <h1 className="text-5xl font-black text-white mb-6 leading-tight">
              Chào mừng trở lại!
            </h1>

            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Đăng nhập để tiếp tục hành trình học tập cùng NORA Preschool
            </p>

            <div className="space-y-4 mt-12">
              {features.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ x: -30, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.5 + idx * 0.1 }}
                  className="flex items-center gap-4 text-white/90"
                >
                  {item.icon}
                  <span className="text-lg">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      {/* RIGHT SIDE (Form + Logic NextAuth) */}
      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="
          w-full lg:w-[40%] 
          bg-white flex items-center justify-center 
          p-6 sm:p-8 lg:p-16 
          overflow-y-auto
          relative
        "
      >
        {/* MOBILE BACKGROUND DECORATION */}
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute -top-10 -right-20 w-72 h-72 rounded-full bg-pink-200/50 blur-3xl" />
          <div className="absolute -bottom-15 -left-20 w-72 h-72 rounded-full bg-sky-200/50 blur-3xl" />
        </div>

        <div
          className="
            w-full max-w-md 
            relative z-10 
            bg-white/80 backdrop-blur-xl
            rounded-[28px] shadow-xl 
            px-6 py-10 sm:px-8
            border border-white/50
          "
        >
          {/* BACK TO HOME — INSIDE CARD */}
          <button
            onClick={() => router.push(Routes.HOME)}
            className="
              flex items-center gap-2
              text-sm font-medium text-gray-500
              hover:text-[#e85a9b] transition
              mb-6
            "
          >
            <ArrowLeft className="w-4 h-4" />
            Trang chủ
          </button>

          <div className="lg:hidden flex justify-center mb-6">
            <Image
              src="/assets/logo.png"
              alt="Nora"
              width={120}
              height={120}
              className="object-contain"
              priority
            />
          </div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
              Đăng nhập
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              Nhập thông tin tài khoản của bạn
            </p>
          </motion.div>

          {/* FORM */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Username / Email */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tên đăng nhập hoặc Email
              </label>
              <input
                type="text"
                autoComplete="username"
                autoCapitalize="none"
                value={identifier}
                onKeyPress={handleKeyPress}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Mã học viên hoặc example@nora.com.vn"
                className="
            w-full px-4 py-3.5 
            border-2 border-gray-200 rounded-xl 
            focus:border-[#e85a9b] focus:ring-4 focus:ring-pink-100 
            transition outline-none
            shadow-sm
          "
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onKeyPress={handleKeyPress}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="
              w-full px-4 py-3.5 
              border-2 border-gray-200 rounded-xl 
              focus:border-[#e85a9b] focus:ring-4 focus:ring-pink-100
              transition outline-none
              shadow-sm
            "
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            {/* Forgot Password */}
            <div className="text-right -mt-2">
              <button
                onClick={() => router.push("/forgot-password")}
                className="text-sm text-[#e85a9b] hover:text-[#af4e80] font-medium"
              >
                Quên mật khẩu?
              </button>
            </div>

            {/* Error */}
            {errorMessage && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="
            bg-red-50 text-red-600 text-sm 
            px-4 py-3 rounded-xl 
            border border-red-100 flex items-center gap-2
          "
              >
                {errorMessage}
              </motion.div>
            )}

            <p className="text-sm text-gray-600 text-center">
              Chưa có tài khoản?{" "}
              <button
                type="button"
                onClick={() => router.push(Routes.REGISTER)}
                className="font-semibold text-[#e85a9b] hover:text-[#af4e80]"
              >
                Đăng ký
              </button>
            </p>

            {/* LOGIN BUTTON */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleCredentialsLogin}
              disabled={isLoading}
              className="
                w-full py-4 rounded-xl font-semibold 
                bg-linear-to-r from-[#e85a9b] to-[#079efb]
                text-white shadow-lg shadow-pink-500/30
                mt-2
                disabled:opacity-50
              "
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </motion.button>
          </motion.div>
        </div>
      </motion.div>

      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={() => setNotification((prev) => ({ ...prev, visible: false }))}
      />
    </div>
  );
}
