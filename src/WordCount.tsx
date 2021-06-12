import {
  BlockEntity,
  BlockUUIDTuple,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin";
import React, { useMemo } from "react";
// @ts-expect-error no types
import wordsCount from "words-count";
import { useEditingPageTree, WORD_COUNT_ANCHOR_ID } from "./utils";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple | PageEntity
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
}

type ListFragment = { content: Fragment[]; items: ListFragment[] };

type Fragment =
  | ["Plain", string]
  | ["Link", { url: [string, any]; label: [Fragment]; fullText: string }]
  | ["Macro", any]
  | ["Code", any]
  | ["Paragraph", Fragment[]]
  | ["List", ListFragment[]];

// This is purely coded from my observation. May need to refer to mldoc later.
const flatFragments = (pair: Fragment): string[] => {
  if (pair[0] === "Paragraph") {
    return pair[1].flatMap(flatFragments);
  }
  if (pair[0] === "List") {
    return pair[1].flatMap(unnestListFragment);
  }
  if (!["Plain", "Link", "Code"].includes(pair[0])) {
    return [];
  } else if (typeof pair[1] === "string") {
    return [pair[1]];
  } else if (pair[0] === "Link") {
    if (pair[1].url[0] === "File") {
      return [];
    } else if (pair[1].label[0][1]) {
      return flatFragments(pair[1].label[0]);
    }
    if (pair[1].url[0] === "Search") {
      return [pair[1].url[1]];
    }
    return [pair[1].fullText];
  }
  return [];
};

const unnestListFragment = (item: ListFragment): string[] => {
  return [
    ...item.content.flatMap(flatFragments),
    ...item.items.flatMap(unnestListFragment),
  ];
};

const flatBlock = (block: BlockEntity): string[] => {
  return [
    ...[...(block.title ?? []), ...(block.body ?? [])].flatMap(flatFragments),
    ...(block.children ?? []).filter(isBlockEntity).flatMap(flatBlock),
  ];
};

const useEditingPageContent = () => {
  const tree = useEditingPageTree(top.document.body);
  return useMemo(() => [tree, tree?.flatMap(flatBlock)], [tree]);
};

export const WordCount = () => {
  const [_, texts] = useEditingPageContent();
  React.useEffect(() => {
    // words-count does not perform as good result as MS Word. E.g.,
    // "G6" will will be counted as 2
    // also there is no option to take punctuations into the counted numbers
    const count = wordsCount(texts?.join(" "), { punctuation: ["·"] });
    const anchor = top.document.getElementById(WORD_COUNT_ANCHOR_ID);
    if (anchor) {
      if (count) {
        anchor.innerHTML = `Words: ${count}`;
        anchor.style.opacity = "1";
      } else {
        anchor.innerHTML = ``;
        anchor.style.opacity = "0";
      }
    }
  }, [texts]);
  return null;
};
