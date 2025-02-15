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

export default function Navbar() {
  const { user, logoutMutation } = useAuth();

  // Fetch design configurations
  const { data: designConfigs } = useQuery({
    queryKey: ['/api/design-config'],
  });

  // Helper function to get config value
  const getConfigValue = (key: string, defaultValue: string) => {
    const config = designConfigs?.find(c => c.key === key);
    return config?.value || defaultValue;
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
              <Link
                href="/#home"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_home_text', 'Home')}
              </Link>
              <Link
                href="/#about"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_about_text', 'About')}
              </Link>
              <Link
                href="/#gallery"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_gallery_text', 'Gallery')}
              </Link>
              <Link
                href="/#booking"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_booking_text', 'Book Now')}
              </Link>
              <Link
                href="/#contact"
                className="inline-flex items-center px-1 pt-1 text-sm font-medium hover:text-primary transition-colors"
              >
                {getConfigValue('nav_contact_text', 'Contact')}
              </Link>
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