import React from "react";
import { useKey } from "react-use";
import { FullscreenImage } from "./FullscreenImage";
import { BlockPathRenderer } from "./PathRender";
import { WordCount } from "./WordCount";

function App() {
  useKey("Escape", () => logseq.hideMainUI(), { options: true });
  return (
    <>
      <FullscreenImage />
      {/* <BlockPathRenderer /> */}
      {/* <WordCount /> */}
    </>
  );
}

export default App;
