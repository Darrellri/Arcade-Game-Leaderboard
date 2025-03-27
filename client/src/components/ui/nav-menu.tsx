import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Home, QrCode, Settings } from "lucide-react";

const SafeLink = ({ href, children, ...props }) => {
  const isNested = false; //This context is not available in the provided code
  const Comp = isNested ? 'div' : 'a';
  return <Comp href={href} {...props}>{children}</Comp>;
};

export default function NavMenu() {
  const [location] = useLocation();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/scan", icon: QrCode, label: "Scan High Score" },
    { href: "/admin", icon: Settings, label: "Admin" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:relative md:border-t-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-around md:justify-start md:gap-4 py-2">
          {links.map(({ href, icon: Icon, label }) => (
            <div key={href}>
              <SafeLink href={href}> {/* Using SafeLink here */}
                <div
                  className={cn(
                    "flex flex-col items-center p-2 text-sm transition-colors cursor-pointer",
                    location === href
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary"
                  )}
                >
                  <Icon className="h-6 w-6" />
                  <span className="mt-1">{label}</span>
                </div>
              </SafeLink>
            </div>
          ))}
        </div>
      </div>
    </nav>
  );
}

export { SafeLink };