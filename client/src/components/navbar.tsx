import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useScroll } from "@/hooks/use-scroll";
import { useLocation } from "wouter";

export default function Navbar() {
  const { user, logoutMutation } = useAuth();
  const { scrollToSection } = useScroll();
  const [location] = useLocation();

  // Fetch design configurations
  const { data: designConfigs } = useQuery({
    queryKey: ['/api/design-config'],
  });

  // Helper function to get config value
  const getConfigValue = (key: string, defaultValue: string) => {
    const config = designConfigs?.find(c => c.key === key);
    return config?.value || defaultValue;
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, sectionId: string) => {
    e.preventDefault();
    if (location !== '/') {
      window.location.href = `/#${sectionId}`;
    } else {
      scrollToSection(sectionId);
    }
  };

  return (
    <nav className="border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-2 text-xl font-bold">
              {getConfigValue('nav_logo_text', 'Tattoo Studio')}
            </Link>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a
                href="/#home"
                onClick={(e) => handleNavClick(e, 'home')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_home_text', 'Home')}
              </a>
              <a
                href="/#about"
                onClick={(e) => handleNavClick(e, 'about')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_about_text', 'About')}
              </a>
              <a
                href="/#gallery"
                onClick={(e) => handleNavClick(e, 'gallery')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_gallery_text', 'Gallery')}
              </a>
              <a
                href="/#booking"
                onClick={(e) => handleNavClick(e, 'booking')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_booking_text', 'Book Now')}
              </a>
              <a
                href="/#contact"
                onClick={(e) => handleNavClick(e, 'contact')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_contact_text', 'Contact')}
              </a>
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  {getConfigValue('nav_admin_text', 'Admin Dashboard')}
                </Link>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled className="text-muted-foreground">
                    Signed in as {user.username}
                    {user.isAdmin && " (Admin)"}
                  </DropdownMenuItem>
                  {user.isAdmin && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">{getConfigValue('nav_admin_text', 'Admin Dashboard')}</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => logoutMutation.mutate()}
                    disabled={logoutMutation.isPending}
                    className="text-red-600 focus:text-red-600"
                  >
                    {getConfigValue('nav_logout_text', 'Logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link href="/auth">
                <Button variant="default">{getConfigValue('nav_login_text', 'Login')}</Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}