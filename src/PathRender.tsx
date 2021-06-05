import {
  BlockEntity,
  BlockUUIDTuple,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin";
import * as React from "react";
import { useMountedState } from "react-use";
import { BLOCK_PATH_ANCHOR_ID } from "./utils";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple | PageEntity
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
}

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
    return b.title?.map(getFragmentText).join("").trim() || "...";
  }
  return b.originalName;
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
        const page = (await logseq.Editor.getBlock(
          block.page.id
        )) as PageEntity | null;
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
    // TODO: cannot remove listener in HMR mode
    logseq.App.onRouteChanged(() => {
      setBlocks(undefined);
    });

    // TODO: render path for right-bar
    const mainContainer = top.document.getElementById("left-container")!;
    mainContainer.addEventListener("focus", focusListener, true);
    return () => {
      mainContainer.removeEventListener("focus", focusListener, true);
    };
  }, [isMounted]);
  return blocks;
}

function getActiveBlockBreadcrumbs(blocks?: ActiveBlocks) {
  if (blocks) {
    let result: { label: string; href: string; uuid: string }[] = [];
    const [page, ...parentBlocks] = blocks;
    const pageHref = `#/page/${page.name}`;
    result.push({
      label: getBlockLabel(page),
      href: pageHref,
      uuid: page.uuid,
    });
    parentBlocks.forEach((block) => {
      result.push({
        label: getBlockLabel(block),
        href: `#/page/${block.uuid}`,
        uuid: block.uuid,
      });
    });
    return result;
  }
  return;
}

function renderBreadcrumbs(
  breadcrumbs: NonNullable<ReturnType<typeof getActiveBlockBreadcrumbs>>
) {
  return breadcrumbs
    .map((breadcrumb) => {
      return `<a title="${breadcrumb.label}"
                 data-block-uuid="${breadcrumb.uuid}"
                 class="block-path-breadcrumb-fragment">
                 ${breadcrumb.label}
              </a>`;
    })
    .join("<span class='block-path-breadcrumb-fragment-separator'>🥙</span>");
}

// https://gist.github.com/wojtekmaj/fe811af47fad12a7265b6f7df1017c83
const findScrollContainer = (element: Element) => {
  if (!element) {
    return undefined;
  }

  let parent = element.parentElement;
  while (parent) {
    const { overflow } = window.getComputedStyle(parent);
    if (
      overflow
        .split(" ")
        .every((o) => ["scroll", "auto", "overlay"].includes(o))
    ) {
      return parent;
    }
    parent = parent.parentElement;
  }

  return document.documentElement;
};

const useSyncBlockPath = (blocks?: ActiveBlocks) => {
  React.useEffect(() => {
    const anchor = top.document.getElementById(BLOCK_PATH_ANCHOR_ID);
    if (anchor) {
      const breadcrumbs = getActiveBlockBreadcrumbs(blocks);
      if (breadcrumbs) {
        anchor.innerHTML = renderBreadcrumbs(breadcrumbs);
        anchor.style.opacity = "1";
      } else {
        anchor.style.opacity = "0.7";
      }
      const listenAnchorClick = async (e: MouseEvent) => {
        if ((e.target as Element)?.getAttribute?.("data-block-uuid")) {
          // @ts-expect-error
          const uuid: string = e.target.getAttribute("data-block-uuid");
          const topElement$ = top.document.querySelector("h1.title")!;
          const toElement$ =
            uuid === breadcrumbs?.[0].uuid
              ? Array.from(top.document.querySelectorAll("h1.title")).find(
                  (t$) => t$.textContent === breadcrumbs?.[0].label
                )!
              : top.document.querySelector(`[blockid="${uuid}"]`);
          if (toElement$) {
            const distance =
              toElement$.getBoundingClientRect().y -
              topElement$.getBoundingClientRect().y -
              30;
            findScrollContainer(toElement$)?.scrollTo({
              top: distance,
              behavior: "smooth",
            });
            if (breadcrumbs?.[breadcrumbs?.length - 1].uuid !== uuid) {
              setTimeout(() => {
                logseq.Editor.editBlock(uuid);
              }, 500);
            }
          }
        }
      };
      anchor.addEventListener("click", listenAnchorClick);
      return () => {
        anchor.style.opacity = "0.7";
        anchor.removeEventListener("click", listenAnchorClick);
      };
    }
  }, [blocks]);
};

export function BlockPathRenderer(_props: any) {
  const blocks = useActiveBlocks();
  useSyncBlockPath(blocks);
  return null;
}
