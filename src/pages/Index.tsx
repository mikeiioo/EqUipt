import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, BookOpen, FileText, Search, Library, FolderOpen } from "lucide-react";

const NAV_CARDS = [
  {
    to: "/algowatch",
    icon: BookOpen,
    title: "AlgoWatch",
    desc: "Learn how healthcare algorithms affect your care",
  },
  {
    to: "/kit/new",
    icon: FileText,
    title: "Generate Kit",
    desc: "Create a personalized advocacy kit with AI",
  },
  {
    to: "/search",
    icon: Search,
    title: "Search Practices",
    desc: "Find healthcare practices and see community patterns",
  },
  {
    to: "/library",
    icon: Library,
    title: "Community Library",
    desc: "Browse advocacy kits shared by the community",
  },
  {
    to: "/me/kits",
    icon: FolderOpen,
    title: "My Kits",
    desc: "View and manage your saved advocacy kits",
  },
];

export default function Index() {
  return (
    <div className="container py-12 md:py-20">
      {/* Hero */}
      <section className="text-center max-w-3xl mx-auto mb-16">
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-accent p-4">
            <Shield className="h-12 w-12 text-primary" />
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground mb-4">
          Advocate for Fair Healthcare
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          EqUIpt helps you understand how healthcare algorithms affect your care, generate professional advocacy kits, 
          and connect with a community working toward equitable treatment.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/algowatch">
            <Button size="lg">Learn More</Button>
          </Link>
          <Link to="/kit/new">
            <Button size="lg" variant="outline">Generate a Kit</Button>
          </Link>
        </div>
      </section>

      {/* Navigation cards */}
      <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-5xl mx-auto">
        {NAV_CARDS.map((card) => (
          <Link key={card.to} to={card.to} className="group">
            <Card className="h-full transition-shadow hover:shadow-md group-hover:border-primary/30">
              <CardHeader>
                <div className="rounded-lg bg-accent w-10 h-10 flex items-center justify-center mb-2">
                  <card.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{card.title}</CardTitle>
                <CardDescription>{card.desc}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </section>
    </div>
  );
}
