import {
  CExp,
  DictExp,
  Exp,
  isDictExp,
  isAppExp,
  isBoolExp,
  isNumExp,
  isStrExp,
  isVarRef,
  isLitExp,
  isPrimOp,
  isIfExp,
  isProcExp,
  isDefineExp,
  makeAppExp,
  makeDefineExp,
  makeLitExp,
  makeProcExp,
  makeProgram,
  makeVarDecl,
  makeVarRef,
  Program,
  makeIfExp,
  makePrimOp,
} from './L32/L32-ast';

import {
  makeSymbolSExp,
  makeEmptySExp,
  makeCompoundSExp,
  SExpValue,
} from './L32/L32-value';

// Convert value expression into SExp for quoting
const convertCExpToSExp = (exp: CExp): SExpValue => {
  if (isNumExp(exp)) return exp.val;
  if (isBoolExp(exp)) return exp.val;
  if (isStrExp(exp)) return exp.val;
  if (isVarRef(exp)) return makeSymbolSExp(exp.var);
  if (isLitExp(exp)) return exp.val;
  if (isPrimOp(exp)) return exp;
  return makeSymbolSExp(exp.toString());
};

// Step 2: Convert DictExp to AppExp(dict '((key . value)...))
const convertDictExp = (exp: DictExp): CExp => {
  const pairs = exp.entries.reduceRight<SExpValue>(
    (acc, entry) =>
      makeCompoundSExp(
        makeCompoundSExp(
          makeSymbolSExp(entry.key.val),
          convertCExpToSExp(entry.value)
        ),
        acc
      ),
    makeEmptySExp()
  );
  return makeAppExp(makeVarRef('dict'), [makeLitExp(pairs)]);
};

// Recursively rewrite expressions and convert DictExp to AppExp
const rewriteCExp = (exp: CExp): CExp =>
  isNumExp(exp) ||
  isBoolExp(exp) ||
  isStrExp(exp) ||
  isVarRef(exp) ||
  isLitExp(exp) ||
  isPrimOp(exp)
    ? exp
    : isIfExp(exp)
    ? {
        ...exp,
        test: rewriteCExp(exp.test),
        then: rewriteCExp(exp.then),
        alt: rewriteCExp(exp.alt),
      }
    : isProcExp(exp)
    ? { ...exp, body: exp.body.map(rewriteCExp) }
    : isAppExp(exp)
    ? isDictExp(exp.rator)
      ? makeAppExp(
          convertDictExp(exp.rator),
          [rewriteCExp(exp.rands[0])]
        )
      : makeAppExp(rewriteCExp(exp.rator), exp.rands.map(rewriteCExp))
    : isDictExp(exp)
    ? convertDictExp(exp)
    : exp;

// Step 4: Rewrite a top-level Exp
const rewriteExp = (exp: Exp): Exp =>
  isDefineExp(exp) ? { ...exp, val: rewriteCExp(exp.val) } : rewriteCExp(exp);

/*
Purpose: rewrite all occurrences of DictExp in a program to AppExp.
Signature: Dict2App (exp)
Type: Program -> Program
*/
export const Dict2App = (exp: Program): Program =>
  makeProgram(exp.exps.map(rewriteExp));

/*
Purpose: Transform L32 program to L3
Signature: L32ToL3(prog)
Type: Program -> Program
*/
export const L32toL3 = (exp: Program): Program => {
  const defineDict = makeDefineExp(
    makeVarDecl('dict'),
    makeProcExp(
      [makeVarDecl('pairs')],
      [
        makeProcExp(
          [makeVarDecl('k')],
          [
            makeIfExp(
              makeAppExp(
                makePrimOp('eq?'), [
                  makeAppExp(makePrimOp('car'), [
                    makeAppExp(makePrimOp('car'), [makeVarRef('pairs')])
                  ]),
                  makeVarRef('k')
                ]
              ),
              makeAppExp(makePrimOp('cdr'), [
                makeAppExp(makePrimOp('car'), [makeVarRef('pairs')])
              ]),
              makeAppExp(
                makeAppExp(makeVarRef('dict'), [
                  makeAppExp(makePrimOp('cdr'), [makeVarRef('pairs')])
                ]),
                [makeVarRef('k')]
              )
            )
          ]
        )
      ]
    )
  );

  return makeProgram([defineDict, ...Dict2App(exp).exps]);
};
