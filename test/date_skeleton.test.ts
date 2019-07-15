import {parseMessage} from '../src/parser';

test.each([`yyyy.MM.dd G at HH:mm:ss vvvv`, `EEE, MMM d, 'yy`, `h:mm a`])('case: %p', skeleton => {
  expect(parseMessage(`{0, date, ::${skeleton}}`)).toMatchSnapshot();
});
