import React, { useCallback, useLayoutEffect, useRef, useState } from "react";
import { useKey } from 'react-use';
import { useAppVisible } from "./utils";
import { v4 } from 'uuid';

const useSetupImageFullscreen = (onClick: (imgsrc: string) => void) => {
  React.useEffect(() => {
    const attrName = 'data-fullscreen-visited';
    const listeners = new Map<string, (e: MouseEvent) => void>();
    const observer = new MutationObserver((m) => {
      // Filter resizable img:
      const imgs = m.filter(
        (m) =>
          m.type === "childList" &&
          m.target.nodeName === "DIV" &&
          (m.target as HTMLDivElement).classList.contains("resize") &&
          (m.target as HTMLDivElement).classList.contains("image-resize")
      ).flatMap(m => Array.from((m.target as HTMLDivElement).querySelectorAll('img')));

      imgs.forEach(img => {
        if (img && !img.getAttribute(attrName)) {
          const listener = (e: MouseEvent) => {
            onClick(img.src);
            e.stopPropagation();
          };
          img.addEventListener("mousedown", listener);
          const newId = v4();
          listeners.set(newId, listener)
          img.setAttribute(attrName, newId);
        }
      })
    });

    observer.observe(window.top.document.body, {
      attributes: false,
      childList: true,
      subtree: true,
    });

    return () => {
      document.querySelectorAll<HTMLImageElement>(`img[${attrName}]`).forEach(img => {
        const id = img.getAttribute(attrName) ?? '';
        const listener = listeners.get(id)
        if (listener) {
          img.removeEventListener('mousedown', listener);
          img.removeAttribute(attrName);
          listeners.delete(id)
        }
      })
    }
  }, []);
}

function App() {
  const innerRef = useRef<HTMLImageElement>(null);
  const visible = useAppVisible();
  const [activeSrc, setActiveSrc] = useState<null | string>(null);

  useSetupImageFullscreen(setActiveSrc);
  useLayoutEffect(() => {
    if (activeSrc) {
      logseq.showMainUI();
    }
  }, [activeSrc]);

  const onClose = useCallback(() => {
    window.logseq.hideMainUI();
    setActiveSrc(null);
  }, []);

  useKey('Escape', onClose);

  if (visible && activeSrc) {
    return (
      <main
        className="h-screen bg-opacity-50 bg-gray-800 backdrop-filter backdrop-blur-md fixed inset-0 p-8 flex items-center justify-center"
        onClick={(e) => {
          if (!innerRef.current?.contains(e.target as any)) {
            onClose();
          }
        }}
      >
        <img ref={innerRef} src={activeSrc} className="max-h-11/12" />
      </main>
    );
  }
  return null;
}

export default App;
