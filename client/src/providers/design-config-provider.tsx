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
        const backgroundImageConfigs = configs.filter(c => c.type === 'background_image');
        const backgroundColorConfigs = configs.filter(c => c.type === 'background_color');
        const textConfigs = configs.filter(c => c.type === 'text');

        // Apply color configurations
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

        // Generate CSS for sections
        const sectionStyles = Array.from(new Set([...backgroundImageConfigs, ...backgroundColorConfigs].map(cfg => cfg.section)))
          .map(section => {
            const bgImage = backgroundImageConfigs.find(cfg => cfg.section === section);
            const bgColor = backgroundColorConfigs.find(cfg => cfg.section === section);
            const selector = `.${section}-section`;

            return `
              ${selector} {
                background-color: ${bgColor?.value || '#f5f5f5'};
                background-image: ${bgImage?.value ? `url(${bgImage.value})` : 'none'};
                background-size: cover;
                background-position: center;
                background-repeat: no-repeat;
                position: relative;
              }

              /* Add overlay for better text visibility if background image exists */
              ${bgImage?.value ? `
                ${selector}::before {
                  content: '';
                  position: absolute;
                  top: 0;
                  left: 0;
                  right: 0;
                  bottom: 0;
                  background: rgba(0, 0, 0, 0.3);
                  z-index: 1;
                }
                ${selector} > * {
                  position: relative;
                  z-index: 2;
                }
              ` : ''}
            `;
          }).join('\n');

        // Update all dynamic styles in one go
        styleElement.textContent = `
          /* Theme Colors */
          :root {
            ${styleConfigs.map(cfg => `--${cfg.key.replace(/_/g, '-')}: ${cfg.value};`).join('\n            ')}
          }

          /* Section Styles */
          ${sectionStyles}

          /* Additional Styles */
          .form-container {
            background-color: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }

          /* Mobile Burger Menu */
          .burger-menu {
            color: var(--burger-menu-color, #FFFFFF);
          }

          /* Link Styles */
          a:not(.no-theme) {
            color: var(--link-color, #000000);
            text-decoration: none;
            transition: color 0.2s ease;
          }

          a:not(.no-theme):hover {
            color: var(--link-hover-color, #4a5568);
          }

          /* Navigation Links */
          .nav-link {
            color: var(--nav-link-color, #000000);
          }

          .nav-link:hover {
            color: var(--nav-link-hover-color, #4a5568);
          }

          /* Default Styles */
          body {
            background-color: var(--background-color, #ffffff);
          }

          .theme-background {
            background-color: var(--background-color, #ffffff);
          }

          .theme-primary {
            background-color: var(--primary-color, #000000);
            color: var(--primary-text-color, #ffffff);
          }

          .theme-secondary {
            background-color: var(--secondary-color, #6b7280);
            color: var(--secondary-text-color, #ffffff);
          }
        `;

        // Apply text content updates
        textConfigs.forEach(configItem => {
          const elements = document.querySelectorAll(`[data-config-key="${configItem.key}"]`);
          elements.forEach(element => {
            element.textContent = configItem.value;
          });
        });
      };

      applyConfig(config.configs);

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