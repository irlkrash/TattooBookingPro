import { createContext, useContext, useEffect } from "react";
import { useDesignConfig } from "@/hooks/use-design-config";
import { useQueryClient } from "@tanstack/react-query"; //This line is added from the edited snippet

const DesignConfigContext = createContext<ReturnType<typeof useDesignConfig> | null>(null);

export function DesignConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useDesignConfig();
  const queryClient = useQueryClient(); //This line is added from the edited snippet

  // Apply global styles based on configuration
  useEffect(() => {
    if (!config.configs) return; //This line is added from the edited snippet

    const root = document.documentElement;
    root.style.setProperty("--primary", config.primaryColor);
    root.style.setProperty("--secondary", config.secondaryColor);
    root.style.setProperty("--text-color", config.textColor);
    root.style.setProperty("--background-color", config.backgroundColor);
    root.style.setProperty("--link-color", config.linkColor);

    // Apply fonts
    document.body.style.fontFamily = config.bodyFont;
    const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
    headings.forEach(heading => {
      (heading as HTMLElement).style.fontFamily = config.headingFont;
    });
  }, [config]);

  return (
    <DesignConfigContext.Provider value={config}>
      {children}
    </DesignConfigContext.Provider>
  );
}

export const useDesignContext = () => {
  const context = useContext(DesignConfigContext);
  if (!context) {
    throw new Error("useDesignContext must be used within a DesignConfigProvider");
  }
  return context;
};