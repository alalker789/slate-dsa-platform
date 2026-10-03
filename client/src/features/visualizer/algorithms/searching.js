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
function linearSteps(input, target) {
  const a = input.slice(),
    steps = [];
  steps.push(
    mkStep(a, {
      line: 0,
      note: `Scanning left to right for ${target}.`,
    }),
  );
  for (let i = 0; i < a.length; i++) {
    steps.push(
      mkStep(a, {
        compare: [i],
        line: 2,
        note: `Check index ${i}: is ${a[i]} equal to ${target}?`,
      }),
    );
    if (a[i] === target) {
      steps.push(
        mkStep(a, {
          sorted: [i],
          line: 3,
          note: `Found ${target} at index ${i}.`,
        }),
      );
      return steps;
    }
  }
  steps.push(
    mkStep(a, { line: 4, note: `${target} is not in the array.` }),
  );
  return steps;
}
function binarySteps(input, target) {
  const a = input.slice().sort((x, y) => x - y),
    steps = [];
  let lo = 0,
    hi = a.length - 1;
  steps.push(
    mkStep(a, {
      line: 1,
      note: `Array sorted first. Searching for ${target} between index ${lo} and ${hi}.`,
    }),
  );
  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    steps.push(
      mkStep(a, {
        compare: [mid],
        line: 3,
        note: `Middle of [${lo},${hi}] is index ${mid}: a[${mid}]=${a[mid]}.`,
      }),
    );
    if (a[mid] === target) {
      steps.push(
        mkStep(a, {
          sorted: [mid],
          line: 4,
          note: `Found ${target} at index ${mid}.`,
        }),
      );
      return steps;
    } else if (a[mid] < target) {
      steps.push(
        mkStep(a, {
          compare: [mid],
          line: 6,
          note: `${a[mid]} < ${target} — search the right half.`,
        }),
      );
      lo = mid + 1;
    } else {
      steps.push(
        mkStep(a, {
          compare: [mid],
          line: 8,
          note: `${a[mid]} > ${target} — search the left half.`,
        }),
      );
      hi = mid - 1;
    }
  }
  steps.push(
    mkStep(a, { line: 10, note: `${target} is not in the array.` }),
  );
  return steps;
}

export const searchGenerators = { linear: linearSteps, binary: binarySteps };
