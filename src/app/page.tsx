import Link from 'next/link';

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] min-h-screen">
      <main className="flex flex-col gap-16 items-center p-8 pb-20 sm:p-20 font-[family-name:var(--font-geist-sans)]">
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6 max-w-3xl">
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Welcome to Issue Portal
          </h1>
          <p className="text-xl text-muted-foreground">
            Your centralized platform for managing and tracking issues efficiently.
          </p>
          <div className="flex gap-4 mt-4">
            <Link 
              href="/dashboard" 
              className="px-6 py-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
            <Link 
              href="/issues" 
              className="px-6 py-3 rounded-lg border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              View Issues
            </Link>
          </div>
        </section>

        {/* Features Section */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-2">Issue Tracking</h3>
            <p className="text-muted-foreground">
              Create, track, and manage issues with detailed information and status updates.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-2">Team Collaboration</h3>
            <p className="text-muted-foreground">
              Work together seamlessly with team members through comments and assignments.
            </p>
          </div>
          <div className="p-6 rounded-lg border bg-card">
            <h3 className="text-xl font-semibold mb-2">Analytics & Reports</h3>
            <p className="text-muted-foreground">
              Get insights into issue resolution times and team performance metrics.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h4 className="font-semibold mb-4">Issue Portal</h4>
              <p className="text-sm text-muted-foreground">
                Streamline your issue management process with our comprehensive platform.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/dashboard" className="text-muted-foreground hover:text-foreground">Dashboard</Link></li>
                <li><Link href="/issues" className="text-muted-foreground hover:text-foreground">Issues</Link></li>
                <li><Link href="/reports" className="text-muted-foreground hover:text-foreground">Reports</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/docs" className="text-muted-foreground hover:text-foreground">Documentation</Link></li>
                <li><Link href="/api" className="text-muted-foreground hover:text-foreground">API Reference</Link></li>
                <li><Link href="/support" className="text-muted-foreground hover:text-foreground">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-foreground">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-foreground">Terms of Service</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact Us</Link></li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} Issue Portal. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
