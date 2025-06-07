import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { VenueSettings } from "@shared/schema";

// Color conversion utility functions
function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h! /= 6;
  }

  return { h: h || 0, s, l };
}

// Theme context definition
type ThemeContextType = {
  theme: VenueSettings['theme'];
  updateTheme: (theme: VenueSettings['theme']) => void;
  venueSettings: VenueSettings | null;
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

  // Fetch venue settings to get the theme and other settings
  const { data: settings } = useQuery<VenueSettings>({
    queryKey: ["/api/admin/settings"],
  });

  // When settings are loaded, update the theme
  useEffect(() => {
    if (settings?.theme) {
      setTheme(settings.theme);
      applyTheme(settings.theme, settings);
    }
  }, [settings]);

  // Apply theme to the document
  const applyTheme = (newTheme: VenueSettings['theme'], venueSettings?: VenueSettings | null) => {
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
    
    // Apply custom background color if override is enabled
    if (venueSettings?.backgroundOverride && venueSettings?.customBackgroundColor) {
      document.documentElement.style.setProperty('background-color', venueSettings.customBackgroundColor);
      
      // Set appropriate text color based on background lightness
      const hexColor = venueSettings.customBackgroundColor;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hexColor);
      if (result) {
        const r = parseInt(result[1], 16) / 255;
        const g = parseInt(result[2], 16) / 255;
        const b = parseInt(result[3], 16) / 255;
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        const lightness = (max + min) / 2;
        
        if (lightness > 0.5) {
          document.documentElement.style.setProperty('color', '#000000');
        } else {
          document.documentElement.style.setProperty('color', '#ffffff');
        }
      }
    } else {
      // Remove custom background if override is disabled
      document.documentElement.style.removeProperty('background-color');
      document.documentElement.style.removeProperty('color');
    }
    
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
    applyTheme(newTheme, settings);
  };

  // Provide the theme context to children components
  return (
    <ThemeContext.Provider value={{ theme, updateTheme, venueSettings: settings || null }}>
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