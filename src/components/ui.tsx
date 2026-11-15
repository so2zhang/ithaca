// Small shared pieces: phone frame, avatar, buttons, the Bee orb.
import type { User } from "@/lib/types";

export function PhoneFrame({ children, onReset }: { children: React.ReactNode; onReset: () => void }) {
  return (
    <div className="flex min-h-dvh items-center justify-center sm:py-8">
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-cream sm:h-[844px] sm:max-h-[calc(100dvh-4rem)] sm:w-[390px] sm:rounded-[44px] sm:border-[10px] sm:border-ink sm:shadow-2xl">
        <header className="flex items-center justify-between px-5 pt-4 pb-2">
          <span className="flex items-center gap-2 text-sm font-bold tracking-tight">
            <span aria-hidden className="h-5 w-5 rounded-full bg-honey ring-2 ring-ink" />
            Bee Loop
          </span>
          <button onClick={onReset} className="rounded-full border border-ink/15 px-3 py-1 text-xs font-medium text-muted hover:bg-ink/5">
            Reset demo
          </button>
        </header>
        <main className="flex min-h-0 flex-1 flex-col">{children}</main>
        <footer className="px-5 py-2 text-center text-[10px] text-muted">Concept prototype by Sophia Zhang, not affiliated with Bumble.</footer>
      </div>
    </div>
  );
}

const AVATAR_COLORS = ["bg-honey", "bg-[#f6a57c]", "bg-[#9fd3c7]", "bg-[#c3b1e1]", "bg-[#f7d6a0]", "bg-[#a8c5f0]"];

export function Avatar({ user, size = 40 }: { user: User; size?: number }) {
  const color = AVATAR_COLORS[[...user.id].reduce((n, ch) => n + ch.charCodeAt(0), 0) % AVATAR_COLORS.length];
  return (
    <span
      className={`${color} inline-flex shrink-0 items-center justify-center rounded-full font-bold text-ink`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden
    >
      {user.name[0]}
    </span>
  );
}

export function PrimaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-full bg-ink px-5 py-3.5 text-[15px] font-semibold text-honey transition active:scale-[0.98] disabled:opacity-40 ${props.className ?? ""}`}
    />
  );
}

export function SecondaryButton(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`w-full rounded-full border border-ink/20 px-5 py-3 text-sm font-medium text-ink transition hover:bg-ink/5 ${props.className ?? ""}`}
    />
  );
}

// The Bee orb. `level` (0–1) is the current audio volume; it makes the orb swell while Bee talks.
export function Orb({ level, speaking, size = 168 }: { level: number; speaking: boolean; size?: number }) {
  return (
    <div className="relative flex items-center justify-center" style={{ width: size * 1.4, height: size * 1.4 }}>
      <div
        className="absolute rounded-full bg-honey/30 transition-transform duration-100"
        style={{ width: size, height: size, transform: `scale(${1.1 + level * 0.5})` }}
      />
      <div
        className={`relative rounded-full shadow-[0_10px_40px_rgba(255,198,41,0.6)] transition-transform duration-100 ${speaking ? "" : "orb-idle"}`}
        style={{
          width: size,
          height: size,
          transform: speaking ? `scale(${1 + level * 0.18})` : undefined,
          background: "radial-gradient(circle at 35% 30%, #fff6cc 0%, #ffd65c 35%, #ffc629 60%, #e8a800 100%)",
        }}
      />
    </div>
  );
}
