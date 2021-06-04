import { BlockEntity, BlockUUIDTuple } from "@logseq/libs/dist/LSPlugin";
import * as React from "react";
import { useMountedState } from "react-use";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple
): maybeBlockEntity is BlockEntity {
  return "id" in maybeBlockEntity;
}

export const BLOCK_PATH_ANCHOR_ID = "random-tools-block-path";

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
      const candidates = getParentBlocks(
        b.children.filter(isBlockEntity),
        currentBlock,
        newParents
      );
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

export function useActiveBlocks() {
  const [blocks, setBlocks] =
    React.useState<BlockEntity[] | undefined>(undefined);
  const isMounted = useMountedState();
  const currentBlocksRef = React.useRef(blocks);
  React.useEffect(() => {
    const focusListener = async () => {
      const block = await logseq.Editor.getCurrentBlock();
      if (block) {
        const pageBlocks =
          (await logseq.Editor.getCurrentPageBlocksTree()) ?? [];
        if (isMounted()) {
          const parentBlocks = getParentBlocks(pageBlocks, block);
          if (parentBlocks) {
            const _blocks = [...parentBlocks, block];
            setBlocks(_blocks);
            currentBlocksRef.current = _blocks;
          }
        }
      }
    };
    const blurListener = () => {
      let enterBlocks = currentBlocksRef.current;
      setTimeout(() => {
        if (enterBlocks === currentBlocksRef.current && isMounted()) {
          setBlocks(undefined);
        }
      }, 100);
    };
    top.document.addEventListener("focus", focusListener, true);
    top.document.addEventListener("blur", blurListener, true);
    return () => {
      top.document.removeEventListener("focus", focusListener, true);
      top.document.removeEventListener("blur", blurListener, true);
    };
  }, [isMounted]);
  return blocks;
}

const useSyncBlockPath = (blocks?: BlockEntity[]) => {
  React.useEffect(() => {
    const anchor = top.document.getElementById(BLOCK_PATH_ANCHOR_ID);
    if (anchor) {
      const path = blocks?.map(getTitleText);
      if (path) {
        anchor.innerHTML = path
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
  }, [blocks]);
};

export function BlockPathRenderer() {
  const blocks = useActiveBlocks();
  useSyncBlockPath(blocks);
  return null;
}
