import {
  AnyObject,
  AnyArray,
  PlainObject,
  PlainArray,
  Patch,
  ObjectPatch,
  ArrayPatch
} from "./types";

/// Apply a patch based on its type.
///
/// This is an untyped variant. If you know the value's type, you should use
/// `applyObjectPatch` or `applyArrayPatch` instead.
export const applyPatch = (val: any, patch: Patch): any => {
  if (patch.t === "o") {
    return applyObjectPatch(val, patch);
  } else if (patch.t === "a") {
    return applyArrayPatch(val, patch);
  } else {
    throw Error("Invalid patch");
  }
};

/// Apply an object patch.
export const applyObjectPatch = <T extends AnyObject>(
  obj: T,
  patch: ObjectPatch<T>
): PlainObject<T> => {
  let output = { ...obj };

  const r = patch.r;
  if (r) {
    for (const key of r) {
      delete output[key];
    }
  }

  const s = patch.s;
  if (s) {
    for (const key in s) {
      output[key] = s[key]!;
    }
  }

  const p = patch.p;
  if (p) {
    for (const key in p) {
      output[key] = applyPatch(output[key], p[key]!);
    }
  }

  return output;
};

/// Apply an array patch.
export const applyArrayPatch = <T extends AnyArray>(
  arr: T,
  patch: ArrayPatch<T>
): PlainArray<T> => {
  const output = [...arr];

  const p = patch.p;
  if (p) {
    for (const idx in p) {
      output[idx] = applyPatch(output[idx], p[idx]);
    }
  }

  const s = patch.s;
  if (s) {
    for (let splice of s) {
      output.splice(...splice);
    }
  }

  return output;
};
