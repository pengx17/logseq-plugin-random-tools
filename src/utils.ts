import { BlockEntity, PageEntity } from "@logseq/libs/dist/LSPlugin";
import React, { useRef, useState } from "react";
import { useMountedState, useDebounce } from "react-use";

export const BLOCK_PATH_ANCHOR_ID = "random-tools-block-path";
export const WORD_COUNT_ANCHOR_ID = "random-tools-word-count";
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

export async function getCurrentBlockAndPage(): Promise<
  [PageEntity, BlockEntity] | null
> {
  const block = await logseq.Editor.getCurrentBlock();
  if (block) {
    const page = await logseq.Editor.getPage(block.page.id);
    if (page) {
      return [page, block];
    }
  }
  return null;
}

export const useEditingPageAndBlock = (rootElement: Element | null) => {
  const [state, setState] =
    React.useState<[PageEntity, BlockEntity] | undefined>(undefined);
  const isMounted = useMountedState();
  const counterRef = useRef(0);
  React.useEffect(() => {
    const focusListener = async () => {
      const counter = ++counterRef.current;
      const results = await getCurrentBlockAndPage();
      if (results && counter === counterRef.current) {
        setState(results);
      }
    };

    const blurListener = () => {
      const counter = counterRef.current;
      setTimeout(() => {
        if (counter === counterRef.current) {
          setState(undefined);
        }
      }, 200);
    };
    rootElement?.addEventListener("focus", focusListener, true);
    rootElement?.addEventListener("blur", blurListener, true);
    return () => {
      rootElement?.removeEventListener("focus", focusListener, true);
      rootElement?.removeEventListener("blur", blurListener, true);
    };
  }, [isMounted, rootElement]);
  return state;
};

const changeEvents = ['change', 'blur', 'input'];

export const useEditingPageTree = (
  rootElement: Element | null,
  debounceTime = 1000
) => {
  const [tree, setTree] = React.useState<BlockEntity[] | undefined>(undefined);
  const isMounted = useMountedState();
  const pageAndBlock = useEditingPageAndBlock(rootElement);
  const counterRef = useRef(0);
  React.useEffect(() => {
    logseq.App.onRouteChanged(() => {
      ++counterRef.current;
      if (isMounted()) {
        setTree([]);
      }
    });
  }, []);
  React.useEffect(() => {
    if (pageAndBlock) {
      const [page] = pageAndBlock;
      let timer = 0;
      const calcAndUpdate = (initial = false) => {
        const counter = ++counterRef.current;
        if (timer) {
          clearTimeout(timer);
        }
        timer = setTimeout(
          async () => {
            const res = await logseq.Editor.getPageBlocksTree(page.name);
            if (res && counterRef.current === counter) {
              setTree(res);
            }
          },
          initial ? 0 : debounceTime
        );
      };
      calcAndUpdate(true);
      const focusListener = () => {
        calcAndUpdate();
      };

      changeEvents.forEach(eventName => {
        rootElement?.addEventListener(eventName, focusListener, true);
      })
      return () => {
        changeEvents.forEach(eventName => {
          rootElement?.removeEventListener(eventName, focusListener, true);
        })
      };
    }
  }, [isMounted, rootElement, pageAndBlock]);
  return tree;
};
