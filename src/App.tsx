import React from "react";
import { useKey } from "react-use";
import { FullscreenImage } from "./FullscreenImage";

function App() {
  useKey(
    "Escape",
    () => {
      logseq.hideMainUI();
    },
    { options: true }
  );
  return (
    <>
      <FullscreenImage />
    </>
  );
}

export default App;
