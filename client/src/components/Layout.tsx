import { Link, NavLink, Outlet } from "react-router-dom";

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
    isActive ? "bg-ink text-parchment" : "text-ink/70 hover:bg-ink/10"
  }`;

export function Layout() {
  return (
    <div className="flex h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-ink/10 bg-parchment px-3 py-2 sm:px-4">
        <Link to="/biblia" className="font-serif text-base font-semibold tracking-tight sm:text-lg">
          BIBLIA ESTUDIO
        </Link>
        <nav className="flex gap-1.5 sm:gap-2">
          <NavLink to="/biblia" className={linkClass}>
            Biblia
          </NavLink>
          <NavLink to="/apocrifos" className={linkClass}>
            Apócrifos
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
