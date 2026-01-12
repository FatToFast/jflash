/**
 * J-Flash Home Page
 * Main navigation hub for all learning features.
 */

import Link from "next/link";
import { NAV_ITEMS, NAV_STYLE_CLASSES, APP_META } from "@/lib/constants";
import AuthButton from "@/components/AuthButton";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#f7f1e9] text-stone-900">
      {/* Auth Button - 우측 상단 */}
      <div className="absolute top-4 right-4">
        <AuthButton />
      </div>

      <main className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-14">
        <header className="space-y-4 text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-amber-700">
            {APP_META.name}
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            {APP_META.title}
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-stone-600 sm:text-lg">
            {APP_META.description}
          </p>
        </header>

        <nav className="mt-12 flex flex-wrap justify-center gap-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-xl px-6 py-3 font-semibold transition ${NAV_STYLE_CLASSES[item.style]}`}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </nav>

        <footer className="mt-16 text-sm text-stone-500">
          <p>v{APP_META.version} - OCR, SRS, 문법, 한자 학습 지원</p>
        </footer>
      </main>
    </div>
  );
}
