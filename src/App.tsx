import React from "react";
import { useKey } from "react-use";
import { FullscreenImage } from "./FullscreenImage";
import { BlockPathRenderer } from "./PathRender";

function App() {
  useKey("Escape", () => logseq.hideMainUI(), { options: true });
  return (
    <>
      <FullscreenImage />
      <BlockPathRenderer />
    </>
  );
}

export default App;
