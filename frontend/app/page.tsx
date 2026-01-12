/**
 * J-Flash Home Page
 * Main navigation hub for all learning features.
 */

import Link from "next/link";
import { NAV_ITEMS, NAV_STYLE_CLASSES, APP_META } from "@/lib/constants";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  // 메인 버튼 (복습하기, 문장)과 나머지 버튼 분리
  const mainButtons = NAV_ITEMS.filter(
    (item) => item.href === "/review" || item.href === "/review?mode=sentence"
  );
  const subButtons = NAV_ITEMS.filter(
    (item) => item.href !== "/review" && item.href !== "/review?mode=sentence"
  );

  return (
    <div className="min-h-screen bg-[#f7f1e9] text-stone-900">
      {/* Auth Button - 우측 상단 */}
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>

      <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 py-14">
        <header className="space-y-3 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-700">
            {APP_META.name}
          </p>
          <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
            {APP_META.title}
          </h1>
          <p className="text-sm leading-relaxed text-stone-500 sm:text-base">
            {APP_META.description}
          </p>
        </header>

        {/* 메인 버튼 영역 - 복습하기 & 문장 */}
        <nav className="mt-10 w-full space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {mainButtons.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-4 text-lg font-semibold transition ${NAV_STYLE_CLASSES[item.style]}`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          {/* 서브 버튼 영역 - 단어장, 문법, 통계, 데이터 */}
          <div className="grid grid-cols-4 gap-2">
            {subButtons.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-3 text-sm font-medium transition ${NAV_STYLE_CLASSES[item.style]}`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        <footer className="mt-12 text-xs text-stone-400">
          <p>v{APP_META.version}</p>
        </footer>
      </main>
    </div>
  );
}
