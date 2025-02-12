import { useQuery } from "@tanstack/react-query";
import type { DesignConfig } from "@shared/schema";

export function useDesignConfig() {
  const { data: configs } = useQuery<DesignConfig[]>({
    queryKey: ["/api/design-config"],
  });

  const getConfigValue = (key: string, defaultValue: string = "") => {
    const config = configs?.find(c => c.key === key);
    return config?.value || defaultValue;
  };

  return {
    getConfigValue,
    configs,
    // Helper functions for common configs
    primaryColor: getConfigValue("primary_color", "#000000"),
    secondaryColor: getConfigValue("secondary_color", "#ffffff"),
    bodyFont: getConfigValue("body_font", "Inter"),
    headingFont: getConfigValue("heading_font", "Montserrat"),
    textColor: getConfigValue("text_color", "#333333"),
    backgroundColor: getConfigValue("background_color", "#f5f5f5"),
    linkColor: getConfigValue("link_color", "#0066cc"),
  };
}
