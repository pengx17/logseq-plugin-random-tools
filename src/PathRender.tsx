import { BlockEntity } from "@logseq/libs/dist/LSPlugin";
import * as React from "react";
import { useDebounceValue } from "./utils";

function getParentBlocks(
  pageTree: BlockEntity[],
  currentBlock: BlockEntity,
  parents: BlockEntity[] = []
): BlockEntity[] | null {
  if (pageTree.some((b) => b.id === currentBlock.id)) {
    return parents;
  } else if (pageTree.length > 0) {
    for (let b of pageTree) {
      const newParents = [...parents, b];
      const candidates = getParentBlocks(b.children, currentBlock, newParents);
      if (candidates) {
        return candidates;
      }
    }
  }
  return null;
}

const getFragmentText = (fragment: any) => {
  return typeof fragment[1] === "string" ? fragment[1] : fragment[1]?.fullText;
};

const getTitleText = (b: BlockEntity) => {
  return b.title.map(getFragmentText).join("");
};

export function useBlockPath() {
  const [path, setPath] = React.useState<string[] | undefined>(undefined);
  React.useEffect(() => {
    const focusListener = async () => {
      const block = await logseq.Editor.getCurrentBlock();
      if (block) {
        const pageBlocks = await logseq.Editor.getCurrentPageBlocksTree();
        const parentBlocks = getParentBlocks(pageBlocks, block);
        if (parentBlocks) {
          const path = [...parentBlocks, block]?.map(getTitleText);
          setPath(path);
        }
      }
    };
    const blurListener = () => setPath(undefined);
    top.document.addEventListener("focus", focusListener, true);
    top.document.addEventListener("blur", blurListener, true);
    return () => {
      top.document.removeEventListener("focus", focusListener, true);
      top.document.removeEventListener("blur", blurListener, true);
    };
  }, []);
  return path;
}

export function BlockPathRenderer() {
  const path = useBlockPath();
  const dPath = useDebounceValue(path);
  React.useEffect(() => {
    const anchor = top.document.getElementById("random-tools-block-path");
    if (anchor) {
      if (dPath) {
        anchor.innerHTML = dPath
          .map((p: string) => `<strong>${p}</strong>`)
          .join(" ➤ ");
        anchor.style.display = "inline";
      } else {
        anchor.innerHTML = "";
        anchor.style.display = "none";
      }
      return () => {
        anchor.innerHTML = "";
        anchor.style.display = "none";
      };
    }
  }, [dPath]);
  return null;
}
