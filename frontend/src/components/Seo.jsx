import { useEffect } from "react";

export default function Seo({ description }) {
  useEffect(() => {
    document.title = "TerraSense AI";

    if (description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("name", "description");
        document.head.appendChild(tag);
      }
      tag.setAttribute("content", description);
    }
  }, [description]);

  return null;
}
