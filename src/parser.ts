import {MessageFormatElement, LiteralElement, TYPE} from './ast';

/**
 * MessageFormat EBNF:
 *
 * message = messageText (argument messageText)*
 * argument = noneArg | simpleArg | complexArg
 * complexArg = choiceArg | pluralArg | selectArg | selectordinalArg
 *
 * noneArg = '{' argNameOrNumber '}'
 * simpleArg = '{' argNameOrNumber ',' argType [',' argStyle] '}'
 * choiceArg = '{' argNameOrNumber ',' "choice" ',' choiceStyle '}'
 * pluralArg = '{' argNameOrNumber ',' "plural" ',' pluralStyle '}'
 * selectArg = '{' argNameOrNumber ',' "select" ',' selectStyle '}'
 * selectordinalArg = '{' argNameOrNumber ',' "selectordinal" ',' pluralStyle '}'
 *
 * choiceStyle: see ChoiceFormat
 * pluralStyle: see PluralFormat
 * selectStyle: see SelectFormat
 *
 * argNameOrNumber = argName | argNumber
 * argName = [^[[:Pattern_Syntax:][:Pattern_White_Space:]]]+
 * argNumber = '0' | ('1'..'9' ('0'..'9')*)
 *
 * argType = "number" | "date" | "time" | "spellout" | "ordinal" | "duration"
 * argStyle = "short" | "medium" | "long" | "full" | "integer" | "currency" | "percent" | argStyleText | "::" argSkeletonText
 *
 */

interface InputState {
  readonly text: string;
  readonly pos: number;
}

// TODO: parse error
type ParserMonad<TResult> = {
  readonly input: InputState;
  readonly result: TResult;
} | null;
type Parser<TResult> = (input: InputState) => ParserMonad<TResult>;

function consumeRegex(input: InputState, pattern: RegExp): ParserMonad<RegExpExecArray> {
  const {text, pos} = input;
  pattern.lastIndex = pos;
  const match = pattern.exec(text);
  return match && {input: {text, pos: pos + match[0].length}, result: match};
}

function consumeText(input: InputState, prefix: string): ParserMonad<string | null> {
  const {text, pos} = input;
  return text.startsWith(prefix, pos)
    ? {input: {text, pos: pos + prefix.length}, result: prefix}
    : null;
}

export const parseMessage: Parser<MessageFormatElement[]> = input => {
  const chunks: MessageFormatElement[] = [];
  while (true) {
    const parsed = parseMessageText(input);
    if (parsed != null) {
      input = parsed.input;
      chunks.push(parsed.result);
    } else {
      break;
    }
  }
  return {input, result: chunks};
};

const ESCAPED_TEXT = /'\{(?:[^']|(?:''))+'/suy;
const UNESCAPED_MSG_TEXT = /(?:(?!''|\{).)+/suy;

// TODO: use macro.
// ICU >= 4.8 quoting behavior.
const parseMessageText: Parser<LiteralElement> = input => {
  const chunks: string[] = [];
  while (true) {
    // Starting with ICU 4.8, an ASCII apostrophe only starts quoted text if it immediately precedes
    // a character that requires quoting (that is, "only where needed"), and works the same in
    // nested messages as on the top level of the pattern. The new behavior is otherwise compatible.
    {
      // TODO: other syntax characters?
      const parsed = consumeRegex(input, ESCAPED_TEXT);
      if (parsed != null) {
        input = parsed.input;
        chunks.push(parsed.result[0].slice(1, -1).replace("''", "'"));
        continue;
      }
    }
    // double apostrophes
    {
      const parsed = consumeText(input, "''");
      if (parsed != null) {
        input = parsed.input;
        chunks.push("'");
        continue;
      }
    }
    // unescaped string
    {
      const parsed = consumeRegex(input, UNESCAPED_MSG_TEXT);
      if (parsed != null) {
        input = parsed.input;
        chunks.push(parsed.result[0]);
        continue;
      }
    }
    break;
  }
  // We need to actually consume input.
  return chunks.length > 0
    ? {
        input,
        result: {
          type: TYPE.literal,
          value: chunks.join(''),
          // TODO: location
        },
      }
    : null;
};
