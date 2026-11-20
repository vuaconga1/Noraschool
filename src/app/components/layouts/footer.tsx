"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ChevronDown,
  Clock,
  Facebook,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import {
  BRAND,
  NORA_CAMPUSES,
  NORA_FOOTER_LINKS,
  NORA_SHELL,
  type NoraFooterLink,
} from "@/lib/brand";
import { trackOutboundToMainSite } from "@/lib/gtag";

function formatPhoneDisplay(phone: string) {
  if (phone.length === 10) {
    return `${phone.slice(0, 4)} ${phone.slice(4, 7)} ${phone.slice(7)}`;
  }
  return phone;
}

function FooterNavItem({ item }: { item: NoraFooterLink }) {
  const [open, setOpen] = useState(false);
  const hasChildren = Boolean(item.children?.length);

  if (!hasChildren) {
    return (
      <li>
        <a
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackOutboundToMainSite(item.href)}
          className="block py-1.5 text-sm font-medium transition hover:opacity-80"
          style={{ color: NORA_SHELL.text }}
        >
          {item.label}
        </a>
      </li>
    );
  }

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-2 py-1.5 text-left text-sm font-medium transition hover:opacity-80"
        style={{ color: NORA_SHELL.text }}
        aria-expanded={open}
      >
        <span>{item.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <ul
          className="mb-1 ml-2 space-y-1 border-l pl-3"
          style={{ borderColor: `${NORA_SHELL.accentSoft}99` }}
        >
          {item.children!.map((child) => (
            <li key={child.href}>
              <a
                href={child.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackOutboundToMainSite(child.href)}
                className="block py-1 text-xs font-medium transition hover:opacity-80"
                style={{ color: NORA_SHELL.text }}
              >
                {child.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function Footer() {
  return (
    <footer
      className="relative overflow-hidden border-t"
      style={{
        backgroundColor: NORA_SHELL.sidebarBg,
        borderColor: `${NORA_SHELL.accentSoft}66`,
        color: NORA_SHELL.text,
      }}
    >
      <div
        className="pointer-events-none absolute -left-10 -top-16 h-56 w-56 rounded-full blur-2xl"
        style={{ backgroundColor: `${NORA_SHELL.blossom}33` }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-20 right-10 h-64 w-64 rounded-full blur-3xl"
        style={{ backgroundColor: `${NORA_SHELL.secondary}18` }}
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-4 lg:gap-6 lg:px-8 lg:py-10">
        {/* Brand */}
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <a
            href={BRAND.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => trackOutboundToMainSite(BRAND.websiteUrl)}
            className="mb-3 flex items-center gap-3"
          >
            <Image
              src={BRAND.logoPath}
              alt={`${BRAND.fullName} Logo`}
              width={72}
              height={72}
              className="h-[72px] w-[72px] rounded-2xl bg-white object-contain p-1.5 shadow-sm"
            />
            <h2
              className="text-lg font-extrabold tracking-tight sm:text-xl"
              style={{ color: NORA_SHELL.textStrong }}
            >
              {BRAND.fullName}
            </h2>
          </a>
          <p className="text-sm font-semibold leading-relaxed">
            <span style={{ color: NORA_SHELL.accent }}>{BRAND.tagline}</span>
            <br />
            <span style={{ color: NORA_SHELL.secondary }}>{BRAND.taglineAccent}</span>
          </p>
          <p
            className="mt-6 text-[11px] font-medium opacity-75"
            style={{ color: NORA_SHELL.text }}
          >
            Copyright © {new Date().getFullYear()} All Rights Reserved
          </p>
        </div>

        {/* Campuses */}
        {NORA_CAMPUSES.map((campus) => (
          <div key={campus.id} className="min-w-0">
            <h3
              className="mb-3 text-sm font-extrabold tracking-wide"
              style={{ color: NORA_SHELL.accent }}
            >
              {campus.heading}
            </h3>
            <ul className="space-y-2.5 text-sm" style={{ color: NORA_SHELL.text }}>
              <li className="flex items-start gap-2.5">
                <Clock
                  className="mt-0.5 h-4 w-4 shrink-0"
                  style={{ color: NORA_SHELL.accent }}
                />
                <span>{BRAND.hours}</span>
              </li>
              <li>
                <a
                  href={`mailto:${campus.email}`}
                  className="flex items-start gap-2.5 transition hover:opacity-80"
                >
                  <Mail
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: NORA_SHELL.accent }}
                  />
                  <span className="break-all">{campus.email}</span>
                </a>
              </li>
              {campus.phones.map((phone) => (
                <li key={phone.number}>
                  <a
                    href={`tel:${phone.number}`}
                    className="flex items-start gap-2.5 transition hover:opacity-80"
                  >
                    {phone.kind === "chat" ? (
                      <MessageCircle
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: NORA_SHELL.accent }}
                      />
                    ) : (
                      <Phone
                        className="mt-0.5 h-4 w-4 shrink-0"
                        style={{ color: NORA_SHELL.accent }}
                      />
                    )}
                    <span>{formatPhoneDisplay(phone.number)}</span>
                  </a>
                </li>
              ))}
              <li>
                <a
                  href={campus.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOutboundToMainSite(campus.mapsUrl)}
                  className="flex items-start gap-2.5 transition hover:opacity-80"
                >
                  <MapPin
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: NORA_SHELL.accent }}
                  />
                  <span>{campus.address}</span>
                </a>
              </li>
              <li>
                <a
                  href={campus.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackOutboundToMainSite(campus.facebookUrl)}
                  className="flex items-start gap-2.5 transition hover:opacity-80"
                >
                  <Facebook
                    className="mt-0.5 h-4 w-4 shrink-0"
                    style={{ color: NORA_SHELL.accent }}
                  />
                  <span>{campus.facebookLabel}</span>
                </a>
              </li>
            </ul>
          </div>
        ))}

        {/* Site menu */}
        <nav aria-label="Menu Nora" className="min-w-0">
          <ul className="space-y-0.5">
            {NORA_FOOTER_LINKS.map((item) => (
              <FooterNavItem key={item.label} item={item} />
            ))}
          </ul>
        </nav>
      </div>
    </footer>
  );
}
