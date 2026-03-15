import { supabase } from "@/integrations/supabase/client";

export const generateAndSetFavicon = async () => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-favicon');
    
    if (error) throw error;
    
    if (data?.imageUrl) {
      // Convert base64 to blob
      const base64Data = data.imageUrl.split(',')[1];
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      // Create object URL
      const imageUrl = URL.createObjectURL(blob);
      
      // Update favicon
      const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link');
      link.type = 'image/png';
      link.rel = 'icon';
      link.href = imageUrl;
      
      if (!document.querySelector("link[rel*='icon']")) {
        document.head.appendChild(link);
      }
      
      return imageUrl;
    }
  } catch (error) {
    console.error('Error generating favicon:', error);
    throw error;
  }
};
