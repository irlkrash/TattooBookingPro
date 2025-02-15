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

        // Group configurations by type and create a map for easy section access
        const styleConfigs = configs.filter(c => c.type === 'color');
        const backgroundImageConfigs = new Map(
          configs
            .filter(c => c.type === 'background_image')
            .map(c => [c.section, c])
        );
        const backgroundColorConfigs = new Map(
          configs
            .filter(c => c.type === 'background_color')
            .map(c => [c.section, c])
        );
        const textConfigs = configs.filter(c => c.type === 'text');
        const fontConfigs = configs.filter(c => c.type === 'font');

        // Apply global color configurations
        styleConfigs.forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value);
        });

        // Apply font configurations
        fontConfigs.forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value);
        });

        let styleElement = document.getElementById('dynamic-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'dynamic-styles';
          document.head.appendChild(styleElement);
        }

        // Generate section-specific styles
        const sections = ['hero', 'about', 'booking', 'contact', 'gallery', 'header', 'footer'];
        const sectionStyles = sections.map(section => {
          const bgImage = backgroundImageConfigs.get(section);
          const bgColor = backgroundColorConfigs.get(section);
          const selector = `.${section}-section`;

          let styles = `
            ${selector} {
              background-color: ${bgColor?.value || 'transparent'};
              ${bgImage ? `background-image: url('${bgImage.value}');` : ''}
              background-size: cover;
              background-position: center;
              background-repeat: no-repeat;
              position: relative;
              transition: all 0.3s ease;
              min-height: ${section === 'hero' ? '80vh' : '50vh'};
            }
          `;

          // Add overlay for sections with background images
          if (bgImage) {
            styles += `
              ${selector}::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.4);
                z-index: 1;
              }
              ${selector} > * {
                position: relative;
                z-index: 2;
                color: white;
              }
            `;
          }

          return styles;
        }).join('\n');

        // Update all dynamic styles
        styleElement.textContent = `
          /* Theme Colors */
          :root {
            ${styleConfigs.map(cfg => `--${cfg.key.replace(/_/g, '-')}: ${cfg.value};`).join('\n            ')}
          }

          /* Section Styles */
          ${sectionStyles}

          /* Form Containers */
          .form-container {
            background-color: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(10px);
            border-radius: var(--radius);
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin: 2rem auto;
            max-width: 600px;
            position: relative;
            z-index: 3;
          }

          /* Mobile Navigation */
          .burger-menu {
            color: var(--burger-menu-color, #FFFFFF);
            z-index: 50;
          }

          /* Links */
          .nav-link {
            color: var(--nav-link-color, #FFFFFF);
            transition: color 0.2s ease;
          }

          .nav-link:hover {
            color: var(--nav-link-hover-color, rgba(255, 255, 255, 0.8));
          }
        `;

        // Apply text content updates
        textConfigs.forEach(configItem => {
          const elements = document.querySelectorAll(`[data-config-key="${configItem.key}"]`);
          elements.forEach(element => {
            if (element) element.textContent = configItem.value;
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