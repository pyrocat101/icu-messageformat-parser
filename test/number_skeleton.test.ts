import {parseMessage} from '../src/parser';

test.each([`compact-short currency/GBP`, `@@#`, `currency/CAD unit-width-narrow`])(
  'case: %p',
  skeleton => {
    expect(parseMessage(`{0, number, ::${skeleton}}`)).toMatchSnapshot();
  }
);
