import {parseMessage} from '../src/parser';

test('number arg', () => {
  expect(parseMessage('I have {numCats, number} cats.')).toMatchSnapshot();
});

test('number arg with style', () => {
  expect(parseMessage('Almost {pctBlack, number, percent} of them are black.')).toMatchSnapshot();
});

test('date & time arg', () => {
  expect(
    parseMessage('Your meeting is scheduled for the {dateVal, date} at {timeVal, time}')
  ).toMatchSnapshot();
});

test('date & time arg with style', () => {
  expect(
    parseMessage(
      'Your meeting is scheduled for the {dateVal, date, long} at {timeVal, time, short}'
    )
  ).toMatchSnapshot();
});
