import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { BLOCK_PATH_ANCHOR_ID } from "./PathRender";

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

  logseq.provideStyle(css`
    .image-resize img {
      cursor: pointer;
    }

    span#${BLOCK_PATH_ANCHOR_ID} {
      position: absolute;
      top: calc(100% + 0.25em);
      left: 0.25em;
      padding: 0.25em 0.5em;
      font-size: 12px;
      color: var(--ct-page-font-color);
      border-radius: 2px;
      box-shadow: 0 0 1px;
      display: none;
    }

    span#random-tools-block-path * {
      font-size: 12px;
    }

    span#random-tools-block-path > * {
      vertical-align: middle;
    }

    span#random-tools-block-path a.block-path-breadcrumb-fragment {
      color: var(--ls-link-ref-text-color);
      display: inline-block;
      white-space: nowrap;
      font-weight: 600;
      max-width: 200px;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    span#random-tools-block-path .block-path-breadcrumb-fragment-separator {
      font-weight: 600; 
    }
  `);

  logseq.provideUI({
    key: "block-path",
    path: "#head.cp__header",
    template: `<span id="${BLOCK_PATH_ANCHOR_ID}" class="color-level"></span>`,
  });
}

logseq.ready(createModel()).then(main).catch(console.error);
