import { createContext, useContext, useEffect } from "react";
import { useDesignConfig } from "@/hooks/use-design-config";
import type { DesignConfig } from "@shared/schema";

const DesignConfigContext = createContext<ReturnType<typeof useDesignConfig> | null>(null);

export function DesignConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useDesignConfig();

  // Apply global styles based on configuration
  useEffect(() => {
    if (!config.configs || config.isLoading) return;

    try {
      const applyConfig = (configs: DesignConfig[]) => {
        const root = document.documentElement;
        const styleConfigs = configs.filter(c => c.type === 'color');

        // Apply all color configurations
        styleConfigs.forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value);
        });

        // Create a style element for the dynamic styles if it doesn't exist
        let styleElement = document.getElementById('dynamic-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'dynamic-styles';
          document.head.appendChild(styleElement);
        }

        // Update all dynamic styles in one go
        styleElement.textContent = `
          .booking-section {
            background-color: var(--booking-section-background);
          }

          .contact-section {
            background-color: var(--contact-section-background);
          }

          .available-date {
            background-color: var(--available-dates-background) !important;
          }

          .booking-form {
            background-color: var(--booking-form-background) !important;
          }

          .contact-form {
            background-color: var(--contact-form-background) !important;
          }

          .gallery-description {
            color: var(--gallery-description-color);
          }
        `;

        // Apply text content updates
        configs.forEach(configItem => {
          if (configItem.type === 'text') {
            const elements = document.querySelectorAll(`[data-config-key="${configItem.key}"]`);
            elements.forEach(element => {
              element.textContent = configItem.value;
            });
          }
        });
      };

      applyConfig(config.configs);
      console.log('Applied design configurations:', config.configs);

    } catch (error) {
      console.error('Error applying design config:', error);
    }
  }, [config.configs, config.isLoading]);

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