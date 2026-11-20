"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpenText, ImageIcon, LayoutGrid, School, ShieldUser, Swords } from "lucide-react";
import { Routes } from "@/lib/constants/routes";

const navigation = [
  {
    href: Routes.HOME,
    label: "Tổng quan",
    icon: LayoutGrid,
  },
  {
    href: Routes.MANAGE_USER,
    label: "Quản lý user",
    icon: ShieldUser,
  },
  {
    href: Routes.MANAGE_CLASS,
    label: "Lớp học & bài tập",
    icon: School,
  },
  {
    href: Routes.MANAGE_GAME_UNITS,
    label: "Quản lý game units",
    icon: Swords,
  },
  {
    href: Routes.MANAGE_VOCABULARY,
    label: "Quản lý vocabulary",
    icon: BookOpenText,
  },
  {
    href: Routes.MANAGE_VOCAB_IMAGES,
    label: "Duyệt ảnh từ vựng",
    icon: ImageIcon,
  },
];

export function ManagementSidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-r border-slate-200 bg-linear-to-b from-[#ffc3df] to-[#ffb7c5] px-4 py-5 text-[#af4e80] shadow-[16px_0_40px_rgba(255,183,197,0.35)] md:flex md:flex-col">
      <div className="rounded-[24px] border border-pink-200/50 bg-white/50 px-4 py-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.34em] text-[#af4e80]/80">Nora</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Management</h1>
        <p className="mt-2 text-sm leading-6 text-[#af4e80]/80">
          Quản trị nội dung và người dùng của hệ thống.
        </p>
      </div>

      <nav className="mt-6 space-y-2">
        {navigation.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                active
                  ? "bg-white text-slate-950 shadow-lg"
                  : "text-[#af4e80]/80 hover:bg-white/60 hover:text-[#af4e80]"
              }`}
            >
              <span
                className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                  active ? "bg-slate-100 text-[#e85a9b]" : "bg-white/50 text-[#af4e80]"
                }`}
              >
                <Icon className="h-5 w-5" />
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-[24px] border border-white/10 bg-gradient-to-br from-[#0E4BA9] to-[#00A6FB] p-4 text-white shadow-xl">
        <p className="text-sm font-semibold">Mẹo nhanh</p>
        <p className="mt-2 text-sm leading-6 text-blue-50">
          Dùng sidebar này để chuyển giữa user và game units, tránh phải quay lại dashboard.
        </p>
      </div>
    </aside>
  );
}