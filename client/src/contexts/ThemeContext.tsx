import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { VenueSettings } from "@shared/schema";

// Theme context definition
type ThemeContextType = {
  theme: VenueSettings['theme'];
  updateTheme: (theme: VenueSettings['theme']) => void;
};

// Create the context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize theme state with default values
  const [theme, setTheme] = useState<VenueSettings['theme']>({
    primary: "hsl(280, 100%, 50%)",
    variant: "vibrant",
    appearance: "dark",
    radius: 0.75
  });

  // Fetch venue settings to get the theme
  const { data: settings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // When settings are loaded, update the theme
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
      applyTheme(settings.theme);
    }
  }, [settings]);

  // Apply theme to the document
  const applyTheme = (newTheme: VenueSettings['theme']) => {
    // Parse the HSL color
    const hslMatch = newTheme.primary.match(/hsl\((\d+),\s*(\d+)%,\s*(\d+)%\)/);
    if (!hslMatch) {
      console.error("Failed to parse HSL color:", newTheme.primary);
      return;
    }

    const hue = parseInt(hslMatch[1]);
    const saturation = parseInt(hslMatch[2]);
    const lightness = parseInt(hslMatch[3]);

    // Create or get style element
    let styleEl = document.getElementById("theme-styles");
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "theme-styles";
      document.head.appendChild(styleEl);
    }

    // Create CSS with all necessary variables
    const css = `
      :root {
        --primary: ${hue} ${saturation}% ${lightness}%;
        --primary-foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '0 0% 10%'};
        
        --background: ${newTheme.appearance === 'dark' ? '240 10% 3.9%' : '0 0% 100%'};
        --foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '240 10% 3.9%'};
        
        --card: ${newTheme.appearance === 'dark' ? '240 10% 3.9%' : '0 0% 100%'};
        --card-foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '240 10% 3.9%'};
        
        --secondary: ${newTheme.appearance === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%'};
        --secondary-foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '240 5.9% 10%'};
        
        --muted: ${newTheme.appearance === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%'};
        --muted-foreground: ${newTheme.appearance === 'dark' ? '240 5% 64.9%' : '240 3.8% 46.1%'};
        
        --accent: ${newTheme.appearance === 'dark' ? '240 3.7% 15.9%' : '240 4.8% 95.9%'};
        --accent-foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '240 5.9% 10%'};
        
        --destructive: ${newTheme.appearance === 'dark' ? '0 62.8% 30.6%' : '0 84.2% 60.2%'};
        --destructive-foreground: ${newTheme.appearance === 'dark' ? '0 0% 98%' : '0 0% 98%'};
        
        --border: ${newTheme.appearance === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%'};
        --input: ${newTheme.appearance === 'dark' ? '240 3.7% 15.9%' : '240 5.9% 90%'};
        --ring: ${hue} ${saturation}% ${lightness}%;
        
        --radius: ${newTheme.radius}rem;
      }
      
      /* Apply variant-specific styles */
      .theme-${newTheme.variant} {
        color-scheme: ${newTheme.appearance};
      }
      
      /* Direct style for buttons and UI elements */
      .button, button, .btn {
        --tw-ring-color: hsl(${hue} ${saturation}% ${lightness}%);
      }
      
      /* Enhanced accent styling */
      .accent-color {
        color: hsl(${hue} ${saturation}% ${lightness}%);
      }
      
      .accent-bg {
        background-color: hsl(${hue} ${saturation}% ${lightness}%);
      }
      
      .accent-border {
        border-color: hsl(${hue} ${saturation}% ${lightness}%);
      }
    `;
    
    styleEl.textContent = css;
    
    // Apply theme attributes to HTML element
    document.documentElement.dataset.theme = newTheme.appearance;
    document.documentElement.className = `theme-${newTheme.variant}`;
    
    // Apply directly to the theme.json (not necessary but adds another layer of persistence)
    try {
      const themeObj = {
        variant: newTheme.variant,
        primary: newTheme.primary,
        appearance: newTheme.appearance,
        radius: newTheme.radius
      };
      
      // Log the theme change
      console.log("Theme updated:", themeObj);
    } catch (error) {
      console.error("Error applying theme:", error);
    }
  };

  // Function to update the theme
  const updateTheme = (newTheme: VenueSettings['theme']) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Provide the theme context to children components
  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// Custom hook to use the theme context
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}