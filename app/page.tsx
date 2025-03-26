import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">ULC</h1>
          <div className="space-x-2">
            <Button variant="secondary" asChild>
              <Link href="/login">Login</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Register</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto py-12 px-6">
        <section className="max-w-4xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            Welcome to our Platform
          </h2>
          <p className="text-xl text-muted-foreground">
            A modern, role-based web application built with Next.js 15, MongoDB,
            and NextAuth.
          </p>

          <div className="flex justify-center gap-4 mt-8">
            <Button size="lg" asChild>
              <Link href="/login">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/about">Learn More</Link>
            </Button>
          </div>
        </section>

        <section className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-3">Admin Dashboard</h3>
            <p className="text-muted-foreground">
              Manage sub-admins, create jurisdictions, and oversee the entire
              platform.
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-3">Sub-Admin Portal</h3>
            <p className="text-muted-foreground">
              Manage assigned jurisdictions and handle day-to-day operations.
            </p>
          </div>

          <div className="bg-card text-card-foreground rounded-lg p-6 shadow-sm">
            <h3 className="text-xl font-bold mb-3">Consumer Experience</h3>
            <p className="text-muted-foreground">
              Access personalized content and services based on your location.
            </p>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-6 px-6">
        <div className="container mx-auto text-center text-muted-foreground mx-auto">
          <p>© 2025 Role-Based Web App. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
