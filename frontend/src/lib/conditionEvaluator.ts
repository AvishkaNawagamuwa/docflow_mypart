import jsep, { type Expression } from 'jsep';

type JsonObject = Record<string, unknown>;

const isPlainObject = (value: unknown): value is JsonObject => {
  if (typeof value !== 'object' || value === null) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
};

const forbiddenMemberKeys = new Set(['__proto__', 'prototype', 'constructor']);

const getIdentifier = (name: string, ctx: JsonObject) => {
  if (name === 'true') return true;
  if (name === 'false') return false;
  if (name === 'null') return null;
  if (name === 'undefined') return undefined;
  return ctx[name];
};

const getMember = (obj: unknown, prop: unknown) => {
  if (typeof prop === 'string' && forbiddenMemberKeys.has(prop)) {
    throw new Error(`Access to member "${prop}" is not allowed`);
  }
  if (typeof prop === 'number' || typeof prop === 'string') {
    if (obj == null) return undefined;
    if (typeof obj === 'object' || typeof obj === 'function') {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (obj as any)[prop];
    }
  }
  return undefined;
};

const toNumber = (value: unknown) => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string' && value.trim() !== '' && !Number.isNaN(Number(value))) return Number(value);
  return NaN;
};

const evalAst = (ast: Expression, ctx: JsonObject): unknown => {
  switch (ast.type) {
    case 'Literal':
      return ast.value;
    case 'Identifier':
      return getIdentifier(ast.name, ctx);
    case 'ThisExpression':
      throw new Error('"this" is not allowed in conditions');
    case 'ArrayExpression':
      return ast.elements.map((el) => (el ? evalAst(el, ctx) : undefined));
    case 'ObjectExpression': {
      const out: JsonObject = {};
      for (const p of ast.properties) {
        if (p.type !== 'Property') throw new Error('Only plain object properties are allowed');
        const key = p.key.type === 'Identifier' ? p.key.name : String(evalAst(p.key, ctx));
        if (forbiddenMemberKeys.has(key)) throw new Error(`Key "${key}" is not allowed`);
        out[key] = evalAst(p.value, ctx);
      }
      return out;
    }
    case 'MemberExpression': {
      const obj = evalAst(ast.object, ctx);
      const prop = ast.computed ? evalAst(ast.property, ctx) : ast.property.type === 'Identifier' ? ast.property.name : undefined;
      return getMember(obj, prop);
    }
    case 'UnaryExpression': {
      const arg = evalAst(ast.argument, ctx);
      switch (ast.operator) {
        case '!':
          return !arg;
        case '+':
          return toNumber(arg);
        case '-':
          return -toNumber(arg);
        default:
          throw new Error(`Unsupported unary operator: ${ast.operator}`);
      }
    }
    case 'BinaryExpression': {
      const left = evalAst(ast.left, ctx);
      const right = evalAst(ast.right, ctx);
      switch (ast.operator) {
        case '==':
          // eslint-disable-next-line eqeqeq
          return (left as any) == (right as any);
        case '!=':
          // eslint-disable-next-line eqeqeq
          return (left as any) != (right as any);
        case '===':
          return left === right;
        case '!==':
          return left !== right;
        case '>':
          return toNumber(left) > toNumber(right);
        case '>=':
          return toNumber(left) >= toNumber(right);
        case '<':
          return toNumber(left) < toNumber(right);
        case '<=':
          return toNumber(left) <= toNumber(right);
        case '+':
          return (left as any) + (right as any);
        case '-':
          return toNumber(left) - toNumber(right);
        case '*':
          return toNumber(left) * toNumber(right);
        case '/':
          return toNumber(left) / toNumber(right);
        case '%':
          return toNumber(left) % toNumber(right);
        default:
          throw new Error(`Unsupported operator: ${ast.operator}`);
      }
    }
    case 'LogicalExpression': {
      const left = evalAst(ast.left, ctx);
      if (ast.operator === '&&') return left ? evalAst(ast.right, ctx) : left;
      if (ast.operator === '||') return left ? left : evalAst(ast.right, ctx);
      throw new Error(`Unsupported logical operator: ${ast.operator}`);
    }
    case 'ConditionalExpression': {
      const test = evalAst(ast.test, ctx);
      return test ? evalAst(ast.consequent, ctx) : evalAst(ast.alternate, ctx);
    }
    case 'CallExpression':
    case 'NewExpression':
    case 'UpdateExpression':
    case 'AssignmentExpression':
    case 'SequenceExpression':
      throw new Error(`Expression type "${ast.type}" is not allowed`);
    default:
      throw new Error(`Unsupported expression type: ${(ast as any).type}`);
  }
};

export type ConditionTestResult =
  | { ok: true; value: unknown; truthy: boolean }
  | { ok: false; error: string };

export const testConditionExpression = (expression: string, context: unknown): ConditionTestResult => {
  try {
    if (!expression.trim()) return { ok: false, error: 'Condition is empty' };
    if (!isPlainObject(context)) return { ok: false, error: 'Context must be a JSON object' };

    const ast = jsep(expression);
    const value = evalAst(ast, context);
    return { ok: true, value, truthy: !!value };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
};
