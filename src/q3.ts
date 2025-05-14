import {
  Exp,
  Program,
  isProgram,
  isDefineExp,
  isAppExp,
  isBoolExp,
  isIfExp,
  isLetExp,
  isLitExp,
  isNumExp,
  isPrimOp,
  isProcExp,
  isStrExp,
  isVarRef,
  AppExp,
} from './L3/L3-ast';
import { Result, makeOk } from './shared/result';

/*
Purpose: Transform L2 AST to JavaScript program string
Signature: l2ToJS(l2AST)
Type: [EXP | Program] => Result<string>
*/

export const l2ToJS = (exp: Exp | Program): Result<string> => {
  // Map from L2 primitives to JavaScript equivalents
  const jsOperatorMap: Record<string, string> = {
    '+': '+',
    '-': '-',
    '*': '*',
    '/': '/',
    '>': '>',
    '<': '<',
    '=': '===',
    'eq?': '===',
    and: '&&',
    or: '||',
    not: '!',
    'number?': "((x) => typeof(x) === 'number')",
    'boolean?': "((x) => typeof(x) === 'boolean')",
  };

  const isInfix = (op: string): boolean =>
    ['+', '-', '*', '/', '>', '<', '===', '&&', '||'].includes(op);

  const transformExp = (exp: Exp): string => {
    if (isNumExp(exp)) {
      return exp.val.toString();
    } else if (isBoolExp(exp)) {
      return exp.val.toString();
    } else if (isStrExp(exp)) {
      return exp.val;
    } else if (isVarRef(exp)) {
      return exp.var;
    } else if (isPrimOp(exp)) {
      return jsOperatorMap[exp.op];
    } else if (isIfExp(exp)) {
      return `(${transformExp(exp.test)} ? ${transformExp(
        exp.then
      )} : ${transformExp(exp.alt)})`;
    } else if (isProcExp(exp)) {
      const args = exp.args.map((arg) => arg.var).join(',');
      const body = transformExp(exp.body[0]); // Assuming body contains a single expression
      return `((${args}) => ${body})`;
    } else if (isAppExp(exp)) {
      if (isPrimOp(exp.rator)) {
        const op = exp.rator.op;

        if (op === 'number?' || op === 'boolean?') {
          // example: (number? 1) -> ((x) => typeof(x) === 'number')(1)
          return `${jsOperatorMap[op]}(${exp.rands
            .map(transformExp)
            .join(',')})`;
        } else if (op === 'not') {
          // example: (not x) -> (!x)
          return `(!${transformExp(exp.rands[0])})`;
        } else if (op in jsOperatorMap && isInfix(jsOperatorMap[op])) {
          // example: (+ 1 2) -> (1 + 2)
          return `(${exp.rands
            .map(transformExp)
            .join(` ${jsOperatorMap[op]} `)})`;
        }
      }

      // Normal function application - example: (f x) -> f(x)
      const rator = transformExp(exp.rator);
      const rands = exp.rands.map(transformExp).join(',');
      return `${rator}(${rands})`;
    } else if (isDefineExp(exp)) {
      return `const ${exp.var.var} = ${transformExp(exp.val)}`;
    } else {
      return '';
    }
  };

  if (isProgram(exp)) {
    return makeOk(exp.exps.map(transformExp).join(';\n'));
  } else {
    return makeOk(transformExp(exp));
  }
};
