import React, { useState } from "react";
import { useMountedState, useDebounce } from "react-use";

export const BLOCK_PATH_ANCHOR_ID = "random-tools-block-path";
export const LEFT_CONTAINER_ID = "left-container";
export const RIGHT_CONTAINER_ID = "right-sidebar-container";

export const useAppOnVisibleChange = (fn: (visible: boolean) => void) => {
  const isMounted = useMountedState();
  React.useEffect(() => {
    const eventName = "ui:visible:changed";
    const handler = async ({ visible }: any) => {
      if (isMounted()) {
        fn(visible);
      }
    };
    logseq.on(eventName, handler);
    return () => {
      logseq.off(eventName, handler);
    };
  }, []);
};

export const useAppVisible = () => {
  const [visible, setVisible] = useState(logseq.isMainUIVisible);
  useAppOnVisibleChange(setVisible);
  return visible;
};

export const useSidebarVisible = () => {
  const [visible, setVisible] = useState(false);
  const isMounted = useMountedState();
  React.useEffect(() => {
    logseq.App.onSidebarVisibleChanged(({ visible }) => {
      if (isMounted()) {
        setVisible(visible);
      }
    });
  }, []);
  return visible;
};

export function useDebounceValue<T>(v: T, timeout: number = 50) {
  const [state, setState] = React.useState(v);
  useDebounce(
    () => {
      setState(v);
    },
    timeout,
    [v]
  );
  return state;
}

export const useActiveSide = () => {
  const [side, setSide] = React.useState<"left" | "right">("left");
  React.useEffect(() => {
    const listener = (e: MouseEvent) => {
      if (
        top.document
          .getElementById(RIGHT_CONTAINER_ID)
          ?.contains(e.target as Node)
      ) {
        setSide("right");
      } else if (
        top.document
          .getElementById(LEFT_CONTAINER_ID)
          ?.contains(e.target as Node)
      ) {
        setSide("left");
      }
    };
    top.document.addEventListener("mousedown", listener, true);
    return () => {
      top.document.removeEventListener("mousedown", listener, true);
    };
  }, []);
  return side;
};
