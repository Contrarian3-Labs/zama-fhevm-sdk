/**
 * Utility types for FHEVM SDK
 * Copied from Wagmi patterns for consistency
 */

/**
 * Converts union to intersection
 * @example
 * type Result = Compute<{ a: string } | { b: number }>
 * //   ^? { a: string } & { b: number }
 */
export type Compute<type> = { [key in keyof type]: type[key] } & unknown

/**
 * Makes all properties in T optional and allows undefined
 * @example
 * type Result = ExactPartial<{ a: string; b: number }>
 * //   ^? { a?: string | undefined; b?: number | undefined }
 */
export type ExactPartial<type> = {
  [key in keyof type]?: type[key] | undefined
}

/**
 * Strict omit that ensures keys exist in type
 */
export type LooseOmit<type, keys extends string> = Pick<
  type,
  Exclude<keyof type, keys>
>

/**
 * OneOf ensures only one of the union members is used
 */
export type OneOf<
  union extends object,
  ///
  keys extends KeysOf<union> = KeysOf<union>,
> =
  | union
  | {
      [key in keys]: ExclusiveUnion<union, key>
    }[keys]

type KeysOf<type> = type extends type ? keyof type : never

type ExclusiveUnion<union, key extends KeysOf<union>> = union extends unknown
  ? union & { [k in Exclude<KeysOf<union>, key>]?: never }
  : never

/**
 * Removes undefined from type
 */
export type RemoveUndefined<type> = type extends undefined ? never : type
