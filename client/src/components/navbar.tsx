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

  // Get nav styling values
  const navBgColor = getConfigValue('nav_background_color', '#1f2937');
  const navTextColor = getConfigValue('nav_text_color', '#ffffff');
  const navHoverColor = getConfigValue('nav_hover_color', '#d1d5db');
  const navActiveColor = getConfigValue('nav_active_color', '#60a5fa');
  const navPadding = getConfigValue('nav_padding', '1rem');
  const navPosition = getConfigValue('nav_position', 'fixed');
  const navLinksGap = getConfigValue('nav_links_gap', '2rem');

  const navStyle = {
    backgroundColor: navBgColor,
    padding: navPadding,
    position: navPosition === 'fixed' ? 'fixed' : 'relative',
    width: '100%',
    zIndex: 50,
  } as React.CSSProperties;

  const linkStyle = {
    color: navTextColor,
    transition: 'color 0.2s',
  };

  const activeLinkStyle = {
    ...linkStyle,
    color: navActiveColor,
  };

  return (
    <nav style={navStyle}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link href="/" className="flex items-center px-2 text-xl font-bold" style={linkStyle}>
              {getConfigValue('nav_logo_text', 'Tattoo Studio')}
            </Link>
            <div className="hidden sm:ml-6 sm:flex" style={{ gap: navLinksGap }}>
              <a
                href="/#home"
                onClick={(e) => handleNavClick(e, 'home')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                style={linkStyle}
                onMouseOver={(e) => (e.currentTarget.style.color = navHoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.color = navTextColor)}
              >
                {getConfigValue('nav_home_text', 'Home')}
              </a>
              <a
                href="/#about"
                onClick={(e) => handleNavClick(e, 'about')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                style={linkStyle}
                onMouseOver={(e) => (e.currentTarget.style.color = navHoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.color = navTextColor)}
              >
                {getConfigValue('nav_about_text', 'About')}
              </a>
              <a
                href="/#gallery"
                onClick={(e) => handleNavClick(e, 'gallery')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                style={linkStyle}
                onMouseOver={(e) => (e.currentTarget.style.color = navHoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.color = navTextColor)}
              >
                {getConfigValue('nav_gallery_text', 'Gallery')}
              </a>
              <a
                href="/#booking"
                onClick={(e) => handleNavClick(e, 'booking')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                style={linkStyle}
                onMouseOver={(e) => (e.currentTarget.style.color = navHoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.color = navTextColor)}
              >
                {getConfigValue('nav_booking_text', 'Book Now')}
              </a>
              <a
                href="/#contact"
                onClick={(e) => handleNavClick(e, 'contact')}
                className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                style={linkStyle}
                onMouseOver={(e) => (e.currentTarget.style.color = navHoverColor)}
                onMouseOut={(e) => (e.currentTarget.style.color = navTextColor)}
              >
                {getConfigValue('nav_contact_text', 'Contact')}
              </a>
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors"
                  style={activeLinkStyle}
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
                  <Button variant="ghost" size="icon" style={{ color: navTextColor }}>
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
                <Button variant="default" style={{ color: navTextColor }}>
                  {getConfigValue('nav_login_text', 'Login')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}