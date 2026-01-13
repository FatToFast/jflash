"use client";

/**
 * J-Flash Home Page
 * Minimal Japanese aesthetic - clean, spacious, functional
 */

import Link from "next/link";
import { FEATURES } from "@/lib/config";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-white relative">
      {/* Sync Button - 우측 상단 */}
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>

      <main className="mx-auto max-w-sm px-6 py-20">
        {/* Header */}
        <header className="mb-16">
          <p className="text-[10px] tracking-[0.3em] text-neutral-500">
            J-FLASH
          </p>
          <h1 className="mt-1 text-xl text-neutral-900">日本語</h1>
        </header>

        {/* Navigation */}
        <nav className="space-y-px border-t border-neutral-200">
          <Link
            href="/review"
            className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <span className="text-sm">단어 복습</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>

          <Link
            href="/review?mode=sentence"
            className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <span className="text-sm">문장 복습</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>

          <Link
            href="/vocab"
            className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <span className="text-sm">단어장</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>

          <Link
            href="/grammar"
            className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <span className="text-sm">문법</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>

          <Link
            href="/stats"
            className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
          >
            <span className="text-sm">통계</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>

          {FEATURES.upload && (
            <Link
              href="/data"
              className="flex items-center justify-between border-b border-neutral-100 py-4 text-neutral-900 transition-colors hover:bg-neutral-50"
            >
              <span className="text-sm">데이터</span>
              <span className="text-xs text-neutral-500">→</span>
            </Link>
          )}
        </nav>

        {/* Footer */}
        <footer className="mt-20 text-[10px] text-neutral-400">
          v1.3.0
        </footer>
      </main>
    </div>
  );
}
