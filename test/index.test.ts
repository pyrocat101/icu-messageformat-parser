import {parseMessage, printAST} from '../src';

// TOOD: support parser options
function allTests() {
  [
    'Hello, World!',
    'Hello, {name}!',
    'My name is {FIRST} {LAST}, age {age, number}, time {time, time}, date {date, date}.',
    '{num, number, percent}',
    '{count, time}',
    '{numPhotos, plural, =0{no photos} =1{one photo} other{# photos}}',
    'Foo {var1, plural, =0{# var1} other{{var2, plural, =0{# var2} other{# var2-other}} # other}}',
    '{floor, selectordinal, =0{ground} one{#st} two{#nd} few{#rd} other{#th}} floor',
    '{gender, select, female {woman} male {man} other {person}}',
    '   some random test   ',
    '{  num , number,percent  }',
    '{c, plural, =1 { {text} project} other { {text} projects}}',
    '\\{',
    '\\}',
    '\\u003C',
    // Escaping "#" needs to be special-cased so it remains escaped so
    // the runtime doesn't replace it when in a `pluralFormat` option.
    '\\#',
    /**
     * @see http://userguide.icu-project.org/formatparse/messages#TOC-Quoting-Escaping
     * @see https://github.com/formatjs/formatjs/issues/97
     */
    "This '{isn''t}' obvious",
    "''{name}''",
    "''{name}''",
    'this is {count,plural,offset:1 one{{count, number} dog} other{{count, number} dogs}}',
  ].forEach(mess => {
    const parseResult = parseMessage(mess);
    if (!parseResult.status) {
      fail();
      return;
    }
    const ast = parseResult.value;
    it(`can parse '${mess}'`, function() {
      expect(ast).toMatchSnapshot();
    });
    it(`can print AST from '${mess}'`, function() {
      expect(printAST(ast)).toMatchSnapshot();
    });
  });
}

describe('parse()', function() {
  allTests();
});

describe('parse({ captureLocation: true })', function() {
  allTests();
});
