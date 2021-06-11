import {
  BlockEntity,
  BlockUUIDTuple,
  PageEntity,
} from "@logseq/libs/dist/LSPlugin";
import React from "react";
import { useEditingPageAndBlock, useEditingPageTree } from "./utils";

function isBlockEntity(
  maybeBlockEntity: BlockEntity | BlockUUIDTuple | PageEntity
): maybeBlockEntity is BlockEntity {
  // PageEntity does not have "page" property
  return "page" in maybeBlockEntity;
}

const flatBlock = (block: BlockEntity): string[] => {
  return [
    block.content,
    ...(block.children ?? []).filter(isBlockEntity).flatMap(flatBlock),
  ];
};

const useEditingPageContent = () => {
  const tree = useEditingPageTree(top.document.body);
  return tree?.flatMap(flatBlock).join('\n')
};

export const WordCount = () => {
  const content = useEditingPageContent();
  console.log(content);
  return <div>TODO</div>;
};
