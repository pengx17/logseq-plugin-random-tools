import React, { useRef, useState } from "react";
import { Backdrop } from "./Backdrop";
import { useAppOnVisibleChange } from "./utils";

const useActive = (onPreview: (src: string) => void) => {
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if ((e.target as any)?.tagName === "IMG") {
        const img = e.target as HTMLImageElement;
        if (
          img.parentElement?.classList.contains("asset-container") &&
          img.parentElement?.parentElement?.classList.contains("image-resize")
        ) {
          onPreview(img.src);
          e.stopPropagation();
        }
      }
    };
    window.top.document.body.addEventListener("mousedown", listener, true);
    return () => {
      window.top.document.body.removeEventListener("mousedown", listener, true);
    };
  }, []);
};

export function FullscreenImage() {
  const innerRef = useRef<HTMLImageElement>(null);
  const [activeSrc, setActiveSrc] = useState<string>("");

  useActive((src: string) => {
    if (src) {
      setActiveSrc(src);
      logseq.showMainUI();
    }
  });

  useAppOnVisibleChange((visible) => {
    if (!visible) {
      setActiveSrc("");
    }
  });

  return (
    <Backdrop innerRef={innerRef} show={!!activeSrc}>
      <img ref={innerRef} src={activeSrc} className="max-h-11/12" />
    </Backdrop>
  );
}
