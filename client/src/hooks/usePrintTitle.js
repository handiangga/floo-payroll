import { useEffect } from "react";

// Browsers use the document title as the suggested Save as PDF filename.
export default function usePrintTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title;
    return () => { document.title = previous; };
  }, [title]);
}
