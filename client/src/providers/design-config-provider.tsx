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

        // Group configurations by type
        const styleConfigs = configs.filter(c => c.type === 'color');
        const backgroundImageConfigs = configs.filter(c => c.type === 'background_image');
        const backgroundColorConfigs = configs.filter(c => c.type === 'background_color');
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
          // Find configurations for this section
          const bgImage = backgroundImageConfigs.find(c => c.key === `${section}_background_image`);
          const bgColor = backgroundColorConfigs.find(c => c.key === `${section}_background_color`);
          const selector = `.${section}-section`;

          // Section-specific styles
          let styles = '';

          switch(section) {
            case 'header':
              styles = `
                ${selector} {
                  background-color: white;
                  position: sticky;
                  top: 0;
                  z-index: 50;
                  padding: 1rem;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                }
              `;
              break;

            case 'hero':
              styles = `
                ${selector} {
                  background-image: url('${bgImage?.value}');
                  background-color: ${bgColor?.value || 'transparent'};
                  background-size: cover;
                  background-position: center;
                  min-height: 80vh;
                  position: relative;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  color: white;
                  text-align: center;
                  padding: 2rem;
                }
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
                }
              `;
              break;

            case 'booking':
              styles = `
                ${selector} {
                  background-color: ${bgColor?.value || '#f97316'};
                  padding: 4rem 2rem;
                  min-height: 50vh;
                }
              `;
              break;

            case 'about':
              styles = `
                ${selector} {
                  background-color: white;
                  padding: 4rem 2rem;
                  position: relative;
                }
                ${selector} .content-image {
                  background-image: url('${bgImage?.value}');
                  background-size: cover;
                  background-position: center;
                  border-radius: 0.5rem;
                  aspect-ratio: 16/9;
                }
              `;
              break;

            case 'contact':
              styles = `
                ${selector} {
                  background-color: ${bgColor?.value || '#84cc16'};
                  padding: 4rem 2rem;
                  min-height: 50vh;
                }
              `;
              break;

            default:
              styles = `
                ${selector} {
                  background-color: ${bgColor?.value || 'transparent'};
                  ${bgImage?.value ? `background-image: url('${bgImage.value}');` : ''}
                  background-size: cover;
                  background-position: center;
                  min-height: 50vh;
                  padding: 2rem;
                  position: relative;
                }
              `;
          }

          return styles;
        }).join('\n');

        // Update all dynamic styles
        styleElement.textContent = `
          /* Theme Colors */
          :root {
            ${styleConfigs.map(cfg => `--${cfg.key.replace(/_/g, '-')}: ${cfg.value};`).join('\n')}
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