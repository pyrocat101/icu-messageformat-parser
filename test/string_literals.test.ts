import {parseMessage} from '../src/parser';

test('unescaped string literals', () => {
  expect(parseMessage('line1\n  line2')).toMatchSnapshot();
});

test('treats double apostrophes as one apostrophe', () => {
  expect(parseMessage(`a''b`)).toMatchSnapshot();
});

test('starts quoted text if apostrophe immediately precedes a character', () => {
  expect(parseMessage(`'{a''b}'`)).toMatchSnapshot();
  expect(parseMessage(`'}a''b{'`)).toMatchSnapshot();
  expect(parseMessage(`aaa'{'`)).toMatchSnapshot();
  expect(parseMessage(`aaa'}'`)).toMatchSnapshot();
});

test('does not start quoted text if apostrophe does not immediately precede a character', () => {
  expect(parseMessage(`'aa''b'`)).toMatchSnapshot();
  expect(parseMessage(`I don't know`)).toMatchSnapshot();
});
