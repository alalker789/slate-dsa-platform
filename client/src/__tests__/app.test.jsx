import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LangProvider } from "../context/LangContext.jsx";
import Learn from "../pages/Learn.jsx";
import Review from "../pages/Review.jsx";
import Heatmap from "../components/Heatmap.jsx";
import { ProgressProvider } from "../context/ProgressContext.jsx";
import { AuthProvider } from "../context/AuthContext.jsx";
import { SocketProvider } from "../context/SocketContext.jsx";

const LIST = [
  { slug: "bubble", category: "sorting", kind: "array", name: "Bubble Sort", summary: "s" },
  { slug: "bfs", category: "graph", kind: "graph", name: "Breadth-first search", summary: "s" },
  { slug: "inorder", category: "tree", kind: "tree", name: "In-order", summary: "s" },
];
const DETAIL = (slug) => ({ algorithm: { ...LIST.find((a) => a.slug === slug), complexity: [{ k: "Best", v: "O(n)" }], code: { pseudo: ["line one", "line two"], c: ["int c;"], cpp: ["int cpp;"], java: ["int j;"] } } });
const CARDS = [
  { id: "c1", cat: "Sorting", front: "Q1?", back: "A1", state: "new" },
  { id: "c2", cat: "Sorting", front: "Q2?", back: "A2", state: "new" },
];

let calls;
beforeEach(() => {
  localStorage.clear();
  calls = [];
  globalThis.fetch = vi.fn(async (url, opts = {}) => {
    calls.push(`${opts.method || "GET"} ${url}`);
    const json = (b) => ({ ok: true, status: 200, json: async () => b });
    if (url === "/api/algorithms") return json({ algorithms: LIST });
    if (url.startsWith("/api/algorithms/") && url.endsWith("/complete")) return json({ firstTime: true, gained: 20 });
    if (url.startsWith("/api/algorithms/")) return json(DETAIL(url.split("/")[3]));
    if (url.startsWith("/api/cards/categories")) return json({ categories: ["Sorting"] });
    if (url.startsWith("/api/cards/session")) return json({ cards: CARDS });
    if (url.includes("/review")) return json({ gained: 10, xp: 10, level: 1, interval: 1 });
    return json({});
  });
});

const wrap = (ui, path) => (
  <MemoryRouter initialEntries={[path]}>
    <AuthProvider><SocketProvider><ProgressProvider><LangProvider>
      <Routes><Route path="/learn/:slug?" element={ui} /><Route path="/review" element={ui} /></Routes>
    </LangProvider></ProgressProvider></SocketProvider></AuthProvider>
  </MemoryRouter>
);

describe("Learn page", () => {
  it("lists algorithms from the API and renders the array visualizer with code + complexity", async () => {
    const { container } = render(wrap(<Learn />, "/learn/bubble"));
    await screen.findByRole("heading", { name: "Bubble Sort" });
    expect(screen.getByText("Sorting")).toBeTruthy();
    expect(container.querySelectorAll("svg.array-svg rect").length).toBe(12); // default array size
    expect(screen.getByText("line one")).toBeTruthy();
    expect(screen.getByText("O(n)")).toBeTruthy();
  });

  it("stepping advances the narration and switching language swaps the code", async () => {
    const { container } = render(wrap(<Learn />, "/learn/bubble"));
    await screen.findByRole("heading", { name: "Bubble Sort" });
    fireEvent.click(screen.getByText("Step ▶"));
    expect(container.querySelector(".progress-line").textContent).toContain("Step 2 /");
    fireEvent.click(screen.getByText("Java"));
    expect(screen.getByText("int j;")).toBeTruthy();
  });

  it("awards XP once when a run reaches the end", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    render(wrap(<Learn />, "/learn/inorder"));
    await screen.findByRole("heading", { name: "In-order" });
    fireEvent.click(screen.getByText("▶ Traverse"));
    await act(async () => { await vi.advanceTimersByTimeAsync(800); });
    await act(async () => { await vi.advanceTimersByTimeAsync(10_000); });
    await waitFor(() => expect(calls.filter((c) => c.includes("/complete")).length).toBe(1));
    vi.useRealTimers();
  });

  it("renders the graph visualizer", async () => {
    const { container } = render(wrap(<Learn />, "/learn/bfs"));
    await screen.findByRole("heading", { name: "Breadth-first search" });
    expect(container.querySelectorAll(".graph-node").length).toBe(7);
  });
});

describe("Review page", () => {
  it("flips a card, rates it, and moves to the next one", async () => {
    render(wrap(<Review />, "/review"));
    await screen.findByText("Q1?");
    fireEvent.click(screen.getByText("Q1?"));
    fireEvent.click(await screen.findByText(/^Good/));
    await screen.findByText("Q2?");
    expect(calls).toContain("POST /api/cards/c1/review");
  });

  it("re-queues a card rated Again at the end of the session", async () => {
    render(wrap(<Review />, "/review"));
    await screen.findByText("Q1?");
    fireEvent.click(screen.getByText("Q1?"));
    fireEvent.click(await screen.findByText(/^Again/));
    await screen.findByText("Q2?");
    expect(document.body.textContent).toContain("2 left");
  });
});

describe("Heatmap", () => {
  it("renders 13 weeks of cells and colours active days", () => {
    const today = new Date().toISOString().slice(0, 10);
    const { container } = render(<Heatmap activity={{ [today]: 20 }} />);
    expect(container.querySelectorAll(".heat").length).toBe(91);
    expect(container.querySelector(".heat-4")).toBeTruthy();
  });
});
