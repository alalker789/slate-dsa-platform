// Immutable BST + traversal frames. Node ids are the values themselves (duplicates are ignored).

export const insertNode = (node, v) =>
  !node ? { value: v, left: null, right: null }
  : v === node.value ? node
  : v < node.value ? { ...node, left: insertNode(node.left, v) }
  : { ...node, right: insertNode(node.right, v) };

export const buildTree = (values) => values.reduce(insertNode, null);

export function traversalOrder(root, kind) {
  const out = [];
  const go = {
    inorder: (n) => n && (go.inorder(n.left), out.push(n), go.inorder(n.right)),
    preorder: (n) => n && (out.push(n), go.preorder(n.left), go.preorder(n.right)),
    postorder: (n) => n && (go.postorder(n.left), go.postorder(n.right), out.push(n)),
  };
  if (kind === "levelorder") {
    const q = root ? [root] : [];
    while (q.length) {
      const n = q.shift();
      out.push(n);
      n.left && q.push(n.left);
      n.right && q.push(n.right);
    }
  } else go[kind](root);
  return out;
}

export function treeSteps(root, kind) {
  const order = traversalOrder(root, kind);
  return order.map((n, i) => ({
    current: n.value,
    visited: order.slice(0, i + 1).map((x) => x.value),
    note: `Visiting node ${n.value}.`,
  }));
}

/** In-order x position, depth as y — simple and stable for a BST. */
export function layoutTree(root) {
  const pos = {};
  let counter = 0;
  (function go(n, depth) {
    if (!n) return;
    go(n.left, depth + 1);
    pos[n.value] = { x: counter++, y: depth };
    go(n.right, depth + 1);
  })(root, 0);
  return pos;
}
