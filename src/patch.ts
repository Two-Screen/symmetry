import {
  AnyObject,
  AnyArray,
  PlainObject,
  PlainArray,
  Patch,
  ObjectPatch,
  ArrayPatch,
} from "./types";

function factory(inPlace = false) {
  const applyPatch = (val: any, patch: Patch): any => {
    if (patch.t === "o") {
      return applyObjectPatch(val, patch);
    } else if (patch.t === "a") {
      return applyArrayPatch(val, patch);
    } else {
      throw Error("Invalid patch");
    }
  };

  const applyObjectPatch = <T extends AnyObject>(
    obj: T,
    patch: ObjectPatch<T>
  ): PlainObject<T> => {
    let output = inPlace ? obj : { ...obj };

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

  const applyArrayPatch = <T extends AnyArray>(
    arr: T,
    patch: ArrayPatch<T>
  ): PlainArray<T> => {
    const output = inPlace ? arr : [...arr];

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

  return { applyPatch, applyObjectPatch, applyArrayPatch };
}

const immutable = factory();
const inPlace = factory(true);

/**
 * Apply a patch based on its type.
 *
 * This is an untyped variant. If you know the value's type, you should use
 * `applyObjectPatch` or `applyArrayPatch` instead.
 */
export const applyPatch = Object.assign(immutable.applyPatch, {
  /**
   * Variant that modifies the target value in-place.
   */
  inPlace: inPlace.applyPatch,
});

/**
 * Apply an object patch.
 */
export const applyObjectPatch = Object.assign(immutable.applyObjectPatch, {
  /**
   * Variant that modifies the target object in-place.
   */
  inPlace: inPlace.applyObjectPatch,
});

/**
 * Apply an array patch.
 */
export const applyArrayPatch = Object.assign(immutable.applyArrayPatch, {
  /**
   * Variant that modifies the target array in-place.
   */
  inPlace: inPlace.applyArrayPatch,
});
