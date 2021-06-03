import "@logseq/libs";
import "virtual:windi.css";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

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

    span#random-tools-block-path {
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
  `);

  logseq.provideUI({
    key: "block-path",
    path: "#head.cp__header",
    template: `<span id="random-tools-block-path" class="color-level"></span>`,
  });
}

logseq.ready(createModel()).then(main).catch(console.error);
