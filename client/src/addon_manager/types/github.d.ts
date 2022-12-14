type TreeNode = {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size: number;
  url: string;
};

export type TreeResponse = {
  sha: string;
  url: string;
  tree: TreeNode[];
  truncated: boolean;
};
