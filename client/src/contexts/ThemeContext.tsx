import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { VenueSettings } from "@shared/schema";

type ThemeContextType = {
  theme: VenueSettings['theme'];
  updateTheme: (theme: VenueSettings['theme']) => void;
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<VenueSettings['theme']>({
    primary: "hsl(280, 100%, 50%)",
    variant: "vibrant",
    appearance: "dark",
    radius: 0.75
  });

  // Fetch the venue settings initially
  const { data: settings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // Set the theme from settings when they are loaded
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
      updateCSSVariables(settings.theme);
    }
  }, [settings]);

  // Function to update CSS variables based on theme
  const updateCSSVariables = (newTheme: VenueSettings['theme']) => {
    // Update the document style
    document.documentElement.style.setProperty("--primary", newTheme.primary);
    
    // Create and update a style element to override the CSS variables
    let styleEl = document.getElementById("theme-style");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-style";
      document.head.appendChild(styleEl);
    }

    // Different variants can have different saturation or lightness
    const hslMatch = newTheme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) return;

    const hue = hslMatch[1];
    const saturation = parseInt(hslMatch[2]);
    const lightness = parseInt(hslMatch[3]);

    let css = `:root {
      --primary: ${newTheme.primary};
      --primary-foreground: hsl(0, 0%, ${newTheme.appearance === 'dark' ? '98%' : '10%'});
    `;

    // Add variant-specific styles
    switch (newTheme.variant) {
      case "vibrant":
        css += `
          --primary-hover: hsl(${hue}, ${Math.min(100, saturation + 5)}%, ${Math.max(20, lightness - 5)}%);
          --card-foreground: var(--primary-foreground);
          --border: hsl(${hue}, ${Math.max(10, saturation - 70)}%, ${newTheme.appearance === 'dark' ? '20%' : '90%'});
        `;
        break;
      case "professional":
        css += `
          --primary-hover: hsl(${hue}, ${Math.min(90, saturation + 10)}%, ${Math.max(25, lightness - 5)}%);
          --card-foreground: hsl(${hue}, 5%, ${newTheme.appearance === 'dark' ? '90%' : '10%'});
          --border: hsl(${hue}, 15%, ${newTheme.appearance === 'dark' ? '25%' : '85%'});
        `;
        break;
      case "tint":
        css += `
          --primary-hover: hsl(${hue}, ${Math.min(90, saturation + 10)}%, ${Math.max(30, lightness - 10)}%);
          --card-foreground: hsl(${hue}, 10%, ${newTheme.appearance === 'dark' ? '95%' : '15%'});
          --border: hsl(${hue}, 20%, ${newTheme.appearance === 'dark' ? '30%' : '90%'});
        `;
        break;
    }

    // Close the CSS block
    css += '}';
    styleEl.textContent = css;
    
    // Update theme-related classes on body
    document.body.classList.toggle('dark', newTheme.appearance === 'dark');
    document.body.classList.toggle('light', newTheme.appearance === 'light');
    
    // Update border radius
    document.documentElement.style.setProperty("--radius", `${newTheme.radius}rem`);
  };

  // Function to update the theme
  const updateTheme = (newTheme: VenueSettings['theme']) => {
    setTheme(newTheme);
    updateCSSVariables(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}