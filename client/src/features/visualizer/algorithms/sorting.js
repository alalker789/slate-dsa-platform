// Pure step generators ported from the original Slate prototype.
// Each returns an array of frames the player can scrub through. No DOM, fully testable.
import { range } from "./helpers.js";
function mkStep(a, extra) {
  return Object.assign(
    {
      arr: a.slice(),
      compare: [],
      swap: [],
      sorted: [],
      pivot: null,
      line: 0,
      note: "",
    },
    extra,
  );
}

function bubbleSteps(input) {
  const a = input.slice(),
    n = a.length,
    steps = [];
  const done = [];
  steps.push(
    mkStep(a, {
      line: 0,
      note: "Starting bubble sort — repeatedly swap neighbours that are out of order.",
    }),
  );
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - 1 - i; j++) {
      steps.push(
        mkStep(a, {
          compare: [j, j + 1],
          sorted: done.slice(),
          line: 3,
          note: `Compare a[${j}]=${a[j]} and a[${j + 1}]=${a[j + 1]}.`,
        }),
      );
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        steps.push(
          mkStep(a, {
            swap: [j, j + 1],
            sorted: done.slice(),
            line: 4,
            note: `Out of order — swap them.`,
          }),
        );
      }
    }
    done.push(n - 1 - i);
    steps.push(
      mkStep(a, {
        sorted: done.slice(),
        line: 1,
        note: `Index ${n - 1 - i} is now in its final spot.`,
      }),
    );
  }
  done.push(0);
  steps.push(
    mkStep(a, {
      sorted: range(0, n - 1),
      line: 5,
      note: "Array is sorted.",
    }),
  );
  return steps;
}
function selectionSteps(input) {
  const a = input.slice(),
    n = a.length,
    steps = [];
  const done = [];
  steps.push(
    mkStep(a, {
      line: 0,
      note: "Starting selection sort — find the minimum, then place it.",
    }),
  );
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    steps.push(
      mkStep(a, {
        compare: [i],
        sorted: done.slice(),
        line: 2,
        note: `Assume index ${i} is the minimum for now.`,
      }),
    );
    for (let j = i + 1; j < n; j++) {
      steps.push(
        mkStep(a, {
          compare: [min, j],
          sorted: done.slice(),
          line: 4,
          note: `Is a[${j}]=${a[j]} smaller than current min a[${min}]=${a[min]}?`,
        }),
      );
      if (a[j] < a[min]) {
        min = j;
        steps.push(
          mkStep(a, {
            compare: [min],
            sorted: done.slice(),
            line: 5,
            note: `New minimum at index ${min}.`,
          }),
        );
      }
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      steps.push(
        mkStep(a, {
          swap: [i, min],
          sorted: done.slice(),
          line: 6,
          note: `Swap into place at index ${i}.`,
        }),
      );
    }
    done.push(i);
    steps.push(
      mkStep(a, {
        sorted: done.slice(),
        line: 0,
        note: `Index ${i} finalized.`,
      }),
    );
  }
  done.push(n - 1);
  steps.push(
    mkStep(a, {
      sorted: range(0, n - 1),
      line: 7,
      note: "Array is sorted.",
    }),
  );
  return steps;
}
function insertionSteps(input) {
  const a = input.slice(),
    n = a.length,
    steps = [];
  steps.push(
    mkStep(a, {
      sorted: [0],
      line: 0,
      note: "First element counts as a sorted list of one.",
    }),
  );
  for (let i = 1; i < n; i++) {
    const key = a[i];
    let j = i - 1;
    steps.push(
      mkStep(a, {
        compare: [i],
        sorted: range(0, i - 1),
        line: 2,
        note: `Pick up a[${i}]=${key} to insert.`,
      }),
    );
    while (j >= 0 && a[j] > key) {
      steps.push(
        mkStep(a, {
          compare: [j, j + 1],
          sorted: range(0, i - 1),
          line: 4,
          note: `${a[j]} > ${key}, shift it right.`,
        }),
      );
      a[j + 1] = a[j];
      j--;
      steps.push(
        mkStep(a, {
          swap: [j + 1],
          sorted: range(0, i - 1),
          line: 5,
          note: `Shifted.`,
        }),
      );
    }
    a[j + 1] = key;
    steps.push(
      mkStep(a, {
        sorted: range(0, i),
        line: 7,
        note: `Placed ${key} at index ${j + 1}.`,
      }),
    );
  }
  steps.push(
    mkStep(a, {
      sorted: range(0, n - 1),
      line: 8,
      note: "Array is sorted.",
    }),
  );
  return steps;
}
function mergeSteps(input) {
  const a = input.slice(),
    n = a.length,
    steps = [];
  steps.push(
    mkStep(a, {
      line: 0,
      note: "Starting merge sort — split in half recursively, then merge sorted halves.",
    }),
  );
  function sort(l, r) {
    if (l >= r) return;
    const m = Math.floor((l + r) / 2);
    sort(l, m);
    sort(m + 1, r);
    merge(l, m, r);
  }
  function merge(l, m, r) {
    const left = a.slice(l, m + 1),
      right = a.slice(m + 1, r + 1);
    let i = 0,
      j = 0,
      k = l;
    steps.push(
      mkStep(a, {
        compare: range(l, r),
        line: 5,
        note: `Merging [${l}..${m}] with [${m + 1}..${r}].`,
      }),
    );
    while (i < left.length && j < right.length) {
      if (left[i] <= right[j]) {
        a[k] = left[i];
        i++;
      } else {
        a[k] = right[j];
        j++;
      }
      steps.push(
        mkStep(a, {
          swap: [k],
          compare: range(l, r),
          line: 5,
          note: `Write ${a[k]} at index ${k}.`,
        }),
      );
      k++;
    }
    while (i < left.length) {
      a[k] = left[i];
      steps.push(
        mkStep(a, {
          swap: [k],
          compare: range(l, r),
          line: 5,
          note: `Write remaining ${a[k]}.`,
        }),
      );
      i++;
      k++;
    }
    while (j < right.length) {
      a[k] = right[j];
      steps.push(
        mkStep(a, {
          swap: [k],
          compare: range(l, r),
          line: 5,
          note: `Write remaining ${a[k]}.`,
        }),
      );
      j++;
      k++;
    }
  }
  sort(0, n - 1);
  steps.push(
    mkStep(a, {
      sorted: range(0, n - 1),
      line: 0,
      note: "Array is sorted.",
    }),
  );
  return steps;
}
function quickSteps(input) {
  const a = input.slice(),
    n = a.length,
    steps = [];
  steps.push(
    mkStep(a, {
      line: 0,
      note: "Starting quicksort — pick a pivot, partition around it, recurse.",
    }),
  );
  function qs(lo, hi) {
    if (lo > hi) return;
    if (lo === hi) {
      steps.push(
        mkStep(a, {
          sorted: [lo],
          line: 1,
          note: `Single element at ${lo} is trivially sorted.`,
        }),
      );
      return;
    }
    const p = partition(lo, hi);
    qs(lo, p - 1);
    qs(p + 1, hi);
  }
  function partition(lo, hi) {
    const pivot = a[hi];
    let i = lo - 1;
    steps.push(
      mkStep(a, {
        pivot: hi,
        line: 7,
        note: `Pivot is a[${hi}]=${pivot}.`,
      }),
    );
    for (let j = lo; j < hi; j++) {
      steps.push(
        mkStep(a, {
          pivot: hi,
          compare: [j],
          line: 9,
          note: `Compare a[${j}]=${a[j]} with pivot ${pivot}.`,
        }),
      );
      if (a[j] < pivot) {
        i++;
        [a[i], a[j]] = [a[j], a[i]];
        steps.push(
          mkStep(a, {
            pivot: hi,
            swap: [i, j],
            line: 10,
            note: `Smaller than pivot — move it left.`,
          }),
        );
      }
    }
    [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
    steps.push(
      mkStep(a, {
        swap: [i + 1, hi],
        sorted: [i + 1],
        line: 11,
        note: `Pivot settles at index ${i + 1}.`,
      }),
    );
    return i + 1;
  }
  qs(0, n - 1);
  steps.push(
    mkStep(a, {
      sorted: range(0, n - 1),
      line: 0,
      note: "Array is sorted.",
    }),
  );
  return steps;
}


export const sortGenerators = { bubble: bubbleSteps, selection: selectionSteps, insertion: insertionSteps, merge: mergeSteps, quick: quickSteps };
