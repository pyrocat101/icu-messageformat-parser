import {parseMessage} from '../src/parser';

test('trivial', () => {
  expect(
    parseMessage(`\
      {gender, select,
          male {He}
          female {She}
          other {They}
      } will respond shortly.
    `)
  ).toMatchSnapshot();
});

test('nested arguments', () => {
  expect(
    parseMessage(`\
      {taxableArea, select,
          yes {An additional {taxRate, number, percent} tax will be collected.}
          other {No taxes apply.}
      }
    `)
  ).toMatchSnapshot();
});
