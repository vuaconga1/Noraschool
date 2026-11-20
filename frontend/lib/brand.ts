/** Nora brand constants for user-facing UI (shell, contact, outbound links). */

export const BRAND = {
  name: "Nora",
  fullName: "NORA Preschool",
  tagline: "CÙNG CON KHÁM PHÁ,",
  taglineAccent: "KẾT NỐI VÀ TRƯỞNG THÀNH",
  websiteUrl: "https://nora.com.vn",
  websiteHost: "nora.com.vn",
  emailOffice: "office@nora.com.vn",
  emailBienHoa: "bienhoa@nora.com.vn",
  logoPath: "/assets/logo.png",
  hours: "Thứ hai - Thứ bảy: 07h00 - 17h30",
} as const;

export const NORA_CAMPUSES = [
  {
    id: "danang",
    heading: "CAMPUS ĐÀ NẴNG",
    name: "NORA Preschool Đà Nẵng",
    address: "222 Nguyễn Đình Thi, Hòa Xuân, Đà Nẵng",
    phones: [{ number: "0905998546", kind: "phone" as const }],
    email: BRAND.emailOffice,
    mapsUrl: "https://maps.app.goo.gl/43EwoqqjLEVEsHac9",
    facebookUrl: "https://www.facebook.com/norapreschool",
    facebookLabel: "NORA Preschool Đà Nẵng",
  },
  {
    id: "bienhoa",
    heading: "CAMPUS BIÊN HOÀ",
    name: "NORA Preschool Biên Hoà",
    address: "58 Lý Văn Sâm, Tam Hiệp, Đồng Nai",
    phones: [
      { number: "0822949313", kind: "phone" as const },
      { number: "0981842644", kind: "chat" as const },
    ],
    email: BRAND.emailBienHoa,
    mapsUrl: "https://maps.app.goo.gl/NyDfYZkGZjNS1DRVA",
    facebookUrl: "https://www.facebook.com/norabienhoa",
    facebookLabel: "Fanpage: NORA Preschool Biên Hoà",
  },
] as const;

export type NoraFooterLink = {
  label: string;
  href: string;
  children?: readonly { label: string; href: string }[];
};

/** Footer / outbound menu — mirrors nora.com.vn */
export const NORA_FOOTER_LINKS: readonly NoraFooterLink[] = [
  { label: "Trang Chủ", href: "https://nora.com.vn/" },
  { label: "Giới Thiệu", href: "https://nora.com.vn/gioi-thieu/" },
  {
    label: "Chương trình học",
    href: "#",
    children: [
      {
        label: "Một ngày của trẻ tại NORA Preschool",
        href: "https://nora.com.vn/mot-ngay-cua-tre-tai-nora-preschool/",
      },
      {
        label: "Chương trình học 0-3 tuổi",
        href: "https://nora.com.vn/chuong-trinh-hoc-0-3-tuoi/",
      },
      {
        label: "Chương trình học 3-6 tuổi",
        href: "https://nora.com.vn/chuong-trinh-hoc-3-6-tuoi/",
      },
      {
        label: "Chương trình Tiếng Anh & Ngoại Khoá",
        href: "https://nora.com.vn/chuong-trinh-tieng-anh-va-ngoai-khoa/",
      },
    ],
  },
  {
    label: "Hệ thống trường",
    href: "#",
    children: [
      {
        label: "NORA Preschool Đà Nẵng",
        href: "https://nora.com.vn/nora-preschool-da-nang/",
      },
      {
        label: "NORA Preschool Biên Hoà",
        href: "https://nora.com.vn/nora-preschool-bien-hoa/",
      },
    ],
  },
  { label: "Tuyển Sinh", href: "https://nora.com.vn/tuyen-sinh/" },
  {
    label: "Góc chia sẻ",
    href: "#",
    children: [
      {
        label: "Tin Tức – Sự kiện",
        href: "https://nora.com.vn/category/tin-tuc/",
      },
      {
        label: "Kiến Thức hỗ trợ trẻ",
        href: "https://nora.com.vn/category/kien-thuc-ho-tro-tre/",
      },
      { label: "FAQ", href: "https://nora.com.vn/faq/" },
    ],
  },
  { label: "Liên Hệ", href: "https://nora.com.vn/lien-he/" },
] as const;

/** Nora shell — footer magenta (Chủ đề học bar) + soft sakura sidebar. */
export const NORA_SHELL = {
  /** Footer soft magenta — lighter to harmonize with sakura sidebar */
  softBg: "#f472b6",
  footerFrom: "#f9a8d4",
  footerVia: "#f472b6",
  footerTo: "#ec4899",
  /** Soft sakura page / sidebar */
  pageBg: "#fff5fb",
  sidebarBg: "#fff5fb",
  /** Text on soft pink */
  text: "#af4e80",
  textStrong: "#9d3f6f",
  /** Active / CTA */
  accent: "#e33887",
  accentSoft: "#ffb7c5",
  secondary: "#079efb",
  navFrom: "#ec4899",
  navVia: "#e33887",
  navTo: "#db2777",
  accentFrom: "#e33887",
  accentTo: "#079efb",
  blossom: "#ffb7c5",
  soft: "#fff5fb",
} as const;
