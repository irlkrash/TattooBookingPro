import { createContext, useContext, useEffect } from "react";
import { useDesignConfig } from "@/hooks/use-design-config";

const DesignConfigContext = createContext<ReturnType<typeof useDesignConfig> | null>(null);

export function DesignConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useDesignConfig();

  // Apply global styles based on configuration
  useEffect(() => {
    if (!config.configs || config.isLoading) return;

    try {
      console.log('Applying design config:', config);

      const root = document.documentElement;

      // Apply colors
      root.style.setProperty("--primary", config.primaryColor);
      root.style.setProperty("--secondary", config.secondaryColor);
      root.style.setProperty("--text-color", config.textColor);
      root.style.setProperty("--background-color", config.backgroundColor);
      root.style.setProperty("--link-color", config.linkColor);

      // Apply fonts using CSS custom properties
      if (config.bodyFont) {
        root.style.setProperty("--font-body", config.bodyFont);
      }

      if (config.headingFont) {
        root.style.setProperty("--font-heading", config.headingFont);
      }

      // Create a style element for the dynamic styles if it doesn't exist
      let styleElement = document.getElementById('dynamic-styles');
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'dynamic-styles';
        document.head.appendChild(styleElement);
      }

      // Update all dynamic styles in one go
      styleElement.textContent = `
        :root {
          --font-body: ${config.bodyFont}, system-ui, sans-serif;
          --font-heading: ${config.headingFont}, system-ui, sans-serif;
        }

        body {
          font-family: var(--font-body);
          background-color: ${config.backgroundColor};
          color: ${config.textColor};
        }

        h1, h2, h3, h4, h5, h6, .heading {
          font-family: var(--font-heading);
        }

        a {
          color: ${config.linkColor};
        }

        /* Apply body font to specific elements */
        p, div, span, button, input, textarea {
          font-family: var(--font-body);
        }
      `;

      // Apply text content updates
      config.configs.forEach(configItem => {
        if (configItem.type === 'text') {
          const elements = document.querySelectorAll(`[data-config-key="${configItem.key}"]`);
          elements.forEach(element => {
            element.textContent = configItem.value;
          });
        }
      });

    } catch (error) {
      console.error('Error applying design config:', error);
    }
  }, [
    config.configs,
    config.primaryColor,
    config.secondaryColor,
    config.textColor,
    config.backgroundColor,
    config.linkColor,
    config.bodyFont,
    config.headingFont,
    config.isLoading
  ]);

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