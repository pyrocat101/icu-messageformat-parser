import {
  alt,
  Parser,
  eof,
  seq,
  string,
  regexp,
  Result,
  newline,
  whitespace,
  seqMap,
  seqObj,
  lazy,
  succeed,
} from 'parsimmon';
import {
  MessageFormatElement,
  LiteralElement,
  TYPE,
  ArgumentElement,
  NumberElement,
  DateElement,
  TimeElement,
  SelectElement,
  PluralElement,
  ValidPluralRule,
  PluralOrSelectOption,
  DateSkeleton,
  NumberSkeleton,
  SkeletonToken,
  SKELETON_TYPE,
} from './ast';

/**
 * MessageFormat EBNF:
 *
 * message = messageText (argument messageText)*
 * argument = noneArg | simpleArg | complexArg
 * complexArg = choiceArg | pluralArg | selectArg | selectordinalArg
 *
 * noneArg = '{' argNameOrNumber '}'
 * simpleArg = '{' argNameOrNumber ',' argType [',' argStyle] '}'
 * pluralArg = '{' argNameOrNumber ',' "plural" ',' pluralStyle '}'
 * selectArg = '{' argNameOrNumber ',' "select" ',' selectStyle '}'
 * selectordinalArg = '{' argNameOrNumber ',' "selectordinal" ',' pluralStyle '}'
 *
 * argNameOrNumber = argName | argNumber
 * argName = [^[[:Pattern_Syntax:][:Pattern_White_Space:]]]+
 * argNumber = '0' | ('1'..'9' ('0'..'9')*)
 *
 * argType = "number" | "date" | "time" | "spellout" | "ordinal" | "duration"
 * argStyle = "short" | "medium" | "long" | "full" | "integer" | "currency" | "percent" | argStyleText | "::" argSkeletonText
 *
 * // See: http://icu-project.org/apiref/icu4j/com/ibm/icu/text/PluralFormat.html
 * pluralStyle = [offsetValue] (selector '{' message '}')+
 * offsetValue = "offset:" number
 * selector = explicitValue | keyword
 * explicitValue = '=' number  // adjacent, no white space in between
 * keyword = [^[[:Pattern_Syntax:][:Pattern_White_Space:]]]+
 */

type SimpleArgElement = NumberElement | DateElement | TimeElement;

// Optional whitespace or newline
const ws = alt(newline, whitespace).many();
const keyword = regexp(/[^\p{Pattern_Syntax}\p{Pattern_White_Space}]+/u).desc('keyword');
const regexpOrNewLine = (re: RegExp): Parser<string> => alt(regexp(re), newline);

// Message text part
// -------------------------------------------------------------------------------------------------

