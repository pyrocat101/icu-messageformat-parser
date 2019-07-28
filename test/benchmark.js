#!/usr/bin/env node
'use strict';
const benchmark = require('benchmark');
var parser = require('../');

const complexMsg =
  '' +
  '{gender_of_host, select, ' +
  'female {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to her party.}' +
  '=2 {{host} invites {guest} and one other person to her party.}' +
  'other {{host} invites {guest} and # other people to her party.}}}' +
  'male {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to his party.}' +
  '=2 {{host} invites {guest} and one other person to his party.}' +
  'other {{host} invites {guest} and # other people to his party.}}}' +
  'other {' +
  '{num_guests, plural, offset:1 ' +
  '=0 {{host} does not give a party.}' +
  '=1 {{host} invites {guest} to their party.}' +
  '=2 {{host} invites {guest} and one other person to their party.}' +
  'other {{host} invites {guest} and # other people to their party.}}}}';

const normalMsg =
  '' +
  'Yo, {firstName} {lastName} has ' +
  '{numBooks, number, integer} ' +
  '{numBooks, plural, ' +
  'one {book} ' +
  'other {books}}.';

const simpleMsg = 'Hello, {name}!';

const stringMsg = 'Hello, world!';

console.log('complex_msg AST length', JSON.stringify(parser.parseMessage(complexMsg).value).length);
console.log('normal_msg AST length', JSON.stringify(parser.parseMessage(normalMsg).value).length);
console.log('simple_msg AST length', JSON.stringify(parser.parseMessage(simpleMsg).value).length);
console.log('string_msg AST length', JSON.stringify(parser.parseMessage(stringMsg).value).length);

new benchmark.Suite()
  .add('complex_msg', () => parser.parseMessage(complexMsg).value)
  .add('normal_msg', () => parser.parseMessage(normalMsg).value)
  .add('simple_msg', () => parser.parseMessage(simpleMsg).value)
  .add('string_msg', () => parser.parseMessage(stringMsg).value)
  .on('cycle', function(event) {
    console.log(String(event.target));
  })
  .run();
