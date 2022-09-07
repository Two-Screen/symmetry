import {
  AnyObject,
  AnyArray,
  ArraySplice,
  ObjectPatchNested,
  ObjectPatchRemove,
  ObjectPatchSet,
  ObjectPatch,
  ArrayPatchNested,
  ArrayPatchSplice,
  ArrayPatch,
  OuterObjectPatch,
  OuterArrayPatch,
  OuterPatch,
} from "./types";

/**
 * Fix up some JavaScript types and values that are not JSON.
 *
 * This is not a 'deep' fix up, it only touches the immediate value. It's used
 * mainly to ensure diffing checks don't have unexpected results.
 *
 * This may still return undefined to signal the value is normally not
 * serialized at all.
 */
const normalizeJson = (val: any): any => {
  if (val instanceof Object) {
    // Call the `toJSON` method if it exists.
    if (typeof val.toJSON === "function") {
      val = val.toJSON();
    }
  }

  // Treat functions as undefined.
  if (typeof val === "function") {
    val = undefined;
  } else if (typeof val === "number") {
    // Special numbers serialize to null.
    if (val !== val || val === Infinity || val === -Infinity) {
      val = null;
    }
  }

  return val;
};

/**
 * Create a patch for changes between two values from `left` to `right`.
 *
 * This is an untyped variant. If you know the value's type, you should use
 * `createObjectPatch` or `createArrayPatch` instead.
 */
export const createPatch = (left: any, right: any): OuterPatch => {
  left = normalizeJson(left);
  right = normalizeJson(right);
  return createPatchNormalized(left, right);
};

const createPatchNormalized = (left: any, right: any): OuterPatch => {
  // Treat undefined as null.
  if (left === undefined) {
    left = null;
  }
  if (right === undefined) {
    right = null;
  }

  // Identical, don't even need to descend.
  if (left === right) {
    return "none";
  }

  const leftIsObject = typeof left === "object" && left !== null;
  const rightIsObject = typeof right === "object" && right !== null;
  if (leftIsObject && rightIsObject) {
    const leftIsArray = Array.isArray(left);
    const rightIsArray = Array.isArray(right);

    if (leftIsArray && rightIsArray) {
      // Descend into two arrays.
      return createArrayPatch(left, right);
    } else if (!leftIsArray && !rightIsArray) {
      // Descend into two regular objects.
      return createObjectPatch(left, right);
    }
  }

  // Reset everything else.
  return "reset";
};

/**
 * Create a patch for changes between two objects from `left` to `right`.
 */
export const createObjectPatch = <T extends AnyObject>(
  left: T,
  right: T
): OuterObjectPatch<T> => {
  const r: ObjectPatchRemove<T> = [];
  const s: ObjectPatchSet<T> = {};
  const p: ObjectPatchNested<T> = {};
  let numAttrs = 0;
  let numSets = 0;
  let numPatches = 0;

  // Walk existing properties.
  for (const key in left) {
    const valLeft = normalizeJson(left[key]);
    if (valLeft === undefined) {
      continue;
    }

    numAttrs += 1;
    const valRight = normalizeJson(right[key]);

    // Attribute was removed.
    if (valRight === undefined) {
      r.push(key);
      continue;
    }

    // Diff and merge the resulting patch.
    const patch = createPatchNormalized(valLeft, valRight);
    if (patch === "reset") {
      s[key] = valRight;
      numSets += 1;
    } else if (patch !== "none") {
      p[key] = patch;
      numPatches += 1;
    }
  }

  // No partial changes, tell parent we should be reset.
  if (numAttrs && r.length + numSets === numAttrs) {
    return "reset";
  }

  // Find new properties.
  for (const key in right) {
    const valRight = normalizeJson(right[key]);
    if (valRight === undefined) {
      continue;
    }

    // Attributes was added to an empty object.
    if (numAttrs === 0) {
      return "reset";
    }

    // Attribute was added.
    const valLeft = normalizeJson(left[key]);
    if (valLeft === undefined) {
      s[key] = valRight;
      numSets += 1;
    }
  }

  // Build the patch object.
  const res: ObjectPatch<T> = { t: "o" };
  if (r.length) {
    res.r = r;
  }
  if (numSets) {
    res.s = s;
  }
  if (numPatches) {
    res.p = p;
  }
  if (!res.r && !res.s && !res.p) {
    return "none";
  } else {
    return res;
  }
};

/**
 * Create a patch for changes between two arrays from `left` to `right`.
 */