// ICU >= 4.8 quoting behavior (ICU4J `ApostropheMode.DOUBLE_OPTIONAL`).
const messageText: Parser<LiteralElement> = alt(
  // quoted string
  // -------------
  seq(
    // Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
    // a character that requires quoting (that is, "only where needed"), and works the same in
    // nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
    regexp(/'([\{\}])/u, 1),
    regexpOrNewLine(/(?:[^']|(?:''))+/u)
      .many()
      .tie()
      .map(s => s.replace(`''`, `'`))
      .desc('quoted string')
  )
    .tie()
    .skip(string(`'`)),
  // double apostrophes
  string(`''`).result(`'`),
  // unescaped string
  // ----------------
  // TODO:
  // Quotable syntax characters are the {curly braces} in all messageText
  // parts, plus the '#' sign in a messageText immediately inside a pluralStyle,
  // and the '|' symbol in a messageText immediately inside a choiceStyle.
  regexpOrNewLine(/(?:(?!''|\{|\}|'\{|'\}).)+/u)
    .atLeast(1)
    .tie()
)
  .desc('messageText part')
  .atLeast(1)
  .tie()
  .map(value => ({type: TYPE.literal, value}));

// Skeleton
// -------------------------------------------------------------------------------------------------

const numSkeletonIdentifier = regexp(/[^\s'\{\}\/]+/);

const numSkeletonOptions: Parser<string[]> = string('/')
  .then(numSkeletonIdentifier)
  .many();
const numSkeletonToken: Parser<SkeletonToken> = seqObj(
  ['stem', numSkeletonIdentifier],
  ['options', numSkeletonOptions]
);

// See also:
// https://github.com/unicode-org/icu/blob/master/docs/userguide/format_parse/numbers/skeletons.md
const numberSkeleton: Parser<NumberSkeleton> = numSkeletonToken.sepBy(ws).map(tokens => ({
  type: SKELETON_TYPE.number,
  tokens,
}));

// See also:
// - http://cldr.unicode.org/translation/date-time-patterns
// - http://www.icu-project.org/apiref/icu4j/com/ibm/icu/text/SimpleDateFormat.html
// Again, here we implement the ICU >= 4.8 quoting behavior.
const dateSkeletonPattern: Parser<string> = messageText.map(x => x.value);

const dateSkeleton: Parser<DateSkeleton> = dateSkeletonPattern.map(pattern => ({
  type: SKELETON_TYPE.date,
  pattern,
}));

// Simple Argument
// -------------------------------------------------------------------------------------------------

// TODO: supported escaped string in argStyleText.
// > In argStyleText, every single ASCII apostrophe begins and ends quoted literal text,
// > and unquoted {curly braces} must occur in matched pairs.
const numberArgStyle: Parser<string | NumberSkeleton> = alt(
  string('::').then(numberSkeleton),
  keyword
);

const dateOrTimeArgSkeleton: Parser<string | DateSkeleton> = alt(
  string('::').then(dateSkeleton),
  keyword
);

const numberArgRest: Parser<Omit<NumberElement, 'value'>> = seqObj(
  ['type', string('number').result(TYPE.number)],
  ws,
  [
    'style',
    string(',')
      .then(ws)
      .then(numberArgStyle)
      .fallback(undefined),
  ]
);

const dateOrTimeArgRest: Parser<Omit<DateElement | TimeElement, 'value'>> = seqObj(
  ['type', alt(string('date').result(TYPE.date), string('time').result(TYPE.time))],
  ws,
  [
    'style',
    string(',')
      .then(ws)
      .then(dateOrTimeArgSkeleton)
      .fallback(undefined),
  ]
);

const simpleArgRest: Parser<Omit<SimpleArgElement, 'value'>> = alt(numberArgRest, dateOrTimeArgRest)
  .skip(ws)
  .skip(string('}'));

// Plural Argument
// -------------------------------------------------------------------------------------------------

const explicitValue: Parser<string> = regexp(/=\d+/u).desc('explicitValue');
const pluralSelector: Parser<ValidPluralRule> = alt(explicitValue, keyword);

const pluralOption: Parser<{id: ValidPluralRule; value: MessageFormatElement[]}> = seqObj(
  ws,
  ['id', pluralSelector],
  ws,
  string(`{`),
  ['value', lazy(() => message)],
  string(`}`)
);

const pluralOptions = pluralOption.atLeast(1).map(options =>
  options.reduce<Record<ValidPluralRule, PluralOrSelectOption>>((all, {id, value}) => {
    all[id] = {value};
    return all;
  }, {})
);

const offsetValue: Parser<number> = string('offset:')
  .then(ws)
  .then(regexp(/\d+/u).map(Number));

const pluralArgRest: Parser<Omit<PluralElement, 'value'>> = seqObj(
  // pseudo-parser
  ['type', succeed(TYPE.plural)],
  [
    'pluralType',
    alt(
      string(`plural`).result(`cardinal` as const),
      string(`selectordinal`).result(`ordinal` as const)
    ),
  ],
  ws,
  string(`,`),
  ws,
  ['offset', offsetValue.fallback(0)],
  ['options', pluralOptions],
  ws,
  string(`}`)
);

// Select Argument
// -------------------------------------------------------------------------------------------------

const selectOption: Parser<{id: string; value: MessageFormatElement[]}> = seqObj(
  ws,
  ['id', keyword],
  ws,
  string(`{`),
  ['value', lazy(() => message)],
  string(`}`)
);

const selectStyle = selectOption.atLeast(1).map(options =>
  options.reduce<Record<string, PluralOrSelectOption>>((all, {id, value}) => {
    all[id] = {value};
    return all;
  }, {})
);

const selectArgRest: Parser<Omit<SelectElement, 'value'>> = seqObj(
  ['type', succeed(TYPE.select)],
  string(`select`),
  ws,
  string(`,`),
  ws,
  ['options', selectStyle],
  ws,
  string(`}`)
);

// Argument
// -------------------------------------------------------------------------------------------------

const argNumber = regexp(/0|(?:[1-9][0-9]+)/u).desc('argNumber');
const argNameOrNumber: Parser<string> = alt(argNumber, keyword);
const argPrefix = argNameOrNumber.wrap(string(`{`).then(ws), ws);

const noneArgRest: Parser<Omit<ArgumentElement, 'value'>> = string(`}`).result({
  type: TYPE.argument,
});

// This parser is a bit ugly to limit the backtracking depth.
const argRest = alt(
  noneArgRest,
  seq(ws, string(`,`), ws).then(alt(simpleArgRest, pluralArgRest, selectArgRest))
);

const argument: Parser<ArgumentElement | SimpleArgElement | SelectElement | PluralElement> = seqMap(
  argPrefix,
  argRest,
  (argNameOrNumber, element) => ({
    ...element,
    value: argNameOrNumber,
  })
).desc('argument');

// Message
// -------------------------------------------------------------------------------------------------

const message: Parser<MessageFormatElement[]> = alt(argument, messageText).many();

export function parseMessage(source: string): Result<MessageFormatElement[]> {
  return message.lookahead(eof).parse(source);
}
