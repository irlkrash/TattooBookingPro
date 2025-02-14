import { createContext, useContext, useEffect } from "react";
import { useDesignConfig } from "@/hooks/use-design-config";
import type { DesignConfig } from "@shared/schema";

const DesignConfigContext = createContext<ReturnType<typeof useDesignConfig> | null>(null);

export function DesignConfigProvider({ children }: { children: React.ReactNode }) {
  const config = useDesignConfig();

  useEffect(() => {
    if (!config.configs || config.isLoading) return;

    try {
      const applyConfig = (configs: DesignConfig[]) => {
        const root = document.documentElement;
        const styleConfigs = configs.filter(c => c.type === 'color');
        const backgroundConfigs = configs.filter(c => c.type === 'background_image');

        // Apply all color configurations as CSS variables
        styleConfigs.forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value || '');
        });

        // Apply background image configurations
        backgroundConfigs.forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value ? `url(${cfg.value})` : 'none');
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
          /* Theme Colors */
          :root {
            ${styleConfigs.map(cfg => `--${cfg.key.replace(/_/g, '-')}: ${cfg.value || ''};`).join('\n            ')}
          }

          /* Section Backgrounds */
          .booking-section {
            background-color: var(--booking-section-background, #f5f5f5);
            background-image: var(--booking-background-image, none);
            background-size: cover;
            background-position: center;
          }

          .contact-section {
            background-color: var(--contact-section-background, #f5f5f5);
            background-image: var(--contact-background-image, none);
            background-size: cover;
            background-position: center;
          }

          .header-section {
            background-color: var(--header-background, #ffffff);
            background-image: var(--header-background-image, none);
            background-size: cover;
            background-position: center;
          }

          .about-section {
            background-color: var(--about-background, #f5f5f5);
            background-image: var(--about-background-image, none);
            background-size: cover;
            background-position: center;
          }

          /* Form Backgrounds */
          .booking-form {
            background-color: var(--booking-form-background, #f8fafc);
          }

          .contact-form {
            background-color: var(--contact-form-background, #f8fafc);
          }

          /* Calendar */
          .available-date {
            background-color: var(--available-dates-background, #4ade80);
          }

          /* Text Colors */
          .gallery-description {
            color: var(--gallery-description-color, #6b7280);
          }

          /* Link Colors */
          a:not(.no-theme) {
            color: var(--link-color, inherit);
          }

          a:not(.no-theme):hover {
            color: var(--link-hover-color, inherit);
          }

          /* Background Colors */
          body {
            background-color: var(--background-color, #ffffff);
          }

          .theme-background {
            background-color: var(--background-color, #ffffff);
          }

          /* Primary Colors */
          .theme-primary {
            background-color: var(--primary-color, #000000);
            color: var(--primary-text-color, #ffffff);
          }

          /* Secondary Colors */
          .theme-secondary {
            background-color: var(--secondary-color, #6b7280);
            color: var(--secondary-text-color, #ffffff);
          }

          /* Text Colors */
          .text-primary {
            color: var(--primary-text-color, #000000);
          }

          .text-secondary {
            color: var(--secondary-text-color, #6b7280);
          }

          /* Button Colors */
          .button-primary {
            background-color: var(--primary-button-background, #2563eb);
            color: var(--primary-button-text, #ffffff);
          }
        `;

        // Apply text content updates
        configs.forEach(configItem => {
          if (configItem.type === 'text') {
            const elements = document.querySelectorAll(`[data-config-key="${configItem.key}"]`);
            elements.forEach(element => {
              element.textContent = configItem.value || '';
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