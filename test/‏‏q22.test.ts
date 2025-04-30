import fs from 'fs';
import { expect } from 'chai';
import { evalL32program } from '../src/L32/L32-eval';
import { Value } from '../src/L32/L32-value';
import {
  Result,
  bind,
  isFailure,
  makeFailure,
  makeOk,
} from '../src/shared/result';
import { parseL32, parseL32Exp } from '../src/L32/L32-ast';
import { makeEmptySExp } from '../src/L3/L3-value';

const evalP = (x: string): Result<Value> => bind(parseL32(x), evalL32program);

describe.only('Q22 Tests', () => {
  it('Q22 basic tests 1', () => {
    expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a))`)).to.deep.equal(makeOk(1));
  });

  it('Q22 tests 2', () => {
    expect(
      evalP(`(L32
                      (define x "a")
                      (define y "b")
                      ((dict (a x) (b y)) 'b))`)
    ).to.deep.equal(makeOk('b'));
  });

  it('Q22 test 3', () => {
    expect(
      evalP(`(L32 
            (define x 1)
            (
              (if (< x 0)
                (dict (a 1) (b 2))
                (dict (a 2) (b 1)))
            'a))`)
    ).to.deep.equal(makeOk(2));
  });

  // Test cases for dictionary lookup failures
  describe('Dictionary lookup failures', () => {
    it('should fail when applying dictionary with no arguments', () => {
      expect(evalP(`(L32 ((dict (a 1) (b 2))))`)).to.deep.equal(
        makeFailure('Dictionary lookup expects exactly one argument, got 0')
      );
    });

    it('should fail when applying dictionary with multiple arguments', () => {
      expect(evalP(`(L32 ((dict (a 1) (b 2)) 'a 'b))`)).to.deep.equal(
        makeFailure('Dictionary lookup expects exactly one argument, got 2')
      );
    });

    it('should fail when key is not a symbol', () => {
      expect(evalP(`(L32 ((dict (a 1) (b 2)) 1))`)).to.deep.equal(
        makeFailure('Dictionary key must be a symbol, got 1')
      );
    });

    it('should fail when key is not found in dictionary', () => {
      expect(evalP(`(L32 ((dict (a 1) (b 2)) 'c))`)).to.deep.equal(
        makeFailure('Key c not found in dictionary')
      );
    });

    it('should fail when trying to apply non-dictionary as dictionary', () => {
      expect(evalP(`(L32 (1 'a))`)).to.deep.equal(
        makeFailure('Bad procedure 1')
      );
    });

    it('should fail when creating dictionary with duplicate keys', () => {
      expect(evalP(`(L32 (dict (a 1) (a 2)))`)).to.deep.equal(
        makeFailure('Duplicate key in dictionary: a')
      );
    });

    it('should fail when creating dictionary with malformed entries', () => {
      expect(evalP(`(L32 (dict a (b 2)))`)).to.deep.equal(
        makeFailure('Malformed entry in "dict" expression')
      );
    });
  });
});
