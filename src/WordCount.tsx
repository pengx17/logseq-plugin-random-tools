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

type Fragment =
  | ["Plain", string]
  | ["Link", { url: [string, any]; fullText: string }]
  | ["Macro", any]
  | ["Code", any];

const flatFragments = (pair: Fragment): string[] => {
  if (!["Plain", "Link", "Code"].includes(pair[0])) {
    return [];
  } else if (typeof pair[1] === "string") {
    return [pair[1]];
  } else if (pair[0] === "Link") {
    if (pair[1].url[0] === "Search") {
      return [pair[1].url[1]];
    } else {
      return ["link"];
    }
  }
  return [];
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
    const count = wordsCount(texts?.join(" "));
    const anchor = top.document.getElementById(WORD_COUNT_ANCHOR_ID);
    if (anchor) {
      if (count) {
        anchor.innerHTML = `Words: ${count}`;
        anchor.style.opacity = '1';
      } else {
        anchor.innerHTML = ``;
        anchor.style.opacity = '0';
      }
    } 
  }, [texts]);
  return null;
};
