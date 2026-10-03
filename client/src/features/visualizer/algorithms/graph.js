// Graph traversal frames. The graph is passed in (adjacency list) instead of living in a global.
export const DEFAULT_GRAPH = { A: ["B", "C"], B: ["A", "D", "E"], C: ["A", "F"], D: ["B"], E: ["B", "F"], F: ["C", "E", "G"], G: ["F"] };

/** Returns a new graph with an undirected edge u-v added (never mutates the input). */
export function withEdge(graph, u, v) {
  if (!u || !v || u === v) return graph;
  const g = Object.fromEntries(Object.entries(graph).map(([k, n]) => [k, [...n]]));
  g[u] ??= []; g[v] ??= [];
  if (!g[u].includes(v)) g[u].push(v);
  if (!g[v].includes(u)) g[v].push(u);
  return g;
}

export function bfsSteps(graph, start) {
  const steps = [];
  const visited = new Set([start]);
  const q = [start];
  steps.push({
    current: null,
    visited: [...visited],
    frontier: [...q],
    note: `Start at ${start}. Add it to the queue.`,
  });
  while (q.length) {
    const cur = q.shift();
    steps.push({
      current: cur,
      visited: [...visited],
      frontier: [...q],
      note: `Dequeue and visit ${cur}.`,
    });
    for (const nb of graph[cur] || []) {
      if (!visited.has(nb)) {
        visited.add(nb);
        q.push(nb);
        steps.push({
          current: cur,
          visited: [...visited],
          frontier: [...q],
          activeEdge: [cur, nb],
          note: `${nb} is new — mark visited, enqueue it.`,
        });
      }
    }
  }
  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    note: "Breadth-first search complete.",
  });
  return steps;
}
export function dfsSteps(graph, start) {
  const steps = [];
  const visited = new Set();
  const stack = [start];
  steps.push({
    current: null,
    visited: [],
    frontier: [...stack],
    note: `Start at ${start}. Push it to the stack.`,
  });
  while (stack.length) {
    const cur = stack.pop();
    if (visited.has(cur)) continue;
    visited.add(cur);
    steps.push({
      current: cur,
      visited: [...visited],
      frontier: [...stack],
      note: `Pop and visit ${cur}.`,
    });
    const nbs = (graph[cur] || []).slice().reverse();
    for (const nb of nbs) {
      if (!visited.has(nb)) {
        stack.push(nb);
        steps.push({
          current: cur,
          visited: [...visited],
          frontier: [...stack],
          activeEdge: [cur, nb],
          note: `Push unvisited neighbor ${nb}.`,
        });
      }
    }
  }
  steps.push({
    current: null,
    visited: [...visited],
    frontier: [],
    note: "Depth-first search complete.",
  });
  return steps;
}