export const createArrayPatch = <T extends AnyArray>(
  left: T,
  right: T
): OuterArrayPatch<T> => {
  const lenLeft = left.length;
  const lenRight = right.length;
  let valLeft, valRight, idx;

  // Reduce the problem by trimming exact matches at the start.
  let start, firstDiff;
  for (start = 0; start < lenLeft && start < lenRight; start += 1) {
    const valLeft = normalizeJson(left[start]);
    const valRight = normalizeJson(right[start]);

    firstDiff = createPatchNormalized(valLeft, valRight);
    if (firstDiff !== "none") {
      break;
    }
  }

  // Short-circuit for exact matches, pushes and pops.
  if (start === lenLeft) {
    if (start === lenRight) {
      return "none";
    }

    const splice: ArraySplice<T> = [
      lenLeft,
      0,
      ...right.slice(start, lenRight).map(normalizeJson),
    ];
    return { t: "a", s: [splice] };
  } else if (start === lenRight) {
    const splice: ArraySplice<T> = [start, lenLeft - start];
    return { t: "a", s: [splice] };
  }

  // Reduce further by trimming exact matches at the end.
  let endLeft = lenLeft - 1;
  let endRight = lenRight - 1;
  let lastDiff;
  while (endLeft >= start && endRight >= start) {
    valLeft = normalizeJson(left[endLeft]);
    valRight = normalizeJson(right[endRight]);

    lastDiff = createPatchNormalized(valLeft, valRight);
    if (lastDiff !== "none") {
      break;
    }

    endLeft -= 1;
    endRight -= 1;
  }

  // Short-circuit for a single block of inserts or removes.
  if (endLeft < start) {
    const splice: ArraySplice<T> = [
      start,
      0,
      ...right.slice(start, endRight + 1).map(normalizeJson),
    ];
    return { t: "a", s: [splice] };
  } else if (endRight < start) {
    const splice: ArraySplice<T> = [start, endLeft - start + 1];
    return { t: "a", s: [splice] };
  }

  // For the remainder, do a full search. This implements the greedy
  // algorithm described in Myers' paper: http://xmailserver.org/diff2.pdf
  // FIXME: Look into the refinements described in the paper.
  const width = endLeft - start + 1;
  const height = endRight - start + 1;
  const size = width * height;
  const diag = width + 1;

  const diffs = new Array(size);
  diffs[0] = firstDiff;
  diffs[size - 1] = lastDiff;

  let v, d, k, x, y, diff;
  v = { 1: 0 }; // sentinel
  outer: for (d = 0; d < size; d++) {
    v = Object.create(v);

    for (k = -d; k <= d; k += 2) {
      // Decide on direction.
      if (k === -d || (k !== d && v[k - 1] < v[k + 1])) {
        x = v[k + 1];
      } else {
        x = v[k - 1] + 1;
      }
      y = x - k;

      // Exhaust diagonal until we hit a reset.
      idx = y * width + x;
      while (idx < size && x < width && y < height) {
        diff = diffs[idx];
        if (!diff) {
          valLeft = normalizeJson(left[start + x]);
          valRight = normalizeJson(right[start + y]);
          diff = diffs[idx] = createPatchNormalized(valLeft, valRight);
        }

        if (diff === "reset") {
          break;
        }

        x++;
        y++;
        idx += diag;
      }

      v[k] = x;

      if (x >= width && y >= height) {
        break outer;
      }
    }
  }

  // Collect patches and splices.
  let havePatches = false;
  const p: ArrayPatchNested<T> = {};
  const s: ArrayPatchSplice<T> = [];

  if (d === size) {
    if (start === 0 && width === lenLeft) {
      // If we splice the entire array, return a reset.
      return "reset";
    } else {
      // If we have no diagonals, we can optimize.
      s.push([start, width, ...right.slice(start, endRight + 1)]);
    }
  } else {
    k = width - height;
    let current: ArraySplice<T> = [NaN, NaN];
    while (d-- >= 0) {
      // Decide on direction.
      const isVert: boolean =
        v[k - 1] === undefined ||
        (v[k + 1] !== undefined && v[k - 1] < v[k + 1]);
      k = isVert ? k + 1 : k - 1;
      x = v[k];
      y = x - k;

      // Append the move to the current splice, or create a new one.
      // The `y !== -1` check skips the sentinel.
      const idxLeft = start + x;
      if (isVert) {
        // element added
        if (y !== -1) {
          if (current[0] === idxLeft) {
            valRight = normalizeJson(right[start + y]);
            current.splice(2, 0, valRight);
          } else {
            s.push((current = [idxLeft, 0, right[start + y]]));
          }
        }
        y++;
      } else {
        // element removed
        if (y !== -1) {
          if (current[0] === idxLeft + 1) {
            current[0] -= 1;
            current[1] += 1;
          } else {
            s.push((current = [idxLeft, 1]));
          }
        }
        x++;
      }

      // Exhaust diagonal until we hit a reset.
      idx = y * width + x;
      while (idx < size && x < width && y < height) {
        diff = diffs[idx];
        if (diff === "reset") {
          break;
        }
        if (diff !== "none") {
          p[start + x] = diff;
          havePatches = true;
        }

        x++;
        y++;
        idx += diag;
      }

      v = Object.getPrototypeOf(v);
    }
  }

  // Build the patch object.
  const res: ArrayPatch<T> = { t: "a" };
  if (havePatches) {
    res.p = p;
  }
  if (s.length) {
    res.s = s;
  }
  return res;
};
