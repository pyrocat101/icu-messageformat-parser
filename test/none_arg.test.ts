import {parseMessage} from '../src/parser';

test('trivial', () => {
  expect(parseMessage('{0}')).toMatchSnapshot();
  expect(parseMessage('{arg}')).toMatchSnapshot();
  expect(parseMessage('hello {name}')).toMatchSnapshot();
});
