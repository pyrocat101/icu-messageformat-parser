import {parseMessage} from '../src/parser';

test('trivial', () => {
  expect(
    parseMessage(`\
      Cart: {itemCount} {itemCount, plural,
        one {item}
        other {items}
      }`)
  ).toMatchSnapshot();
  expect(
    parseMessage(`\
      You have {itemCount, plural,
        =0 {no items}
        one {1 item}
        other {{itemCount} items}
      }.`)
  );
});

test('escaped nested message', () => {
  expect(
    parseMessage(`\
      {itemCount, plural,
        one {item'}'}
        other {items'}'}
      }`)
  ).toMatchSnapshot();
});
