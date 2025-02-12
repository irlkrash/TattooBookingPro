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
        root.style.fontFamily = `var(--font-body), system-ui, sans-serif`;

        // Apply body font to all elements except headings
        const bodyElements = document.querySelectorAll("body, p, div, span, a, button, input, textarea");
        bodyElements.forEach(element => {
          if (!element.closest("h1, h2, h3, h4, h5, h6")) {
            (element as HTMLElement).style.fontFamily = `var(--font-body), system-ui, sans-serif`;
          }
        });
      }

      if (config.headingFont) {
        root.style.setProperty("--font-heading", config.headingFont);
        const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6, .heading");
        headings.forEach(heading => {
          (heading as HTMLElement).style.fontFamily = `var(--font-heading), system-ui, sans-serif`;
        });
      }

      // Create a style element for the font families if it doesn't exist
      let fontStyleElement = document.getElementById('dynamic-fonts');
      if (!fontStyleElement) {
        fontStyleElement = document.createElement('style');
        fontStyleElement.id = 'dynamic-fonts';
        document.head.appendChild(fontStyleElement);
      }

      // Update font CSS rules
      fontStyleElement.textContent = `
        :root {
          --font-body: ${config.bodyFont}, system-ui, sans-serif;
          --font-heading: ${config.headingFont}, system-ui, sans-serif;
        }
        body {
          font-family: var(--font-body);
        }
        h1, h2, h3, h4, h5, h6, .heading {
          font-family: var(--font-heading);
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