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

function readApiMessage(data: { message?: string | string[] }) {
  if (Array.isArray(data.message)) return data.message[0] || "";
  return data.message || "";
}

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

  const handleRegister = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      showNotification("Vui lòng nhập email", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      showNotification("Email không hợp lệ", "error");
      return;
    }
    if (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      showNotification("Mật khẩu tối thiểu 8 ký tự, có chữ và số", "error");
      return;
    }
    if (password !== confirmPassword) {
      showNotification("Mật khẩu nhập lại không khớp", "error");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        showNotification(readApiMessage(data) || "Đăng ký thất bại", "error");
        return;
      }

      if (data.user) setUser(data.user);
      showNotification(readApiMessage(data) || "Đăng ký thành công", "success");
      router.push(Routes.HOME);
    } catch {
      showNotification("Có lỗi xảy ra, vui lòng thử lại", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleRegister();
    }
  };

  return (
    <div className="fixed inset-0 flex h-screen w-screen overflow-hidden font-[Lexend] z-9999 text-black">
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[60%] relative bg-linear-to-br from-[#ffc3df] via-[#ffd6ea] to-[#b8e6ff] items-center justify-center overflow-hidden"
      >
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-125 h-125 bg-cyan-400/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

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
              Tạo tài khoản mới
            </h1>

            <p className="text-xl text-white/90 mb-8 leading-relaxed">
              Đăng ký để bắt đầu hành trình học tập cùng NORA Preschool
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

      <motion.div
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full lg:w-[40%] bg-white flex items-center justify-center p-6 sm:p-8 lg:p-16 overflow-y-auto relative"
      >
        <div className="absolute inset-0 lg:hidden pointer-events-none">
          <div className="absolute -top-10 -right-20 w-72 h-72 rounded-full bg-pink-200/50 blur-3xl" />
          <div className="absolute -bottom-15 -left-20 w-72 h-72 rounded-full bg-sky-200/50 blur-3xl" />
        </div>

        <div className="w-full max-w-md relative z-10 bg-white/80 backdrop-blur-xl rounded-[28px] shadow-xl px-6 py-10 sm:px-8 border border-white/50">
          <button
            onClick={() => router.push(Routes.HOME)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-[#e85a9b] transition mb-6"
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
              Đăng ký
            </h2>
            <p className="text-sm lg:text-base text-gray-600">
              Tạo tài khoản bằng email và mật khẩu
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onKeyDown={handleKeyPress}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@nora.com.vn"
                autoComplete="email"
                className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#e85a9b] focus:ring-4 focus:ring-pink-100 transition outline-none shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onKeyDown={handleKeyPress}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ít nhất 6 ký tự"
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#e85a9b] focus:ring-4 focus:ring-pink-100 transition outline-none shadow-sm"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nhập lại mật khẩu
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onKeyDown={handleKeyPress}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className="w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl focus:border-[#e85a9b] focus:ring-4 focus:ring-pink-100 transition outline-none shadow-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5 text-gray-500" />
                  ) : (
                    <Eye className="w-5 h-5 text-gray-500" />
                  )}
                </button>
              </div>
            </div>

            <p className="text-sm text-gray-600 text-center">
              Đã có tài khoản?{" "}
              <button
                type="button"
                onClick={() => router.push(Routes.LOGIN)}
                className="font-semibold text-[#e85a9b] hover:text-[#af4e80]"
              >
                Đăng nhập
              </button>
            </p>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void handleRegister()}
              disabled={isLoading}
              className="w-full py-4 rounded-xl font-semibold bg-linear-to-r from-[#e85a9b] to-[#079efb] text-white shadow-lg shadow-pink-500/30 disabled:opacity-50"
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
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
