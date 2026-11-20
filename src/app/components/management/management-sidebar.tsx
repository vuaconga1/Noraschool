"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import {
  BookOpenText,
  ChevronDown,
  FolderOpen,
  ImageIcon,
  LayoutGrid,
  List,
  School,
  ShieldUser,
  Swords,
  Users,
} from "lucide-react";
import { Routes } from "@/lib/constants/routes";
import { PERMISSIONS } from "@/lib/constants/permission";
import { useAuthStore } from "@/stores/auth.store";

type NavLeaf = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  role?: string;
};

type NavGroup = {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  children: NavLeaf[];
};

const TOP_LINKS: NavLeaf[] = [
  { href: Routes.HOME, label: "Tổng quan", icon: LayoutGrid },
  {
    href: Routes.MANAGE_USER,
    label: "Quản lý user",
    icon: ShieldUser,
    role: "TEACHER",
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
  {
    href: Routes.MANAGE_STUDENT,
    label: "Học sinh",
    icon: Users,
    permission: PERMISSIONS.STUDENT_VIEW,
  },
];

const CLASS_GROUP: NavGroup = {
  id: "class",
  label: "Lớp học & bài tập",
  icon: School,
  children: [
    {
      href: Routes.MANAGE_CLASS,
      label: "Danh sách lớp",
      icon: List,
      permission: PERMISSIONS.CLASS_VIEW_LIST,
    },
    {
      href: Routes.MANAGE_CLASS_CATEGORY,
      label: "Phân loại",
      icon: FolderOpen,
      permission: PERMISSIONS.CLASS_CATEGORY_VIEW,
    },
  ],
};

function isPathActive(pathname: string, href: string) {
  if (href === Routes.HOME) return pathname === "/";
  if (href === Routes.MANAGE_CLASS) {
    return (
      pathname === Routes.MANAGE_CLASS ||
      (pathname.startsWith(`${Routes.MANAGE_CLASS}/`) &&
        !pathname.startsWith(Routes.MANAGE_CLASS_CATEGORY))
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ManagementSidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const hasRole = useAuthStore((s) => s.hasRole);
  const user = useAuthStore((s) => s.user);
  const isAdmin = !!user?.roles?.some(
    (r) => r.name === "ADMIN" && r.isDisabled !== true,
  );

  const canSee = (item: NavLeaf) => {
    if (item.permission && !hasPermission(item.permission) && !isAdmin) {
      return false;
    }
    if (item.role && !hasRole(item.role) && !isAdmin) return false;
    return true;
  };

  const classChildren = CLASS_GROUP.children.filter(canSee);
  const topLinks = TOP_LINKS.filter(canSee);

  const classActive = classChildren.some((c) => isPathActive(pathname, c.href));

  const [classOpen, setClassOpen] = useState(true);

  const openClass = classActive || classOpen;

  const tip = useMemo(
    () =>
      "Một sidebar hồng duy nhất — chuyển nhanh giữa lớp, user và vocabulary.",
    [],
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-[290px] shrink-0 border-r border-pink-200/70 bg-linear-to-b from-[#fff5fb] via-[#ffc3df] to-[#ffb7c5] px-4 py-5 text-[#af4e80] shadow-[16px_0_40px_rgba(255,183,197,0.35)] md:flex md:flex-col">
      <div className="rounded-[24px] border border-pink-200/50 bg-white/60 px-4 py-4 backdrop-blur">
        <p className="text-xs uppercase tracking-[0.34em] text-[#af4e80]/80">
          Nora
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#9d3f6f]">
          Management
        </h1>
        <p className="mt-2 text-sm leading-6 text-[#af4e80]/80">
          Quản trị nội dung và người dùng của hệ thống.
        </p>
      </div>

      <nav className="mt-6 flex-1 space-y-1.5 overflow-y-auto pr-1">
        {topLinks.slice(0, 1).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isPathActive(pathname, item.href)}
          />
        ))}

        {classChildren.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setClassOpen((v) => !v)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium transition ${
                classActive
                  ? "bg-white text-slate-950 shadow-lg"
                  : "text-[#af4e80]/80 hover:bg-white/60 hover:text-[#af4e80]"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                    classActive
                      ? "bg-slate-100 text-[#e85a9b]"
                      : "bg-white/50 text-[#af4e80]"
                  }`}
                >
                  <School className="h-5 w-5" />
                </span>
                <span>{CLASS_GROUP.label}</span>
              </span>
              <ChevronDown
                className={`h-4 w-4 transition ${openClass ? "" : "-rotate-90"}`}
              />
            </button>
            {openClass && (
              <ul className="ml-4 mt-1 space-y-1 border-l-2 border-pink-200/80 pl-3">
                {classChildren.map((child) => (
                  <li key={child.href}>
                    <NavItem
                      item={child}
                      active={isPathActive(pathname, child.href)}
                      compact
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {topLinks.slice(1).map((item) => (
          <NavItem
            key={item.href}
            item={item}
            active={isPathActive(pathname, item.href)}
          />
        ))}
      </nav>

      <div className="mt-4 rounded-[24px] border border-pink-200/60 bg-white/55 p-4 text-[#af4e80] shadow-md backdrop-blur">
        <p className="text-sm font-semibold text-[#9d3f6f]">Mẹo nhanh</p>
        <p className="mt-2 text-sm leading-6 text-[#af4e80]/85">{tip}</p>
      </div>
    </aside>
  );
}

function NavItem({
  item,
  active,
  compact = false,
}: {
  item: NavLeaf;
  active: boolean;
  compact?: boolean;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-2xl text-sm font-medium transition ${
        compact ? "px-3 py-2.5" : "px-4 py-3"
      } ${
        active
          ? "bg-white text-slate-950 shadow-lg"
          : "text-[#af4e80]/80 hover:bg-white/60 hover:text-[#af4e80]"
      }`}
    >
      <span
        className={`flex items-center justify-center rounded-xl ${
          compact ? "h-8 w-8" : "h-10 w-10"
        } ${
          active
            ? "bg-slate-100 text-[#e85a9b]"
            : "bg-white/50 text-[#af4e80]"
        }`}
      >
        <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
      </span>
      <span>{item.label}</span>
    </Link>
  );
}
