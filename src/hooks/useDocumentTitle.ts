import { useEffect } from "react";

export const useDocumentTitle = (title: string, suffix = "Szortsy") => {
  useEffect(() => {
    const fullTitle = title ? `${title} | ${suffix}` : `${suffix} - Wiadomości sportowe krótko i na temat`;
    document.title = fullTitle;

    // Update OG title meta tag
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", fullTitle);
  }, [title, suffix]);
};
