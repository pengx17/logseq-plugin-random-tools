import "@logseq/libs";
import "virtual:windi.css";
import "virtual:windi-devtools";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BLOCK_PATH_ANCHOR_ID, WORD_COUNT_ANCHOR_ID } from "./utils";

// @ts-expect-error
const css = (t, ...args) => String.raw(t, ...args);

function createModel() {
  return {
    show() {
      logseq.showMainUI();
    },
  };
}

function main() {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("app")
  );

  logseq.setMainUIInlineStyle({
    zIndex: 11,
  });

  // @ts-expect-error
  top['pluginId-loaded'] = true;

  const pluginId = logseq.baseInfo.id;

  logseq.provideStyle(css`
    .image-resize img {
      cursor: pointer;
    }

    span#${BLOCK_PATH_ANCHOR_ID} {
      position: absolute;
      z-index: 200;
      top: 40px;
      left: 0.25em;
      max-width: calc(100vw - 10px);
      padding: 0.25em 0.5em;
      font-size: 12px;
      color: var(--ct-page-font-color);
      border-radius: 2px;
      box-shadow: 0 0 1px;
      opacity: 0;
      display: flex;
      align-items: center;
    }

    div[data-injected-ui=word-count-label-${pluginId}] {
      display: inline-flex;
      align-items: center;
      font-weight: 500;
      padding: 0 5px;
      position: relative;
      margin-top: .25rem;
    }

    span#${WORD_COUNT_ANCHOR_ID} {
      padding: 0 0.5em;
      font-size: 12px;
      color: var(--ct-page-font-color);
      border-radius: 2px;
      box-shadow: 0 0 1px;
      display: inline-flex;
      white-space: nowrap;
      opacity: 0;
      align-items: center;
    }

    span#random-tools-block-path * {
      font-size: 12px;
    }

    span#random-tools-block-path a.block-path-breadcrumb-fragment {
      color: var(--ls-link-ref-text-color);
      display: inline-block;
      white-space: nowrap;
      font-weight: 600;
      max-width: 400px;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    span#random-tools-block-path .block-path-breadcrumb-fragment-separator {
      font-weight: 600;
      margin: 0 0.25em;
    }
  `);

  logseq.provideUI({
    key: "block-path",
    path: "#app-container",
    template: `<span id="${BLOCK_PATH_ANCHOR_ID}" class="color-level"></span>`,
  });

  logseq.provideUI({
    key: "word-count-label",
    path: "#search",
    template: `<span id="${WORD_COUNT_ANCHOR_ID}" class="color-level"></span>`,
  });
}

logseq.ready(createModel()).then(main).catch(console.error);

// @ts-expect-error
if (top['pluginId-loaded']) {
  top.location.reload();
}
