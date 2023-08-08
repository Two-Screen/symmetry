import {
  AnyObject,
  AnyArray,
  PlainObject,
  PlainArray,
  Patch,
  CreateObjectPatchResult,
  CreateArrayPatchResult,
  ObjectPatch,
  ArrayPatch,
  NestedPatch,
} from "./types";

/** Attempt in-place reset of a value. */
function tryResetValue<T>(val: T, newVal: T) {
  const valIsArray = Array.isArray(val);
  const newValIsArray = Array.isArray(newVal);
  if (valIsArray && newValIsArray) {
    resetArray(val, newVal);
    return val;
  }

  const valIsObject = typeof val === "object" && val !== null && !valIsArray;
  const newValIsObject =
    typeof newVal === "object" && newVal !== null && !newValIsArray;
  if (valIsObject && newValIsObject) {
    resetObject(val, newVal);
    return val;
  }

  return newVal;
}

/** In-place reset of an array. */
function resetArray<T extends AnyArray>(val: T, newVal: T): T {
  val.splice(0, val.length, ...newVal);
  return val;
}

/** In-place reset of an object. */
function resetObject<T extends AnyObject>(val: T, newVal: T): T {
  for (const k in val) delete val[k];
  Object.assign(val, newVal);
  return val;
}

/** Factory function for both in-place and immutable variants. */
function factory(inPlace = false) {
  /** Apply a patch created by `createPatch`. */
  function applyPatch<T>(val: T, patch: Patch<T>): T {
    if (!patch) {
      return val;
    } else if (patch.t === "r") {
      return inPlace ? tryResetValue(val, patch.v) : patch.v;
    } else {
      return applyPatchNested(val, patch);
    }
  }

  /** Apply a patch created by `createObjectPatch`. */
  function applyObjectPatch<T extends AnyObject>(
    obj: T,
    patch: CreateObjectPatchResult<T>
  ): PlainObject<T> {
    if (!patch) {
      return obj;
    } else if (patch.t === "r") {
      return inPlace ? resetObject(obj, patch.v) : patch.v;
    } else if (patch.t === "o") {
      return applyObjectPatchNested(obj, patch);
    } else {
      throw Error("Invalid object patch");
    }
  }

  /** Apply a patch created by `createArrayPatch`. */
  function applyArrayPatch<T extends AnyArray>(
    arr: T,
    patch: CreateArrayPatchResult<T>
  ): PlainArray<T> {
    if (!patch) {
      return arr;
    } else if (patch.t === "r") {
      return inPlace ? resetArray(arr, patch.v) : patch.v;
    } else if (patch.t === "a") {
      return applyArrayPatchNested(arr, patch);
    } else {
      throw Error("Invalid array patch");
    }
  }

  /** Apply a nested patch. */
  function applyPatchNested<T>(val: T, patch: NestedPatch<T>): T {
    switch (patch.t) {
      case "o":
        return applyObjectPatch(val as any, patch) as any;
      case "a":
        return applyArrayPatch(val as any, patch) as any;
      default:
        throw Error("Invalid patch");
    }
  }

  /** Apply a nested object patch. */
  function applyObjectPatchNested<T extends AnyObject>(
    obj: T,
    patch: ObjectPatch<T>
  ): PlainObject<T> {
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
        output[key] = applyPatchNested(output[key], p[key]!);
      }
    }

    return output;
  }

  /** Apply a nested array patch. */
  function applyArrayPatchNested<T extends AnyArray>(
    arr: T,
    patch: ArrayPatch<T>
  ): PlainArray<T> {
    const output = inPlace ? arr : [...arr];

    const p = patch.p;
    if (p) {
      for (const idx in p) {
        output[idx] = applyPatchNested(output[idx], p[idx]);
      }
    }

    const s = patch.s;
    if (s) {
      for (let splice of s) {
        output.splice(...splice);
      }
    }

    return output;
  }

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
   *
   * NOTE: A top-level `ResetPatch` is only in-place if the target and new
   * value are both objects or both arrays.
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
