import {
  BlockEntity,
  BlockUUIDTuple,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin";
import * as React from "react";
import { useMountedState } from "react-use";
import { BLOCK_PATH_ANCHOR_ID, LEFT_CONTAINER_ID } from "./utils";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple | PageEntity
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
}

async function getBlockAncestors(
  block: BlockEntity
): Promise<[PageEntity, ...BlockEntity[]] | null> {
  function run(
    roots: BlockEntity[],
    currentBlock: BlockEntity,
    parents: BlockEntity[] = []
  ): BlockEntity[] | null {
    if (roots.some((b) => b.id === currentBlock.id)) {
      return parents;
    } else if (roots.length > 0) {
      for (let b of roots) {
        const newParents = [...parents, b];
        const candidates = run(
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
  const page = await logseq.Editor.getPage(block.page.id);
  if (page) {
    const rootPageTree = await logseq.Editor.getPageBlocksTree(page.name);
    if (rootPageTree) {
      const parentBlocks = run(rootPageTree, block);
      if (parentBlocks) {
        return [page, ...parentBlocks];
      }
    }
  }
  return null;
}

async function getCurrentBlockAndAncestors() {
  const block = await logseq.Editor.getCurrentBlock();
  if (block) {
    const parents = await getBlockAncestors(block);
    if (parents) {
      return [...parents, block] as const;
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

function useCurrentBlockAndAncestors(rootElement: Element | null) {
  const [blockAndParents, setState] =
    React.useState<ActiveBlocks | undefined>(undefined);
  const isMounted = useMountedState();
  React.useEffect(() => {
    const focusListener = async () => {
      const results = await getCurrentBlockAndAncestors();
      if (results) {
        setState(results);
      }
    };
    // TODO: cannot remove listener in HMR mode
    logseq.App.onRouteChanged(() => {
      if (isMounted()) {
        setState(undefined);
      }
    });

    rootElement?.addEventListener("focus", focusListener, true);
    return () => {
      rootElement?.removeEventListener("focus", focusListener, true);
    };
  }, [isMounted, rootElement]);

  return blockAndParents;
}

function getCurrentBlockBreadcrumbs(blocks?: ActiveBlocks) {
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
  breadcrumbs: NonNullable<ReturnType<typeof getCurrentBlockBreadcrumbs>>
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

const useSyncBlockPath = (
  rootElement: Element | null,
  blocks?: ActiveBlocks
) => {
  React.useEffect(() => {
    const anchor = top.document.getElementById(BLOCK_PATH_ANCHOR_ID);
    if (anchor && rootElement) {
      const breadcrumbs = getCurrentBlockBreadcrumbs(blocks);
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
          const topElement$ = rootElement.querySelector("h1.title")!;
          const toElement$ =
            uuid === breadcrumbs?.[0].uuid
              ? Array.from(rootElement.querySelectorAll("h1.title")).find(
                  (t$) => t$.textContent === breadcrumbs?.[0].label
                )!
              : rootElement.querySelector(`[blockid="${uuid}"]`);
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
  }, [blocks, rootElement]);
};

export function BlockPathRenderer() {
  const leftCurrentBlocks = useCurrentBlockAndAncestors(
    top.document.getElementById(LEFT_CONTAINER_ID)
  );
  useSyncBlockPath(
    top.document.getElementById(LEFT_CONTAINER_ID),
    leftCurrentBlocks
  );
  return null;
}
