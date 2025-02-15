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
        const textConfigs = configs.filter(c => c.type === 'text');
        const fontConfigs = configs.filter(c => c.type === 'font');

        // Apply color and font configurations to CSS variables
        [...styleConfigs, ...fontConfigs].forEach(cfg => {
          const cssVar = `--${cfg.key.replace(/_/g, '-')}`;
          root.style.setProperty(cssVar, cfg.value);
        });

        let styleElement = document.getElementById('dynamic-styles');
        if (!styleElement) {
          styleElement = document.createElement('style');
          styleElement.id = 'dynamic-styles';
          document.head.appendChild(styleElement);
        }

        // Generate CSS for different sections
        const sections = ['hero', 'about', 'featured', 'cta', 'gallery', 'contact'];
        const sectionStyles = sections.map(section => {
          const bgImage = backgroundImageConfigs.find(c => c.key === `${section}_background_image`);
          const bgColor = configs.find(c => c.key === `${section}_background_color`);
          const textColor = configs.find(c => c.key === `${section}_text_color`);

          return `
            .${section}-section {
              ${bgImage?.value ? `background-image: url('${bgImage.value}');` : ''}
              background-color: ${bgColor?.value || 'transparent'};
              color: ${textColor?.value || 'inherit'};
              background-size: cover;
              background-position: center;
              position: relative;
              padding: 4rem 2rem;
              min-height: ${section === 'hero' ? '80vh' : '50vh'};
            }

            ${bgImage?.value ? `
              .${section}-section::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.4);
                z-index: 1;
              }

              .${section}-section > * {
                position: relative;
                z-index: 2;
              }
            ` : ''}
          `;
        }).join('\n');

        // Update dynamic styles
        styleElement.textContent = `
          /* CSS Variables */
          :root {
            ${styleConfigs.map(cfg => `--${cfg.key.replace(/_/g, '-')}: ${cfg.value};`).join('\n')}
          }

          /* Section Styles */
          ${sectionStyles}

          /* Component Styles */
          .primary-button {
            background-color: var(--button-primary-bg);
            color: var(--button-primary-text);
          }

          .form-container {
            background-color: var(--contact-form-background, #ffffff);
            border-radius: 0.5rem;
            padding: 2rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            position: relative;
            z-index: 3;
          }

          /* Text Styles */
          body {
            font-family: var(--body-font, 'Inter'), sans-serif;
            color: var(--text-color);
            background-color: var(--background-color);
          }

          h1, h2, h3, h4, h5, h6 {
            font-family: var(--heading-font, 'Montserrat'), sans-serif;
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