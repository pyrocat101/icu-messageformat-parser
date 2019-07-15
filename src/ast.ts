export const enum TYPE {
  /**
   * Raw text
   */
  literal,
  /**
   * Variable w/o any format, e.g `var` in `this is a {var}`
   */
  argument,
  /**
   * Variable w/ number format
   */
  number,
  /**
   * Variable w/ date format
   */
  date,
  /**
   * Variable w/ time format
   */
  time,
  /**
   * Variable w/ select format
   */
  select,
  /**
   * Variable w/ plural format
   */
  plural,
}

export const enum SKELETON_TYPE {
  number,
  date,
}

export interface LocationDetails {
  offset: number;
  line: number;
  column: number;
}
export interface Location {
  start: LocationDetails;
  end: LocationDetails;
}

export interface BaseElement<T extends TYPE> {
  type: T;
  value: string;
  location?: Location;
}

export type LiteralElement = BaseElement<TYPE.literal>;
export type ArgumentElement = BaseElement<TYPE.argument>;

export interface SimpleFormatElement<T extends TYPE, S extends Skeleton> extends BaseElement<T> {
  style?: string | S;
}

export type NumberElement = SimpleFormatElement<TYPE.number, NumberSkeleton>;
export type DateElement = SimpleFormatElement<TYPE.date, DateSkeleton>;
export type TimeElement = SimpleFormatElement<TYPE.time, DateSkeleton>;

export interface SelectOption {
  id: string;
  value: MessageFormatElement[];
  location?: Location;
}

export type ValidPluralRule = 'zero' | 'one' | 'two' | 'few' | 'many' | 'other' | string;

export interface PluralOrSelectOption {
  value: MessageFormatElement[];
  location?: Location;
}

export interface SelectElement extends BaseElement<TYPE.select> {
  options: Record<string, PluralOrSelectOption>;
}

export interface PluralElement extends BaseElement<TYPE.plural> {
  options: Record<ValidPluralRule, PluralOrSelectOption>;
  offset: number;
  pluralType: Intl.PluralRulesOptions['type'];
}

export interface SkeletonToken {
  stem: string;
  options: string[];
}

export interface NumberSkeleton {
  type: SKELETON_TYPE.number;
  tokens: SkeletonToken[];
}

export interface DateSkeleton {
  type: SKELETON_TYPE.date;
  pattern: string;
}

export type Skeleton = NumberSkeleton | DateSkeleton;

export type MessageFormatElement =
  | LiteralElement
  | ArgumentElement
  | NumberElement
  | DateElement
  | TimeElement
  | SelectElement
  | PluralElement;
