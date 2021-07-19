import "@logseq/libs";
import "virtual:windi.css";
import "virtual:windi-devtools";

import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import { WORD_COUNT_ANCHOR_ID } from "./utils";

const pluginId = 'pengx17:logseq-random-tools';

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
  top[`${pluginId}-loaded`] = true;


  logseq.provideStyle(css`
    .image-resize img {
      cursor: pointer;
    }

    span#${WORD_COUNT_ANCHOR_ID} {
      padding: 0.2em 0.4em;
      font-size: 12px;
      color: var(--ct-page-font-color);
      border-radius: 2px;
      box-shadow: 0 0 1px;
      white-space: nowrap;
      align-items: center;
      position: relative;
      top: -2px;
      display: inline-flex;
      align-items: center;
    }

    span#${WORD_COUNT_ANCHOR_ID} > span {
      margin-left: 0.5em;
    }
  `);

  logseq.App.registerUIItem('toolbar', {
    key: "word-count-label",
    template: `<span id="${WORD_COUNT_ANCHOR_ID}" class="color-level">Words: <span>-</span></span>`,
  });
}

logseq.ready(createModel()).then(main).catch(console.error);

// @ts-expect-error
if (top[`${pluginId}-loaded`]) {
  top.location.reload();
}
