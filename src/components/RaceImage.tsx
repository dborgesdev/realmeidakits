import { useState, type ImgHTMLAttributes } from "react";
export default function RaceImage({
  src,
  alt,
  ...props
}: ImgHTMLAttributes<HTMLImageElement> & { src: string; alt: string }) {
  const [failed, setFailed] = useState<string>();
  if (!src || failed === src)
    return (
      <div
        className={`${props.className || ""} event-image-missing`}
        role="img"
        aria-label={alt || "Imagem indisponível"}
      >
        Imagem indisponível
      </div>
    );
  return <img {...props} src={src} alt={alt} onError={() => setFailed(src)} />;
}
