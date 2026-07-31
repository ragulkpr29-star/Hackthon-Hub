import { Navbar } from '@/components/layout/navbar';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
          {children}
        </div>
      </main>
      <footer className="border-t border-border/50 py-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Hackathon Hub — Kongu Engineering College Innovation Cell
            </p>
            <p className="text-xs text-muted-foreground">
              Build Better Teams. Build Bigger Ideas.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
