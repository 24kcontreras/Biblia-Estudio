import { NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-ink text-parchment" : "text-ink/70 hover:bg-ink/10"
  }`;

export function Layout() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-parchment px-3 py-2 sm:px-4">
        <span className="font-serif text-base font-semibold tracking-tight sm:text-lg">BibleChat</span>
        <nav className="flex gap-1.5 sm:gap-2">
          <NavLink to="/biblia" className={linkClass}>
            Biblia
          </NavLink>
          <NavLink to="/chat" className={linkClass}>
            Chat
          </NavLink>
          <NavLink to="/guardado" className={linkClass}>
            Guardado
          </NavLink>
        </nav>
      </header>
      <main className="min-h-0 flex-1">
        <Outlet />
      </main>
    </div>
  );
}
