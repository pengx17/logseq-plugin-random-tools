import {
  BlockEntity,
  BlockUUIDTuple,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin";
import * as React from "react";
import { useMountedState } from "react-use";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple | PageEntity
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
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
        (b.children ?? []).filter(isBlockEntity),
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

const getBlockLabel = (b: PageEntity | BlockEntity) => {
  if (isBlockEntity(b)) {
    return b.title?.map(getFragmentText).join("") ?? '<empty>';
  }
  return `[[${b.originalName}]]`;
};

type ActiveBlocks = readonly [PageEntity, ...BlockEntity[]];

export function useActiveBlocks() {
  const [blocks, setBlocks] =
    React.useState<ActiveBlocks | undefined>(undefined);
  const isMounted = useMountedState();
  const currentBlocksRef = React.useRef(blocks);
  React.useEffect(() => {
    const focusListener = async () => {
      const block = await logseq.Editor.getCurrentBlock();
      if (block) {
        const page = await logseq.Editor.getBlock<true>(block.page.id);
        if (page) {
          const pageBlocks =
            (await logseq.Editor.getPageBlocksTree(page.name)) ?? [];
          if (isMounted()) {
            const parentBlocks = getParentBlocks(pageBlocks, block);
            if (parentBlocks) {
              const _blocks = [page!, ...parentBlocks, block] as const;
              setBlocks(_blocks);
              currentBlocksRef.current = _blocks;
            }
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

function getActiveBlockBreadcrumbs(blocks?: ActiveBlocks) {
  if (blocks) {
    let result: { label: string; href: string }[] = [];
    const [page, ...parentBlocks] = blocks;
    result.push({ label: getBlockLabel(page), href: `#/page/${page.name}` });
    parentBlocks.forEach((block) => {
      result.push({
        label: getBlockLabel(block),
        href: `#/page/${block.uuid}`,
      });
    });
    return result;
  }
  return;
}

const useSyncBlockPath = (blocks?: ActiveBlocks) => {
  React.useEffect(() => {
    const anchor = top.document.getElementById(BLOCK_PATH_ANCHOR_ID);
    if (anchor) {
      const breadcrumbs = getActiveBlockBreadcrumbs(blocks);
      if (breadcrumbs) {
        anchor.innerHTML = breadcrumbs
          .map((breadcrumb) => {
            return `<a href="${breadcrumb.href}" class="block-path-breadcrumb-fragment">${breadcrumb.label}</a>`;
          })
          .join(
            "<span class='block-path-breadcrumb-fragment-separator'> / </span>"
          );
        anchor.style.display = "inline";
      } else {
        anchor.innerHTML = "";
        anchor.style.display = "none";
      }
    }
    return () => {
      if (anchor) {
        anchor.innerHTML = "";
        anchor.style.display = "none";
      }
    };
  }, []);
};

export function BlockPathRenderer(_props: any) {
  const blocks = useActiveBlocks();
  useSyncBlockPath(blocks);
  return null;
}
