import React from "react";
import { useAppVisible } from "./utils";

interface BackdropProps {
  show: boolean;
  children: React.ReactNode;
  innerRef: React.RefObject<HTMLElement>;
}

export const Backdrop: React.FC<BackdropProps> = ({ innerRef, show, children }) => {
  const visible = useAppVisible();
  if (!visible || !show) {
    return null;
  }
  return (
    <main
      className="h-screen bg-opacity-50 bg-gray-800 backdrop-filter backdrop-blur-md fixed inset-0 p-8 flex items-center justify-center"
      onClick={(e) => {
        if (!innerRef.current?.contains(e.target as any)) {
          logseq.hideMainUI();
        }
      }}
    >
      {children}
    </main>
  );
};
