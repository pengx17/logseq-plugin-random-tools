import { gql, GraphQLClient } from "graphql-request";
import React, { useState } from "react";

const graphQLClient = new GraphQLClient("https://api.github.com/graphql", {
  headers: {
    authorization: "token xxx",
  },
});

const githubRepoRegex = /https\:\/\/github\.com\/([\w,\-,\_]+)\/([\w,\-,\_]+)/i;
interface RepoInfo {
  user: string;
  repo: string;
}

const useActive = (onPreview: (info?: RepoInfo) => void) => {
  const listener = (e: MouseEvent) => {
    if ((e.target as any)?.tagName === "A" /* && e.altKey */) {
      const anchor = e.target as HTMLAnchorElement;
      if (
        anchor.classList.contains("external-link") &&
        githubRepoRegex.test(anchor.href)
      ) {
        const [, user, repo] = anchor.href.match(githubRepoRegex)!;
        onPreview({ user, repo });
      }
    } else {
      onPreview();
    }
  };
  React.useEffect(() => {
    window.top.document.body.addEventListener("mousemove", listener);
    return () => {
      window.top.document.body.removeEventListener("mousemove", listener);
    };
  }, []);
};

const useRepoImage = (repoInfo?: RepoInfo) => {
  const [ogImage, setOGImage] = useState<string | undefined>();
  React.useEffect(() => {
    let canceled = false;
    if (repoInfo) {
      const query = gql`
      {
        repository(owner: "${repoInfo.user}", name: "${repoInfo.repo}") {
          openGraphImageUrl
        }
      }
    `;
      graphQLClient.request(query).then((repo) => {
        if (canceled) {
          return;
        }
        setOGImage(repo.repository.openGraphImageUrl);
      });
    } else {
      setOGImage(undefined);
    }
    return () => {
      canceled = true;
    };
  }, [repoInfo]);
  return ogImage;
};

export function GithubPreview() {
  const [repoInfo, setRepoInfo] = useState<RepoInfo | undefined>(undefined);
  useActive((cur) => {
    if (cur) {
      logseq.showMainUI();
    }
    setRepoInfo((prev) => {
      if (prev?.repo === cur?.repo && prev?.user === cur?.user) {
        return prev;
      } else {
        return cur;
      }
    });
  });

  const repoImage = useRepoImage(repoInfo);

  if (repoInfo) {
    if (repoImage) {
      return <img src={repoImage} />;
    } else {
      return <div>Loading OGImage</div>;
    }
  }
  return null;
}
