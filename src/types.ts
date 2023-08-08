/** Accepts any kind of object. */
export type AnyObject = { [key: string]: any };
/** Accepts any kind of array. */
export type AnyArray = any[];

/** The type of values for the given array type. */
export type ArrayValue<T> = T extends Array<infer V> ? V : unknown;
/** A splice operation on the given array type. */
export type ArraySplice<T> = [number, number, ...PlainArray<T>];

/** A plain object version of another object type. (Strips inheritance, etc.) */
export type PlainObject<T> = { [K in keyof T]: T[K] };
/** A plain array version of another array type. (Strips inheritance, etc.) */
export type PlainArray<T> = ArrayValue<T>[];

/** Type of property removals in `ObjectPatch`. */
export type ObjectPatchRemove<T> = (keyof T)[];
/** Type of property sets in `ObjectPatch`. */
export type ObjectPatchSet<T> = Partial<PlainObject<T>>;
/** Type of property patches in `ObjectPatch`. */
export type ObjectPatchNested<T> = { [K in keyof T]?: NestedPatch<T[K]> };

/**
 * Patch operation on an object.
 *
 * The property order here matches the order in which the patch is applied.
 */
export interface ObjectPatch<T> {
  /** Type indicator. */
  t: "o";
  /** Properties to remove. */
  r?: ObjectPatchRemove<T>;
  /** Properties to set. */
  s?: ObjectPatchSet<T>;
  /** Properties to patch. */
  p?: ObjectPatchNested<T>;
}

/** Type of item patches in `ArrayPatch`. */
export type ArrayPatchNested<T> = { [idx: number]: NestedPatch<ArrayValue<T>> };
/** Type of splices in `ArrayPatch`. */
export type ArrayPatchSplice<T> = ArraySplice<T>[];

/**
 * Patch operation on an array.
 *
 * The property order here matches the order in which the patch is applied.
 */
export interface ArrayPatch<T> {
  /** Type indicator. */
  t: "a";
  /** Items to patch. */
  p?: ArrayPatchNested<T>;
  /** Splices to apply. */
  s?: ArrayPatchSplice<T>;
}

/**
 * Patch operation indicating a value has changed completely.
 */
export interface ResetPatch<T> {
  /** Type indicator. */
  t: "r";
  /** The new value in full. */
  v: T;
}

/** The result of `createObjectPatch` */
export type CreateObjectPatchResult<T extends object> =
  | ObjectPatch<T>
  | ResetPatch<T>
  | null;
/** The result of `createArrayPatch` */
export type CreateArrayPatchResult<T extends any[]> =
  | ArrayPatch<T>
  | ResetPatch<T>
  | null;
/** Patch operation on a value. */
export type Patch<T> = ObjectPatch<T> | ArrayPatch<T> | ResetPatch<T> | null;
/** Patch operation on a nested value. */
export type NestedPatch<T> = ObjectPatch<T> | ArrayPatch<T>;
