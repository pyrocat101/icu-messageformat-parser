import {parseMessage} from '../src/parser';

test('unescaped string literals', () => {
  expect(parseMessage({text: 'line1\n  test2', pos: 0})).toMatchSnapshot();
});

test('treats double apostrophes as one apostrophe', () => {
  expect(parseMessage({text: `a''b`, pos: 0})).toMatchSnapshot();
});

test('starts quoted text if apostrophe immediately precedes a character', () => {
  expect(parseMessage({text: `'{a''b}'`, pos: 0})).toMatchSnapshot();
});

test('does not start quoted text if apostrophe does not immediately precede a character', () => {
  expect(parseMessage({text: `'a}a''b}'`, pos: 0})).toMatchSnapshot();
});
