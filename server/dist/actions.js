// @bun
// ../node_modules/zod/v4/core/core.js
var _a;
function $constructor(name, initializer, params) {
  function init(inst, def) {
    if (!inst._zod) {
      Object.defineProperty(inst, "_zod", {
        value: {
          def,
          constr: _,
          traits: new Set
        },
        enumerable: false
      });
    }
    if (inst._zod.traits.has(name)) {
      return;
    }
    inst._zod.traits.add(name);
    initializer(inst, def);
    const proto = _.prototype;
    const keys = Object.keys(proto);
    for (let i = 0;i < keys.length; i++) {
      const k = keys[i];
      if (!(k in inst)) {
        inst[k] = proto[k].bind(inst);
      }
    }
  }
  const Parent = params?.Parent ?? Object;

  class Definition extends Parent {
  }
  Object.defineProperty(Definition, "name", { value: name });
  function _(def) {
    var _a;
    const inst = params?.Parent ? new Definition : this;
    init(inst, def);
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    for (const fn of inst._zod.deferred) {
      fn();
    }
    return inst;
  }
  Object.defineProperty(_, "init", { value: init });
  Object.defineProperty(_, Symbol.hasInstance, {
    value: (inst) => {
      if (params?.Parent && inst instanceof params.Parent)
        return true;
      return inst?._zod?.traits?.has(name);
    }
  });
  Object.defineProperty(_, "name", { value: name });
  return _;
}
var $brand = Symbol("zod_brand");

class $ZodAsyncError extends Error {
  constructor() {
    super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
  }
}

class $ZodEncodeError extends Error {
  constructor(name) {
    super(`Encountered unidirectional transform during encode: ${name}`);
    this.name = "ZodEncodeError";
  }
}
(_a = globalThis).__zod_globalConfig ?? (_a.__zod_globalConfig = {});
var globalConfig = globalThis.__zod_globalConfig;
function config(newConfig) {
  if (newConfig)
    Object.assign(globalConfig, newConfig);
  return globalConfig;
}
// ../node_modules/zod/v4/core/util.js
function getEnumValues(entries) {
  const numericValues = Object.values(entries).filter((v) => typeof v === "number");
  const values = Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
  return values;
}
function jsonStringifyReplacer(_, value) {
  if (typeof value === "bigint")
    return value.toString();
  return value;
}
function cached(getter) {
  const set = false;
  return {
    get value() {
      if (!set) {
        const value = getter();
        Object.defineProperty(this, "value", { value });
        return value;
      }
      throw new Error("cached value already set");
    }
  };
}
function nullish(input) {
  return input === null || input === undefined;
}
function cleanRegex(source) {
  const start = source.startsWith("^") ? 1 : 0;
  const end = source.endsWith("$") ? source.length - 1 : source.length;
  return source.slice(start, end);
}
function floatSafeRemainder(val, step) {
  const ratio = val / step;
  const roundedRatio = Math.round(ratio);
  const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
  if (Math.abs(ratio - roundedRatio) < tolerance)
    return 0;
  return ratio - roundedRatio;
}
var EVALUATING = /* @__PURE__ */ Symbol("evaluating");
function defineLazy(object, key, getter) {
  let value = undefined;
  Object.defineProperty(object, key, {
    get() {
      if (value === EVALUATING) {
        return;
      }
      if (value === undefined) {
        value = EVALUATING;
        value = getter();
      }
      return value;
    },
    set(v) {
      Object.defineProperty(object, key, {
        value: v
      });
    },
    configurable: true
  });
}
function assignProp(target, prop, value) {
  Object.defineProperty(target, prop, {
    value,
    writable: true,
    enumerable: true,
    configurable: true
  });
}
function mergeDefs(...defs) {
  const mergedDescriptors = {};
  for (const def of defs) {
    const descriptors = Object.getOwnPropertyDescriptors(def);
    Object.assign(mergedDescriptors, descriptors);
  }
  return Object.defineProperties({}, mergedDescriptors);
}
function esc(str) {
  return JSON.stringify(str);
}
function slugify(input) {
  return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}
var captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
function isObject(data) {
  return typeof data === "object" && data !== null && !Array.isArray(data);
}
var allowsEval = /* @__PURE__ */ cached(() => {
  if (globalConfig.jitless) {
    return false;
  }
  if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) {
    return false;
  }
  try {
    const F = Function;
    new F("");
    return true;
  } catch (_) {
    return false;
  }
});
function isPlainObject(o) {
  if (isObject(o) === false)
    return false;
  const ctor = o.constructor;
  if (ctor === undefined)
    return true;
  if (typeof ctor !== "function")
    return true;
  const prot = ctor.prototype;
  if (isObject(prot) === false)
    return false;
  if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) {
    return false;
  }
  return true;
}
function shallowClone(o) {
  if (isPlainObject(o))
    return { ...o };
  if (Array.isArray(o))
    return [...o];
  if (o instanceof Map)
    return new Map(o);
  if (o instanceof Set)
    return new Set(o);
  return o;
}
var propertyKeyTypes = /* @__PURE__ */ new Set(["string", "number", "symbol"]);
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function clone(inst, def, params) {
  const cl = new inst._zod.constr(def ?? inst._zod.def);
  if (!def || params?.parent)
    cl._zod.parent = inst;
  return cl;
}
function normalizeParams(_params) {
  const params = _params;
  if (!params)
    return {};
  if (typeof params === "string")
    return { error: () => params };
  if (params?.message !== undefined) {
    if (params?.error !== undefined)
      throw new Error("Cannot specify both `message` and `error` params");
    params.error = params.message;
  }
  delete params.message;
  if (typeof params.error === "string")
    return { ...params, error: () => params.error };
  return params;
}
function optionalKeys(shape) {
  return Object.keys(shape).filter((k) => {
    return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
  });
}
var NUMBER_FORMAT_RANGES = {
  safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
  int32: [-2147483648, 2147483647],
  uint32: [0, 4294967295],
  float32: [-340282346638528860000000000000000000000, 340282346638528860000000000000000000000],
  float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
};
function pick(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".pick() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = {};
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        newShape[key] = currDef.shape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function omit(schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".omit() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const newShape = { ...schema._zod.def.shape };
      for (const key in mask) {
        if (!(key in currDef.shape)) {
          throw new Error(`Unrecognized key: "${key}"`);
        }
        if (!mask[key])
          continue;
        delete newShape[key];
      }
      assignProp(this, "shape", newShape);
      return newShape;
    },
    checks: []
  });
  return clone(schema, def);
}
function extend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to extend: expected a plain object");
  }
  const checks = schema._zod.def.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    const existingShape = schema._zod.def.shape;
    for (const key in shape) {
      if (Object.getOwnPropertyDescriptor(existingShape, key) !== undefined) {
        throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
      }
    }
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function safeExtend(schema, shape) {
  if (!isPlainObject(shape)) {
    throw new Error("Invalid input to safeExtend: expected a plain object");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const _shape = { ...schema._zod.def.shape, ...shape };
      assignProp(this, "shape", _shape);
      return _shape;
    }
  });
  return clone(schema, def);
}
function merge(a, b) {
  if (a._zod.def.checks?.length) {
    throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
  }
  const def = mergeDefs(a._zod.def, {
    get shape() {
      const _shape = { ...a._zod.def.shape, ...b._zod.def.shape };
      assignProp(this, "shape", _shape);
      return _shape;
    },
    get catchall() {
      return b._zod.def.catchall;
    },
    checks: b._zod.def.checks ?? []
  });
  return clone(a, def);
}
function partial(Class, schema, mask) {
  const currDef = schema._zod.def;
  const checks = currDef.checks;
  const hasChecks = checks && checks.length > 0;
  if (hasChecks) {
    throw new Error(".partial() cannot be used on object schemas containing refinements");
  }
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in oldShape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      } else {
        for (const key in oldShape) {
          shape[key] = Class ? new Class({
            type: "optional",
            innerType: oldShape[key]
          }) : oldShape[key];
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    },
    checks: []
  });
  return clone(schema, def);
}
function required(Class, schema, mask) {
  const def = mergeDefs(schema._zod.def, {
    get shape() {
      const oldShape = schema._zod.def.shape;
      const shape = { ...oldShape };
      if (mask) {
        for (const key in mask) {
          if (!(key in shape)) {
            throw new Error(`Unrecognized key: "${key}"`);
          }
          if (!mask[key])
            continue;
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      } else {
        for (const key in oldShape) {
          shape[key] = new Class({
            type: "nonoptional",
            innerType: oldShape[key]
          });
        }
      }
      assignProp(this, "shape", shape);
      return shape;
    }
  });
  return clone(schema, def);
}
function aborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue !== true) {
      return true;
    }
  }
  return false;
}
function explicitlyAborted(x, startIndex = 0) {
  if (x.aborted === true)
    return true;
  for (let i = startIndex;i < x.issues.length; i++) {
    if (x.issues[i]?.continue === false) {
      return true;
    }
  }
  return false;
}
function prefixIssues(path, issues) {
  return issues.map((iss) => {
    var _a;
    (_a = iss).path ?? (_a.path = []);
    iss.path.unshift(path);
    return iss;
  });
}
function unwrapMessage(message) {
  return typeof message === "string" ? message : message?.message;
}
function finalizeIssue(iss, ctx, config) {
  const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
  const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
  rest.path ?? (rest.path = []);
  rest.message = message;
  if (ctx?.reportInput) {
    rest.input = _input;
  }
  return rest;
}
function getLengthableOrigin(input) {
  if (Array.isArray(input))
    return "array";
  if (typeof input === "string")
    return "string";
  return "unknown";
}
function issue(...args) {
  const [iss, input, inst] = args;
  if (typeof iss === "string") {
    return {
      message: iss,
      code: "custom",
      input,
      inst
    };
  }
  return { ...iss };
}

// ../node_modules/zod/v4/core/errors.js
var initializer = (inst, def) => {
  inst.name = "$ZodError";
  Object.defineProperty(inst, "_zod", {
    value: inst._zod,
    enumerable: false
  });
  Object.defineProperty(inst, "issues", {
    value: def,
    enumerable: false
  });
  inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
  Object.defineProperty(inst, "toString", {
    value: () => inst.message,
    enumerable: false
  });
};
var $ZodError = $constructor("$ZodError", initializer);
var $ZodRealError = $constructor("$ZodError", initializer, { Parent: Error });
function flattenError(error, mapper = (issue) => issue.message) {
  const fieldErrors = {};
  const formErrors = [];
  for (const sub of error.issues) {
    if (sub.path.length > 0) {
      fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
      fieldErrors[sub.path[0]].push(mapper(sub));
    } else {
      formErrors.push(mapper(sub));
    }
  }
  return { formErrors, fieldErrors };
}
function formatError(error, mapper = (issue) => issue.message) {
  const fieldErrors = { _errors: [] };
  const processError = (error, path = []) => {
    for (const issue of error.issues) {
      if (issue.code === "invalid_union" && issue.errors.length) {
        issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
      } else if (issue.code === "invalid_key") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else if (issue.code === "invalid_element") {
        processError({ issues: issue.issues }, [...path, ...issue.path]);
      } else {
        const fullpath = [...path, ...issue.path];
        if (fullpath.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < fullpath.length) {
            const el = fullpath[i];
            const terminal = i === fullpath.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    }
  };
  processError(error);
  return fieldErrors;
}

// ../node_modules/zod/v4/core/parse.js
var _parse = (_Err) => (schema, value, _ctx, _params) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  if (result.issues.length) {
    const e = new (_params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, _params?.callee);
    throw e;
  }
  return result.value;
};
var _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  if (result.issues.length) {
    const e = new (params?.Err ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
    captureStackTrace(e, params?.callee);
    throw e;
  }
  return result.value;
};
var _safeParse = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: false } : { async: false };
  const result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise) {
    throw new $ZodAsyncError;
  }
  return result.issues.length ? {
    success: false,
    error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParse = /* @__PURE__ */ _safeParse($ZodRealError);
var _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, async: true } : { async: true };
  let result = schema._zod.run({ value, issues: [] }, ctx);
  if (result instanceof Promise)
    result = await result;
  return result.issues.length ? {
    success: false,
    error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  } : { success: true, data: result.value };
};
var safeParseAsync = /* @__PURE__ */ _safeParseAsync($ZodRealError);
var _encode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parse(_Err)(schema, value, ctx);
};
var _decode = (_Err) => (schema, value, _ctx) => {
  return _parse(_Err)(schema, value, _ctx);
};
var _encodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _parseAsync(_Err)(schema, value, ctx);
};
var _decodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _parseAsync(_Err)(schema, value, _ctx);
};
var _safeEncode = (_Err) => (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParse(_Err)(schema, value, ctx);
};
var _safeDecode = (_Err) => (schema, value, _ctx) => {
  return _safeParse(_Err)(schema, value, _ctx);
};
var _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
  const ctx = _ctx ? { ..._ctx, direction: "backward" } : { direction: "backward" };
  return _safeParseAsync(_Err)(schema, value, ctx);
};
var _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
  return _safeParseAsync(_Err)(schema, value, _ctx);
};
// ../node_modules/zod/v4/core/regexes.js
var cuid = /^[cC][0-9a-z]{6,}$/;
var cuid2 = /^[0-9a-z]+$/;
var ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
var xid = /^[0-9a-vA-V]{20}$/;
var ksuid = /^[A-Za-z0-9]{27}$/;
var nanoid = /^[a-zA-Z0-9_-]{21}$/;
var duration = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
var guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
var uuid = (version) => {
  if (!version)
    return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
  return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
};
var email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
var _emoji = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
function emoji() {
  return new RegExp(_emoji, "u");
}
var ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
var cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
var cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
var base64url = /^[A-Za-z0-9_-]*$/;
var httpProtocol = /^https?$/;
var e164 = /^\+[1-9]\d{6,14}$/;
var dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
var date = /* @__PURE__ */ new RegExp(`^${dateSource}$`);
function timeSource(args) {
  const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
  const regex = typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
  return regex;
}
function time(args) {
  return new RegExp(`^${timeSource(args)}$`);
}
function datetime(args) {
  const time = timeSource({ precision: args.precision });
  const opts = ["Z"];
  if (args.local)
    opts.push("");
  if (args.offset)
    opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
  const timeRegex = `${time}(?:${opts.join("|")})`;
  return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
}
var string = (params) => {
  const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
  return new RegExp(`^${regex}$`);
};
var integer = /^-?\d+$/;
var number = /^-?\d+(?:\.\d+)?$/;
var boolean = /^(?:true|false)$/i;
var lowercase = /^[^A-Z]*$/;
var uppercase = /^[^a-z]*$/;

// ../node_modules/zod/v4/core/checks.js
var $ZodCheck = /* @__PURE__ */ $constructor("$ZodCheck", (inst, def) => {
  var _a;
  inst._zod ?? (inst._zod = {});
  inst._zod.def = def;
  (_a = inst._zod).onattach ?? (_a.onattach = []);
});
var numericOriginMap = {
  number: "number",
  bigint: "bigint",
  object: "date"
};
var $ZodCheckLessThan = /* @__PURE__ */ $constructor("$ZodCheckLessThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
    if (def.value < curr) {
      if (def.inclusive)
        bag.maximum = def.value;
      else
        bag.exclusiveMaximum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value <= def.value : payload.value < def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckGreaterThan = /* @__PURE__ */ $constructor("$ZodCheckGreaterThan", (inst, def) => {
  $ZodCheck.init(inst, def);
  const origin = numericOriginMap[typeof def.value];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
    if (def.value > curr) {
      if (def.inclusive)
        bag.minimum = def.value;
      else
        bag.exclusiveMinimum = def.value;
    }
  });
  inst._zod.check = (payload) => {
    if (def.inclusive ? payload.value >= def.value : payload.value > def.value) {
      return;
    }
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
      input: payload.value,
      inclusive: def.inclusive,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMultipleOf = /* @__PURE__ */ $constructor("$ZodCheckMultipleOf", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    var _a;
    (_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
  });
  inst._zod.check = (payload) => {
    if (typeof payload.value !== typeof def.value)
      throw new Error("Cannot mix number and bigint in multiple_of check.");
    const isMultiple = typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0;
    if (isMultiple)
      return;
    payload.issues.push({
      origin: typeof payload.value,
      code: "not_multiple_of",
      divisor: def.value,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckNumberFormat = /* @__PURE__ */ $constructor("$ZodCheckNumberFormat", (inst, def) => {
  $ZodCheck.init(inst, def);
  def.format = def.format || "float64";
  const isInt = def.format?.includes("int");
  const origin = isInt ? "int" : "number";
  const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    bag.minimum = minimum;
    bag.maximum = maximum;
    if (isInt)
      bag.pattern = integer;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    if (isInt) {
      if (!Number.isInteger(input)) {
        payload.issues.push({
          expected: origin,
          format: def.format,
          code: "invalid_type",
          continue: false,
          input,
          inst
        });
        return;
      }
      if (!Number.isSafeInteger(input)) {
        if (input > 0) {
          payload.issues.push({
            input,
            code: "too_big",
            maximum: Number.MAX_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        } else {
          payload.issues.push({
            input,
            code: "too_small",
            minimum: Number.MIN_SAFE_INTEGER,
            note: "Integers must be within the safe integer range.",
            inst,
            origin,
            inclusive: true,
            continue: !def.abort
          });
        }
        return;
      }
    }
    if (input < minimum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_small",
        minimum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
    if (input > maximum) {
      payload.issues.push({
        origin: "number",
        input,
        code: "too_big",
        maximum,
        inclusive: true,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCheckMaxLength = /* @__PURE__ */ $constructor("$ZodCheckMaxLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
    if (def.maximum < curr)
      inst._zod.bag.maximum = def.maximum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length <= def.maximum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_big",
      maximum: def.maximum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckMinLength = /* @__PURE__ */ $constructor("$ZodCheckMinLength", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
    if (def.minimum > curr)
      inst._zod.bag.minimum = def.minimum;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length >= def.minimum)
      return;
    const origin = getLengthableOrigin(input);
    payload.issues.push({
      origin,
      code: "too_small",
      minimum: def.minimum,
      inclusive: true,
      input,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLengthEquals = /* @__PURE__ */ $constructor("$ZodCheckLengthEquals", (inst, def) => {
  var _a;
  $ZodCheck.init(inst, def);
  (_a = inst._zod.def).when ?? (_a.when = (payload) => {
    const val = payload.value;
    return !nullish(val) && val.length !== undefined;
  });
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.minimum = def.length;
    bag.maximum = def.length;
    bag.length = def.length;
  });
  inst._zod.check = (payload) => {
    const input = payload.value;
    const length = input.length;
    if (length === def.length)
      return;
    const origin = getLengthableOrigin(input);
    const tooBig = length > def.length;
    payload.issues.push({
      origin,
      ...tooBig ? { code: "too_big", maximum: def.length } : { code: "too_small", minimum: def.length },
      inclusive: true,
      exact: true,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStringFormat = /* @__PURE__ */ $constructor("$ZodCheckStringFormat", (inst, def) => {
  var _a, _b;
  $ZodCheck.init(inst, def);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.format = def.format;
    if (def.pattern) {
      bag.patterns ?? (bag.patterns = new Set);
      bag.patterns.add(def.pattern);
    }
  });
  if (def.pattern)
    (_a = inst._zod).check ?? (_a.check = (payload) => {
      def.pattern.lastIndex = 0;
      if (def.pattern.test(payload.value))
        return;
      payload.issues.push({
        origin: "string",
        code: "invalid_format",
        format: def.format,
        input: payload.value,
        ...def.pattern ? { pattern: def.pattern.toString() } : {},
        inst,
        continue: !def.abort
      });
    });
  else
    (_b = inst._zod).check ?? (_b.check = () => {});
});
var $ZodCheckRegex = /* @__PURE__ */ $constructor("$ZodCheckRegex", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    def.pattern.lastIndex = 0;
    if (def.pattern.test(payload.value))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "regex",
      input: payload.value,
      pattern: def.pattern.toString(),
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckLowerCase = /* @__PURE__ */ $constructor("$ZodCheckLowerCase", (inst, def) => {
  def.pattern ?? (def.pattern = lowercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckUpperCase = /* @__PURE__ */ $constructor("$ZodCheckUpperCase", (inst, def) => {
  def.pattern ?? (def.pattern = uppercase);
  $ZodCheckStringFormat.init(inst, def);
});
var $ZodCheckIncludes = /* @__PURE__ */ $constructor("$ZodCheckIncludes", (inst, def) => {
  $ZodCheck.init(inst, def);
  const escapedRegex = escapeRegex(def.includes);
  const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
  def.pattern = pattern;
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.includes(def.includes, def.position))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "includes",
      includes: def.includes,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckStartsWith = /* @__PURE__ */ $constructor("$ZodCheckStartsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.startsWith(def.prefix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "starts_with",
      prefix: def.prefix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckEndsWith = /* @__PURE__ */ $constructor("$ZodCheckEndsWith", (inst, def) => {
  $ZodCheck.init(inst, def);
  const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
  def.pattern ?? (def.pattern = pattern);
  inst._zod.onattach.push((inst) => {
    const bag = inst._zod.bag;
    bag.patterns ?? (bag.patterns = new Set);
    bag.patterns.add(pattern);
  });
  inst._zod.check = (payload) => {
    if (payload.value.endsWith(def.suffix))
      return;
    payload.issues.push({
      origin: "string",
      code: "invalid_format",
      format: "ends_with",
      suffix: def.suffix,
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodCheckOverwrite = /* @__PURE__ */ $constructor("$ZodCheckOverwrite", (inst, def) => {
  $ZodCheck.init(inst, def);
  inst._zod.check = (payload) => {
    payload.value = def.tx(payload.value);
  };
});

// ../node_modules/zod/v4/core/doc.js
class Doc {
  constructor(args = []) {
    this.content = [];
    this.indent = 0;
    if (this)
      this.args = args;
  }
  indented(fn) {
    this.indent += 1;
    fn(this);
    this.indent -= 1;
  }
  write(arg) {
    if (typeof arg === "function") {
      arg(this, { execution: "sync" });
      arg(this, { execution: "async" });
      return;
    }
    const content = arg;
    const lines = content.split(`
`).filter((x) => x);
    const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
    const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
    for (const line of dedented) {
      this.content.push(line);
    }
  }
  compile() {
    const F = Function;
    const args = this?.args;
    const content = this?.content ?? [``];
    const lines = [...content.map((x) => `  ${x}`)];
    return new F(...args, lines.join(`
`));
  }
}

// ../node_modules/zod/v4/core/versions.js
var version = {
  major: 4,
  minor: 4,
  patch: 3
};

// ../node_modules/zod/v4/core/schemas.js
var $ZodType = /* @__PURE__ */ $constructor("$ZodType", (inst, def) => {
  var _a;
  inst ?? (inst = {});
  inst._zod.def = def;
  inst._zod.bag = inst._zod.bag || {};
  inst._zod.version = version;
  const checks = [...inst._zod.def.checks ?? []];
  if (inst._zod.traits.has("$ZodCheck")) {
    checks.unshift(inst);
  }
  for (const ch of checks) {
    for (const fn of ch._zod.onattach) {
      fn(inst);
    }
  }
  if (checks.length === 0) {
    (_a = inst._zod).deferred ?? (_a.deferred = []);
    inst._zod.deferred?.push(() => {
      inst._zod.run = inst._zod.parse;
    });
  } else {
    const runChecks = (payload, checks, ctx) => {
      let isAborted = aborted(payload);
      let asyncResult;
      for (const ch of checks) {
        if (ch._zod.def.when) {
          if (explicitlyAborted(payload))
            continue;
          const shouldRun = ch._zod.def.when(payload);
          if (!shouldRun)
            continue;
        } else if (isAborted) {
          continue;
        }
        const currLen = payload.issues.length;
        const _ = ch._zod.check(payload);
        if (_ instanceof Promise && ctx?.async === false) {
          throw new $ZodAsyncError;
        }
        if (asyncResult || _ instanceof Promise) {
          asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
            await _;
            const nextLen = payload.issues.length;
            if (nextLen === currLen)
              return;
            if (!isAborted)
              isAborted = aborted(payload, currLen);
          });
        } else {
          const nextLen = payload.issues.length;
          if (nextLen === currLen)
            continue;
          if (!isAborted)
            isAborted = aborted(payload, currLen);
        }
      }
      if (asyncResult) {
        return asyncResult.then(() => {
          return payload;
        });
      }
      return payload;
    };
    const handleCanaryResult = (canary, payload, ctx) => {
      if (aborted(canary)) {
        canary.aborted = true;
        return canary;
      }
      const checkResult = runChecks(payload, checks, ctx);
      if (checkResult instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
      }
      return inst._zod.parse(checkResult, ctx);
    };
    inst._zod.run = (payload, ctx) => {
      if (ctx.skipChecks) {
        return inst._zod.parse(payload, ctx);
      }
      if (ctx.direction === "backward") {
        const canary = inst._zod.parse({ value: payload.value, issues: [] }, { ...ctx, skipChecks: true });
        if (canary instanceof Promise) {
          return canary.then((canary) => {
            return handleCanaryResult(canary, payload, ctx);
          });
        }
        return handleCanaryResult(canary, payload, ctx);
      }
      const result = inst._zod.parse(payload, ctx);
      if (result instanceof Promise) {
        if (ctx.async === false)
          throw new $ZodAsyncError;
        return result.then((result) => runChecks(result, checks, ctx));
      }
      return runChecks(result, checks, ctx);
    };
  }
  defineLazy(inst, "~standard", () => ({
    validate: (value) => {
      try {
        const r = safeParse(inst, value);
        return r.success ? { value: r.data } : { issues: r.error?.issues };
      } catch (_) {
        return safeParseAsync(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
      }
    },
    vendor: "zod",
    version: 1
  }));
});
var $ZodString = /* @__PURE__ */ $constructor("$ZodString", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string(inst._zod.bag);
  inst._zod.parse = (payload, _) => {
    if (def.coerce)
      try {
        payload.value = String(payload.value);
      } catch (_) {}
    if (typeof payload.value === "string")
      return payload;
    payload.issues.push({
      expected: "string",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
var $ZodStringFormat = /* @__PURE__ */ $constructor("$ZodStringFormat", (inst, def) => {
  $ZodCheckStringFormat.init(inst, def);
  $ZodString.init(inst, def);
});
var $ZodGUID = /* @__PURE__ */ $constructor("$ZodGUID", (inst, def) => {
  def.pattern ?? (def.pattern = guid);
  $ZodStringFormat.init(inst, def);
});
var $ZodUUID = /* @__PURE__ */ $constructor("$ZodUUID", (inst, def) => {
  if (def.version) {
    const versionMap = {
      v1: 1,
      v2: 2,
      v3: 3,
      v4: 4,
      v5: 5,
      v6: 6,
      v7: 7,
      v8: 8
    };
    const v = versionMap[def.version];
    if (v === undefined)
      throw new Error(`Invalid UUID version: "${def.version}"`);
    def.pattern ?? (def.pattern = uuid(v));
  } else
    def.pattern ?? (def.pattern = uuid());
  $ZodStringFormat.init(inst, def);
});
var $ZodEmail = /* @__PURE__ */ $constructor("$ZodEmail", (inst, def) => {
  def.pattern ?? (def.pattern = email);
  $ZodStringFormat.init(inst, def);
});
var $ZodURL = /* @__PURE__ */ $constructor("$ZodURL", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    try {
      const trimmed = payload.value.trim();
      if (!def.normalize && def.protocol?.source === httpProtocol.source) {
        if (!/^https?:\/\//i.test(trimmed)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid URL format",
            input: payload.value,
            inst,
            continue: !def.abort
          });
          return;
        }
      }
      const url = new URL(trimmed);
      if (def.hostname) {
        def.hostname.lastIndex = 0;
        if (!def.hostname.test(url.hostname)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid hostname",
            pattern: def.hostname.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.protocol) {
        def.protocol.lastIndex = 0;
        if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) {
          payload.issues.push({
            code: "invalid_format",
            format: "url",
            note: "Invalid protocol",
            pattern: def.protocol.source,
            input: payload.value,
            inst,
            continue: !def.abort
          });
        }
      }
      if (def.normalize) {
        payload.value = url.href;
      } else {
        payload.value = trimmed;
      }
      return;
    } catch (_) {
      payload.issues.push({
        code: "invalid_format",
        format: "url",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodEmoji = /* @__PURE__ */ $constructor("$ZodEmoji", (inst, def) => {
  def.pattern ?? (def.pattern = emoji());
  $ZodStringFormat.init(inst, def);
});
var $ZodNanoID = /* @__PURE__ */ $constructor("$ZodNanoID", (inst, def) => {
  def.pattern ?? (def.pattern = nanoid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID = /* @__PURE__ */ $constructor("$ZodCUID", (inst, def) => {
  def.pattern ?? (def.pattern = cuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodCUID2 = /* @__PURE__ */ $constructor("$ZodCUID2", (inst, def) => {
  def.pattern ?? (def.pattern = cuid2);
  $ZodStringFormat.init(inst, def);
});
var $ZodULID = /* @__PURE__ */ $constructor("$ZodULID", (inst, def) => {
  def.pattern ?? (def.pattern = ulid);
  $ZodStringFormat.init(inst, def);
});
var $ZodXID = /* @__PURE__ */ $constructor("$ZodXID", (inst, def) => {
  def.pattern ?? (def.pattern = xid);
  $ZodStringFormat.init(inst, def);
});
var $ZodKSUID = /* @__PURE__ */ $constructor("$ZodKSUID", (inst, def) => {
  def.pattern ?? (def.pattern = ksuid);
  $ZodStringFormat.init(inst, def);
});
var $ZodISODateTime = /* @__PURE__ */ $constructor("$ZodISODateTime", (inst, def) => {
  def.pattern ?? (def.pattern = datetime(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODate = /* @__PURE__ */ $constructor("$ZodISODate", (inst, def) => {
  def.pattern ?? (def.pattern = date);
  $ZodStringFormat.init(inst, def);
});
var $ZodISOTime = /* @__PURE__ */ $constructor("$ZodISOTime", (inst, def) => {
  def.pattern ?? (def.pattern = time(def));
  $ZodStringFormat.init(inst, def);
});
var $ZodISODuration = /* @__PURE__ */ $constructor("$ZodISODuration", (inst, def) => {
  def.pattern ?? (def.pattern = duration);
  $ZodStringFormat.init(inst, def);
});
var $ZodIPv4 = /* @__PURE__ */ $constructor("$ZodIPv4", (inst, def) => {
  def.pattern ?? (def.pattern = ipv4);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv4`;
});
var $ZodIPv6 = /* @__PURE__ */ $constructor("$ZodIPv6", (inst, def) => {
  def.pattern ?? (def.pattern = ipv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.format = `ipv6`;
  inst._zod.check = (payload) => {
    try {
      new URL(`http://[${payload.value}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "ipv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
var $ZodCIDRv4 = /* @__PURE__ */ $constructor("$ZodCIDRv4", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv4);
  $ZodStringFormat.init(inst, def);
});
var $ZodCIDRv6 = /* @__PURE__ */ $constructor("$ZodCIDRv6", (inst, def) => {
  def.pattern ?? (def.pattern = cidrv6);
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    const parts = payload.value.split("/");
    try {
      if (parts.length !== 2)
        throw new Error;
      const [address, prefix] = parts;
      if (!prefix)
        throw new Error;
      const prefixNum = Number(prefix);
      if (`${prefixNum}` !== prefix)
        throw new Error;
      if (prefixNum < 0 || prefixNum > 128)
        throw new Error;
      new URL(`http://[${address}]`);
    } catch {
      payload.issues.push({
        code: "invalid_format",
        format: "cidrv6",
        input: payload.value,
        inst,
        continue: !def.abort
      });
    }
  };
});
function isValidBase64(data) {
  if (data === "")
    return true;
  if (/\s/.test(data))
    return false;
  if (data.length % 4 !== 0)
    return false;
  try {
    atob(data);
    return true;
  } catch {
    return false;
  }
}
var $ZodBase64 = /* @__PURE__ */ $constructor("$ZodBase64", (inst, def) => {
  def.pattern ?? (def.pattern = base64);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64";
  inst._zod.check = (payload) => {
    if (isValidBase64(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
function isValidBase64URL(data) {
  if (!base64url.test(data))
    return false;
  const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return isValidBase64(padded);
}
var $ZodBase64URL = /* @__PURE__ */ $constructor("$ZodBase64URL", (inst, def) => {
  def.pattern ?? (def.pattern = base64url);
  $ZodStringFormat.init(inst, def);
  inst._zod.bag.contentEncoding = "base64url";
  inst._zod.check = (payload) => {
    if (isValidBase64URL(payload.value))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "base64url",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodE164 = /* @__PURE__ */ $constructor("$ZodE164", (inst, def) => {
  def.pattern ?? (def.pattern = e164);
  $ZodStringFormat.init(inst, def);
});
function isValidJWT(token, algorithm = null) {
  try {
    const tokensParts = token.split(".");
    if (tokensParts.length !== 3)
      return false;
    const [header] = tokensParts;
    if (!header)
      return false;
    const parsedHeader = JSON.parse(atob(header));
    if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT")
      return false;
    if (!parsedHeader.alg)
      return false;
    if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm))
      return false;
    return true;
  } catch {
    return false;
  }
}
var $ZodJWT = /* @__PURE__ */ $constructor("$ZodJWT", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  inst._zod.check = (payload) => {
    if (isValidJWT(payload.value, def.alg))
      return;
    payload.issues.push({
      code: "invalid_format",
      format: "jwt",
      input: payload.value,
      inst,
      continue: !def.abort
    });
  };
});
var $ZodNumber = /* @__PURE__ */ $constructor("$ZodNumber", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = inst._zod.bag.pattern ?? number;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Number(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) {
      return payload;
    }
    const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : undefined : undefined;
    payload.issues.push({
      expected: "number",
      code: "invalid_type",
      input,
      inst,
      ...received ? { received } : {}
    });
    return payload;
  };
});
var $ZodNumberFormat = /* @__PURE__ */ $constructor("$ZodNumberFormat", (inst, def) => {
  $ZodCheckNumberFormat.init(inst, def);
  $ZodNumber.init(inst, def);
});
var $ZodBoolean = /* @__PURE__ */ $constructor("$ZodBoolean", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.pattern = boolean;
  inst._zod.parse = (payload, _ctx) => {
    if (def.coerce)
      try {
        payload.value = Boolean(payload.value);
      } catch (_) {}
    const input = payload.value;
    if (typeof input === "boolean")
      return payload;
    payload.issues.push({
      expected: "boolean",
      code: "invalid_type",
      input,
      inst
    });
    return payload;
  };
});
var $ZodUnknown = /* @__PURE__ */ $constructor("$ZodUnknown", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload) => payload;
});
var $ZodNever = /* @__PURE__ */ $constructor("$ZodNever", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _ctx) => {
    payload.issues.push({
      expected: "never",
      code: "invalid_type",
      input: payload.value,
      inst
    });
    return payload;
  };
});
function handleArrayResult(result, final, index) {
  if (result.issues.length) {
    final.issues.push(...prefixIssues(index, result.issues));
  }
  final.value[index] = result.value;
}
var $ZodArray = /* @__PURE__ */ $constructor("$ZodArray", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    if (!Array.isArray(input)) {
      payload.issues.push({
        expected: "array",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = Array(input.length);
    const proms = [];
    for (let i = 0;i < input.length; i++) {
      const item = input[i];
      const result = def.element._zod.run({
        value: item,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        proms.push(result.then((result) => handleArrayResult(result, payload, i)));
      } else {
        handleArrayResult(result, payload, i);
      }
    }
    if (proms.length) {
      return Promise.all(proms).then(() => payload);
    }
    return payload;
  };
});
function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
  const isPresent = key in input;
  if (result.issues.length) {
    if (isOptionalIn && isOptionalOut && !isPresent) {
      return;
    }
    final.issues.push(...prefixIssues(key, result.issues));
  }
  if (!isPresent && !isOptionalIn) {
    if (!result.issues.length) {
      final.issues.push({
        code: "invalid_type",
        expected: "nonoptional",
        input: undefined,
        path: [key]
      });
    }
    return;
  }
  if (result.value === undefined) {
    if (isPresent) {
      final.value[key] = undefined;
    }
  } else {
    final.value[key] = result.value;
  }
}
function normalizeDef(def) {
  const keys = Object.keys(def.shape);
  for (const k of keys) {
    if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) {
      throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
    }
  }
  const okeys = optionalKeys(def.shape);
  return {
    ...def,
    keys,
    keySet: new Set(keys),
    numKeys: keys.length,
    optionalKeys: new Set(okeys)
  };
}
function handleCatchall(proms, input, payload, ctx, def, inst) {
  const unrecognized = [];
  const keySet = def.keySet;
  const _catchall = def.catchall._zod;
  const t = _catchall.def.type;
  const isOptionalIn = _catchall.optin === "optional";
  const isOptionalOut = _catchall.optout === "optional";
  for (const key in input) {
    if (key === "__proto__")
      continue;
    if (keySet.has(key))
      continue;
    if (t === "never") {
      unrecognized.push(key);
      continue;
    }
    const r = _catchall.run({ value: input[key], issues: [] }, ctx);
    if (r instanceof Promise) {
      proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
    } else {
      handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
    }
  }
  if (unrecognized.length) {
    payload.issues.push({
      code: "unrecognized_keys",
      keys: unrecognized,
      input,
      inst
    });
  }
  if (!proms.length)
    return payload;
  return Promise.all(proms).then(() => {
    return payload;
  });
}
var $ZodObject = /* @__PURE__ */ $constructor("$ZodObject", (inst, def) => {
  $ZodType.init(inst, def);
  const desc = Object.getOwnPropertyDescriptor(def, "shape");
  if (!desc?.get) {
    const sh = def.shape;
    Object.defineProperty(def, "shape", {
      get: () => {
        const newSh = { ...sh };
        Object.defineProperty(def, "shape", {
          value: newSh
        });
        return newSh;
      }
    });
  }
  const _normalized = cached(() => normalizeDef(def));
  defineLazy(inst._zod, "propValues", () => {
    const shape = def.shape;
    const propValues = {};
    for (const key in shape) {
      const field = shape[key]._zod;
      if (field.values) {
        propValues[key] ?? (propValues[key] = new Set);
        for (const v of field.values)
          propValues[key].add(v);
      }
    }
    return propValues;
  });
  const isObject2 = isObject;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    payload.value = {};
    const proms = [];
    const shape = value.shape;
    for (const key of value.keys) {
      const el = shape[key];
      const isOptionalIn = el._zod.optin === "optional";
      const isOptionalOut = el._zod.optout === "optional";
      const r = el._zod.run({ value: input[key], issues: [] }, ctx);
      if (r instanceof Promise) {
        proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
      } else {
        handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
      }
    }
    if (!catchall) {
      return proms.length ? Promise.all(proms).then(() => payload) : payload;
    }
    return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
  };
});
var $ZodObjectJIT = /* @__PURE__ */ $constructor("$ZodObjectJIT", (inst, def) => {
  $ZodObject.init(inst, def);
  const superParse = inst._zod.parse;
  const _normalized = cached(() => normalizeDef(def));
  const generateFastpass = (shape) => {
    const doc = new Doc(["shape", "payload", "ctx"]);
    const normalized = _normalized.value;
    const parseStr = (key) => {
      const k = esc(key);
      return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
    };
    doc.write(`const input = payload.value;`);
    const ids = Object.create(null);
    let counter = 0;
    for (const key of normalized.keys) {
      ids[key] = `key_${counter++}`;
    }
    doc.write(`const newResult = {};`);
    for (const key of normalized.keys) {
      const id = ids[key];
      const k = esc(key);
      const schema = shape[key];
      const isOptionalIn = schema?._zod?.optin === "optional";
      const isOptionalOut = schema?._zod?.optout === "optional";
      doc.write(`const ${id} = ${parseStr(key)};`);
      if (isOptionalIn && isOptionalOut) {
        doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      } else if (!isOptionalIn) {
        doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
      } else {
        doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
      }
    }
    doc.write(`payload.value = newResult;`);
    doc.write(`return payload;`);
    const fn = doc.compile();
    return (payload, ctx) => fn(shape, payload, ctx);
  };
  let fastpass;
  const isObject2 = isObject;
  const jit = !globalConfig.jitless;
  const allowsEval2 = allowsEval;
  const fastEnabled = jit && allowsEval2.value;
  const catchall = def.catchall;
  let value;
  inst._zod.parse = (payload, ctx) => {
    value ?? (value = _normalized.value);
    const input = payload.value;
    if (!isObject2(input)) {
      payload.issues.push({
        expected: "object",
        code: "invalid_type",
        input,
        inst
      });
      return payload;
    }
    if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
      if (!fastpass)
        fastpass = generateFastpass(def.shape);
      payload = fastpass(payload, ctx);
      if (!catchall)
        return payload;
      return handleCatchall([], input, payload, ctx, value, inst);
    }
    return superParse(payload, ctx);
  };
});
function handleUnionResults(results, final, inst, ctx) {
  for (const result of results) {
    if (result.issues.length === 0) {
      final.value = result.value;
      return final;
    }
  }
  const nonaborted = results.filter((r) => !aborted(r));
  if (nonaborted.length === 1) {
    final.value = nonaborted[0].value;
    return nonaborted[0];
  }
  final.issues.push({
    code: "invalid_union",
    input: final.value,
    inst,
    errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
  });
  return final;
}
var $ZodUnion = /* @__PURE__ */ $constructor("$ZodUnion", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : undefined);
  defineLazy(inst._zod, "values", () => {
    if (def.options.every((o) => o._zod.values)) {
      return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
    }
    return;
  });
  defineLazy(inst._zod, "pattern", () => {
    if (def.options.every((o) => o._zod.pattern)) {
      const patterns = def.options.map((o) => o._zod.pattern);
      return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
    }
    return;
  });
  const first = def.options.length === 1 ? def.options[0]._zod.run : null;
  inst._zod.parse = (payload, ctx) => {
    if (first) {
      return first(payload, ctx);
    }
    let async = false;
    const results = [];
    for (const option of def.options) {
      const result = option._zod.run({
        value: payload.value,
        issues: []
      }, ctx);
      if (result instanceof Promise) {
        results.push(result);
        async = true;
      } else {
        if (result.issues.length === 0)
          return result;
        results.push(result);
      }
    }
    if (!async)
      return handleUnionResults(results, payload, inst, ctx);
    return Promise.all(results).then((results) => {
      return handleUnionResults(results, payload, inst, ctx);
    });
  };
});
var $ZodIntersection = /* @__PURE__ */ $constructor("$ZodIntersection", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, ctx) => {
    const input = payload.value;
    const left = def.left._zod.run({ value: input, issues: [] }, ctx);
    const right = def.right._zod.run({ value: input, issues: [] }, ctx);
    const async = left instanceof Promise || right instanceof Promise;
    if (async) {
      return Promise.all([left, right]).then(([left, right]) => {
        return handleIntersectionResults(payload, left, right);
      });
    }
    return handleIntersectionResults(payload, left, right);
  };
});
function mergeValues(a, b) {
  if (a === b) {
    return { valid: true, data: a };
  }
  if (a instanceof Date && b instanceof Date && +a === +b) {
    return { valid: true, data: a };
  }
  if (isPlainObject(a) && isPlainObject(b)) {
    const bKeys = Object.keys(b);
    const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
        };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  }
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return { valid: false, mergeErrorPath: [] };
    }
    const newArray = [];
    for (let index = 0;index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return {
          valid: false,
          mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
        };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  }
  return { valid: false, mergeErrorPath: [] };
}
function handleIntersectionResults(result, left, right) {
  const unrecKeys = new Map;
  let unrecIssue;
  for (const iss of left.issues) {
    if (iss.code === "unrecognized_keys") {
      unrecIssue ?? (unrecIssue = iss);
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).l = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  for (const iss of right.issues) {
    if (iss.code === "unrecognized_keys") {
      for (const k of iss.keys) {
        if (!unrecKeys.has(k))
          unrecKeys.set(k, {});
        unrecKeys.get(k).r = true;
      }
    } else {
      result.issues.push(iss);
    }
  }
  const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
  if (bothKeys.length && unrecIssue) {
    result.issues.push({ ...unrecIssue, keys: bothKeys });
  }
  if (aborted(result))
    return result;
  const merged = mergeValues(left.value, right.value);
  if (!merged.valid) {
    throw new Error(`Unmergable intersection. Error path: ` + `${JSON.stringify(merged.mergeErrorPath)}`);
  }
  result.value = merged.data;
  return result;
}
var $ZodEnum = /* @__PURE__ */ $constructor("$ZodEnum", (inst, def) => {
  $ZodType.init(inst, def);
  const values = getEnumValues(def.entries);
  const valuesSet = new Set(values);
  inst._zod.values = valuesSet;
  inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
  inst._zod.parse = (payload, _ctx) => {
    const input = payload.value;
    if (valuesSet.has(input)) {
      return payload;
    }
    payload.issues.push({
      code: "invalid_value",
      values,
      input,
      inst
    });
    return payload;
  };
});
var $ZodTransform = /* @__PURE__ */ $constructor("$ZodTransform", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    const _out = def.transform(payload.value, payload);
    if (ctx.async) {
      const output = _out instanceof Promise ? _out : Promise.resolve(_out);
      return output.then((output) => {
        payload.value = output;
        payload.fallback = true;
        return payload;
      });
    }
    if (_out instanceof Promise) {
      throw new $ZodAsyncError;
    }
    payload.value = _out;
    payload.fallback = true;
    return payload;
  };
});
function handleOptionalResult(result, input) {
  if (input === undefined && (result.issues.length || result.fallback)) {
    return { issues: [], value: undefined };
  }
  return result;
}
var $ZodOptional = /* @__PURE__ */ $constructor("$ZodOptional", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  inst._zod.optout = "optional";
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, undefined]) : undefined;
  });
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (def.innerType._zod.optin === "optional") {
      const input = payload.value;
      const result = def.innerType._zod.run(payload, ctx);
      if (result instanceof Promise)
        return result.then((r) => handleOptionalResult(r, input));
      return handleOptionalResult(result, input);
    }
    if (payload.value === undefined) {
      return payload;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodExactOptional = /* @__PURE__ */ $constructor("$ZodExactOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
  inst._zod.parse = (payload, ctx) => {
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNullable = /* @__PURE__ */ $constructor("$ZodNullable", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "pattern", () => {
    const pattern = def.innerType._zod.pattern;
    return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : undefined;
  });
  defineLazy(inst._zod, "values", () => {
    return def.innerType._zod.values ? new Set([...def.innerType._zod.values, null]) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    if (payload.value === null)
      return payload;
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodDefault = /* @__PURE__ */ $constructor("$ZodDefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
      return payload;
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleDefaultResult(result, def));
    }
    return handleDefaultResult(result, def);
  };
});
function handleDefaultResult(payload, def) {
  if (payload.value === undefined) {
    payload.value = def.defaultValue;
  }
  return payload;
}
var $ZodPrefault = /* @__PURE__ */ $constructor("$ZodPrefault", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    if (payload.value === undefined) {
      payload.value = def.defaultValue;
    }
    return def.innerType._zod.run(payload, ctx);
  };
});
var $ZodNonOptional = /* @__PURE__ */ $constructor("$ZodNonOptional", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => {
    const v = def.innerType._zod.values;
    return v ? new Set([...v].filter((x) => x !== undefined)) : undefined;
  });
  inst._zod.parse = (payload, ctx) => {
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => handleNonOptionalResult(result, inst));
    }
    return handleNonOptionalResult(result, inst);
  };
});
function handleNonOptionalResult(payload, inst) {
  if (!payload.issues.length && payload.value === undefined) {
    payload.issues.push({
      code: "invalid_type",
      expected: "nonoptional",
      input: payload.value,
      inst
    });
  }
  return payload;
}
var $ZodCatch = /* @__PURE__ */ $constructor("$ZodCatch", (inst, def) => {
  $ZodType.init(inst, def);
  inst._zod.optin = "optional";
  defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then((result) => {
        payload.value = result.value;
        if (result.issues.length) {
          payload.value = def.catchValue({
            ...payload,
            error: {
              issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
            },
            input: payload.value
          });
          payload.issues = [];
          payload.fallback = true;
        }
        return payload;
      });
    }
    payload.value = result.value;
    if (result.issues.length) {
      payload.value = def.catchValue({
        ...payload,
        error: {
          issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config()))
        },
        input: payload.value
      });
      payload.issues = [];
      payload.fallback = true;
    }
    return payload;
  };
});
var $ZodPipe = /* @__PURE__ */ $constructor("$ZodPipe", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "values", () => def.in._zod.values);
  defineLazy(inst._zod, "optin", () => def.in._zod.optin);
  defineLazy(inst._zod, "optout", () => def.out._zod.optout);
  defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      const right = def.out._zod.run(payload, ctx);
      if (right instanceof Promise) {
        return right.then((right) => handlePipeResult(right, def.in, ctx));
      }
      return handlePipeResult(right, def.in, ctx);
    }
    const left = def.in._zod.run(payload, ctx);
    if (left instanceof Promise) {
      return left.then((left) => handlePipeResult(left, def.out, ctx));
    }
    return handlePipeResult(left, def.out, ctx);
  };
});
function handlePipeResult(left, next, ctx) {
  if (left.issues.length) {
    left.aborted = true;
    return left;
  }
  return next._zod.run({ value: left.value, issues: left.issues, fallback: left.fallback }, ctx);
}
var $ZodReadonly = /* @__PURE__ */ $constructor("$ZodReadonly", (inst, def) => {
  $ZodType.init(inst, def);
  defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
  defineLazy(inst._zod, "values", () => def.innerType._zod.values);
  defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
  defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
  inst._zod.parse = (payload, ctx) => {
    if (ctx.direction === "backward") {
      return def.innerType._zod.run(payload, ctx);
    }
    const result = def.innerType._zod.run(payload, ctx);
    if (result instanceof Promise) {
      return result.then(handleReadonlyResult);
    }
    return handleReadonlyResult(result);
  };
});
function handleReadonlyResult(payload) {
  payload.value = Object.freeze(payload.value);
  return payload;
}
var $ZodCustom = /* @__PURE__ */ $constructor("$ZodCustom", (inst, def) => {
  $ZodCheck.init(inst, def);
  $ZodType.init(inst, def);
  inst._zod.parse = (payload, _) => {
    return payload;
  };
  inst._zod.check = (payload) => {
    const input = payload.value;
    const r = def.fn(input);
    if (r instanceof Promise) {
      return r.then((r) => handleRefineResult(r, payload, input, inst));
    }
    handleRefineResult(r, payload, input, inst);
    return;
  };
});
function handleRefineResult(result, payload, input, inst) {
  if (!result) {
    const _iss = {
      code: "custom",
      input,
      inst,
      path: [...inst._zod.def.path ?? []],
      continue: !inst._zod.def.abort
    };
    if (inst._zod.def.params)
      _iss.params = inst._zod.def.params;
    payload.issues.push(issue(_iss));
  }
}
// ../node_modules/zod/v4/core/registries.js
var _a2;
var $output = Symbol("ZodOutput");
var $input = Symbol("ZodInput");

class $ZodRegistry {
  constructor() {
    this._map = new WeakMap;
    this._idmap = new Map;
  }
  add(schema, ..._meta) {
    const meta = _meta[0];
    this._map.set(schema, meta);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.set(meta.id, schema);
    }
    return this;
  }
  clear() {
    this._map = new WeakMap;
    this._idmap = new Map;
    return this;
  }
  remove(schema) {
    const meta = this._map.get(schema);
    if (meta && typeof meta === "object" && "id" in meta) {
      this._idmap.delete(meta.id);
    }
    this._map.delete(schema);
    return this;
  }
  get(schema) {
    const p = schema._zod.parent;
    if (p) {
      const pm = { ...this.get(p) ?? {} };
      delete pm.id;
      const f = { ...pm, ...this._map.get(schema) };
      return Object.keys(f).length ? f : undefined;
    }
    return this._map.get(schema);
  }
  has(schema) {
    return this._map.has(schema);
  }
}
function registry() {
  return new $ZodRegistry;
}
(_a2 = globalThis).__zod_globalRegistry ?? (_a2.__zod_globalRegistry = registry());
var globalRegistry = globalThis.__zod_globalRegistry;
// ../node_modules/zod/v4/core/api.js
function _string(Class, params) {
  return new Class({
    type: "string",
    ...normalizeParams(params)
  });
}
function _email(Class, params) {
  return new Class({
    type: "string",
    format: "email",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _guid(Class, params) {
  return new Class({
    type: "string",
    format: "guid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuid(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _uuidv4(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v4",
    ...normalizeParams(params)
  });
}
function _uuidv6(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v6",
    ...normalizeParams(params)
  });
}
function _uuidv7(Class, params) {
  return new Class({
    type: "string",
    format: "uuid",
    check: "string_format",
    abort: false,
    version: "v7",
    ...normalizeParams(params)
  });
}
function _url(Class, params) {
  return new Class({
    type: "string",
    format: "url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _emoji2(Class, params) {
  return new Class({
    type: "string",
    format: "emoji",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _nanoid(Class, params) {
  return new Class({
    type: "string",
    format: "nanoid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid(Class, params) {
  return new Class({
    type: "string",
    format: "cuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cuid2(Class, params) {
  return new Class({
    type: "string",
    format: "cuid2",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ulid(Class, params) {
  return new Class({
    type: "string",
    format: "ulid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _xid(Class, params) {
  return new Class({
    type: "string",
    format: "xid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ksuid(Class, params) {
  return new Class({
    type: "string",
    format: "ksuid",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv4(Class, params) {
  return new Class({
    type: "string",
    format: "ipv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _ipv6(Class, params) {
  return new Class({
    type: "string",
    format: "ipv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv4(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv4",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _cidrv6(Class, params) {
  return new Class({
    type: "string",
    format: "cidrv6",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64(Class, params) {
  return new Class({
    type: "string",
    format: "base64",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _base64url(Class, params) {
  return new Class({
    type: "string",
    format: "base64url",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _e164(Class, params) {
  return new Class({
    type: "string",
    format: "e164",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _jwt(Class, params) {
  return new Class({
    type: "string",
    format: "jwt",
    check: "string_format",
    abort: false,
    ...normalizeParams(params)
  });
}
function _isoDateTime(Class, params) {
  return new Class({
    type: "string",
    format: "datetime",
    check: "string_format",
    offset: false,
    local: false,
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDate(Class, params) {
  return new Class({
    type: "string",
    format: "date",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _isoTime(Class, params) {
  return new Class({
    type: "string",
    format: "time",
    check: "string_format",
    precision: null,
    ...normalizeParams(params)
  });
}
function _isoDuration(Class, params) {
  return new Class({
    type: "string",
    format: "duration",
    check: "string_format",
    ...normalizeParams(params)
  });
}
function _number(Class, params) {
  return new Class({
    type: "number",
    checks: [],
    ...normalizeParams(params)
  });
}
function _int(Class, params) {
  return new Class({
    type: "number",
    check: "number_format",
    abort: false,
    format: "safeint",
    ...normalizeParams(params)
  });
}
function _boolean(Class, params) {
  return new Class({
    type: "boolean",
    ...normalizeParams(params)
  });
}
function _unknown(Class) {
  return new Class({
    type: "unknown"
  });
}
function _never(Class, params) {
  return new Class({
    type: "never",
    ...normalizeParams(params)
  });
}
function _lt(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _lte(value, params) {
  return new $ZodCheckLessThan({
    check: "less_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _gt(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: false
  });
}
function _gte(value, params) {
  return new $ZodCheckGreaterThan({
    check: "greater_than",
    ...normalizeParams(params),
    value,
    inclusive: true
  });
}
function _multipleOf(value, params) {
  return new $ZodCheckMultipleOf({
    check: "multiple_of",
    ...normalizeParams(params),
    value
  });
}
function _maxLength(maximum, params) {
  const ch = new $ZodCheckMaxLength({
    check: "max_length",
    ...normalizeParams(params),
    maximum
  });
  return ch;
}
function _minLength(minimum, params) {
  return new $ZodCheckMinLength({
    check: "min_length",
    ...normalizeParams(params),
    minimum
  });
}
function _length(length, params) {
  return new $ZodCheckLengthEquals({
    check: "length_equals",
    ...normalizeParams(params),
    length
  });
}
function _regex(pattern, params) {
  return new $ZodCheckRegex({
    check: "string_format",
    format: "regex",
    ...normalizeParams(params),
    pattern
  });
}
function _lowercase(params) {
  return new $ZodCheckLowerCase({
    check: "string_format",
    format: "lowercase",
    ...normalizeParams(params)
  });
}
function _uppercase(params) {
  return new $ZodCheckUpperCase({
    check: "string_format",
    format: "uppercase",
    ...normalizeParams(params)
  });
}
function _includes(includes, params) {
  return new $ZodCheckIncludes({
    check: "string_format",
    format: "includes",
    ...normalizeParams(params),
    includes
  });
}
function _startsWith(prefix, params) {
  return new $ZodCheckStartsWith({
    check: "string_format",
    format: "starts_with",
    ...normalizeParams(params),
    prefix
  });
}
function _endsWith(suffix, params) {
  return new $ZodCheckEndsWith({
    check: "string_format",
    format: "ends_with",
    ...normalizeParams(params),
    suffix
  });
}
function _overwrite(tx) {
  return new $ZodCheckOverwrite({
    check: "overwrite",
    tx
  });
}
function _normalize(form) {
  return _overwrite((input) => input.normalize(form));
}
function _trim() {
  return _overwrite((input) => input.trim());
}
function _toLowerCase() {
  return _overwrite((input) => input.toLowerCase());
}
function _toUpperCase() {
  return _overwrite((input) => input.toUpperCase());
}
function _slugify() {
  return _overwrite((input) => slugify(input));
}
function _array(Class, element, params) {
  return new Class({
    type: "array",
    element,
    ...normalizeParams(params)
  });
}
function _refine(Class, fn, _params) {
  const schema = new Class({
    type: "custom",
    check: "custom",
    fn,
    ...normalizeParams(_params)
  });
  return schema;
}
function _superRefine(fn, params) {
  const ch = _check((payload) => {
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, ch._zod.def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = ch);
        _issue.continue ?? (_issue.continue = !ch._zod.def.abort);
        payload.issues.push(issue(_issue));
      }
    };
    return fn(payload.value, payload);
  }, params);
  return ch;
}
function _check(fn, params) {
  const ch = new $ZodCheck({
    check: "custom",
    ...normalizeParams(params)
  });
  ch._zod.check = fn;
  return ch;
}
// ../node_modules/zod/v4/core/to-json-schema.js
function initializeContext(params) {
  let target = params?.target ?? "draft-2020-12";
  if (target === "draft-4")
    target = "draft-04";
  if (target === "draft-7")
    target = "draft-07";
  return {
    processors: params.processors ?? {},
    metadataRegistry: params?.metadata ?? globalRegistry,
    target,
    unrepresentable: params?.unrepresentable ?? "throw",
    override: params?.override ?? (() => {}),
    io: params?.io ?? "output",
    counter: 0,
    seen: new Map,
    cycles: params?.cycles ?? "ref",
    reused: params?.reused ?? "inline",
    external: params?.external ?? undefined
  };
}
function process(schema, ctx, _params = { path: [], schemaPath: [] }) {
  var _a;
  const def = schema._zod.def;
  const seen = ctx.seen.get(schema);
  if (seen) {
    seen.count++;
    const isCycle = _params.schemaPath.includes(schema);
    if (isCycle) {
      seen.cycle = _params.path;
    }
    return seen.schema;
  }
  const result = { schema: {}, count: 1, cycle: undefined, path: _params.path };
  ctx.seen.set(schema, result);
  const overrideSchema = schema._zod.toJSONSchema?.();
  if (overrideSchema) {
    result.schema = overrideSchema;
  } else {
    const params = {
      ..._params,
      schemaPath: [..._params.schemaPath, schema],
      path: _params.path
    };
    if (schema._zod.processJSONSchema) {
      schema._zod.processJSONSchema(ctx, result.schema, params);
    } else {
      const _json = result.schema;
      const processor = ctx.processors[def.type];
      if (!processor) {
        throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
      }
      processor(schema, ctx, _json, params);
    }
    const parent = schema._zod.parent;
    if (parent) {
      if (!result.ref)
        result.ref = parent;
      process(parent, ctx, params);
      ctx.seen.get(parent).isParent = true;
    }
  }
  const meta = ctx.metadataRegistry.get(schema);
  if (meta)
    Object.assign(result.schema, meta);
  if (ctx.io === "input" && isTransforming(schema)) {
    delete result.schema.examples;
    delete result.schema.default;
  }
  if (ctx.io === "input" && "_prefault" in result.schema)
    (_a = result.schema).default ?? (_a.default = result.schema._prefault);
  delete result.schema._prefault;
  const _result = ctx.seen.get(schema);
  return _result.schema;
}
function extractDefs(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const idToSchema = new Map;
  for (const entry of ctx.seen.entries()) {
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      const existing = idToSchema.get(id);
      if (existing && existing !== entry[0]) {
        throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
      }
      idToSchema.set(id, entry[0]);
    }
  }
  const makeURI = (entry) => {
    const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
    if (ctx.external) {
      const externalId = ctx.external.registry.get(entry[0])?.id;
      const uriGenerator = ctx.external.uri ?? ((id) => id);
      if (externalId) {
        return { ref: uriGenerator(externalId) };
      }
      const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
      entry[1].defId = id;
      return { defId: id, ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}` };
    }
    if (entry[1] === root) {
      return { ref: "#" };
    }
    const uriPrefix = `#`;
    const defUriPrefix = `${uriPrefix}/${defsSegment}/`;
    const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
    return { defId, ref: defUriPrefix + defId };
  };
  const extractToDef = (entry) => {
    if (entry[1].schema.$ref) {
      return;
    }
    const seen = entry[1];
    const { ref, defId } = makeURI(entry);
    seen.def = { ...seen.schema };
    if (defId)
      seen.defId = defId;
    const schema = seen.schema;
    for (const key in schema) {
      delete schema[key];
    }
    schema.$ref = ref;
  };
  if (ctx.cycles === "throw") {
    for (const entry of ctx.seen.entries()) {
      const seen = entry[1];
      if (seen.cycle) {
        throw new Error("Cycle detected: " + `#/${seen.cycle?.join("/")}/<root>` + '\n\nSet the `cycles` parameter to `"ref"` to resolve cyclical schemas with defs.');
      }
    }
  }
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (schema === entry[0]) {
      extractToDef(entry);
      continue;
    }
    if (ctx.external) {
      const ext = ctx.external.registry.get(entry[0])?.id;
      if (schema !== entry[0] && ext) {
        extractToDef(entry);
        continue;
      }
    }
    const id = ctx.metadataRegistry.get(entry[0])?.id;
    if (id) {
      extractToDef(entry);
      continue;
    }
    if (seen.cycle) {
      extractToDef(entry);
      continue;
    }
    if (seen.count > 1) {
      if (ctx.reused === "ref") {
        extractToDef(entry);
        continue;
      }
    }
  }
}
function finalize(ctx, schema) {
  const root = ctx.seen.get(schema);
  if (!root)
    throw new Error("Unprocessed schema. This is a bug in Zod.");
  const flattenRef = (zodSchema) => {
    const seen = ctx.seen.get(zodSchema);
    if (seen.ref === null)
      return;
    const schema = seen.def ?? seen.schema;
    const _cached = { ...schema };
    const ref = seen.ref;
    seen.ref = null;
    if (ref) {
      flattenRef(ref);
      const refSeen = ctx.seen.get(ref);
      const refSchema = refSeen.schema;
      if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
        schema.allOf = schema.allOf ?? [];
        schema.allOf.push(refSchema);
      } else {
        Object.assign(schema, refSchema);
      }
      Object.assign(schema, _cached);
      const isParentRef = zodSchema._zod.parent === ref;
      if (isParentRef) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (!(key in _cached)) {
            delete schema[key];
          }
        }
      }
      if (refSchema.$ref && refSeen.def) {
        for (const key in schema) {
          if (key === "$ref" || key === "allOf")
            continue;
          if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) {
            delete schema[key];
          }
        }
      }
    }
    const parent = zodSchema._zod.parent;
    if (parent && parent !== ref) {
      flattenRef(parent);
      const parentSeen = ctx.seen.get(parent);
      if (parentSeen?.schema.$ref) {
        schema.$ref = parentSeen.schema.$ref;
        if (parentSeen.def) {
          for (const key in schema) {
            if (key === "$ref" || key === "allOf")
              continue;
            if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) {
              delete schema[key];
            }
          }
        }
      }
    }
    ctx.override({
      zodSchema,
      jsonSchema: schema,
      path: seen.path ?? []
    });
  };
  for (const entry of [...ctx.seen.entries()].reverse()) {
    flattenRef(entry[0]);
  }
  const result = {};
  if (ctx.target === "draft-2020-12") {
    result.$schema = "https://json-schema.org/draft/2020-12/schema";
  } else if (ctx.target === "draft-07") {
    result.$schema = "http://json-schema.org/draft-07/schema#";
  } else if (ctx.target === "draft-04") {
    result.$schema = "http://json-schema.org/draft-04/schema#";
  } else if (ctx.target === "openapi-3.0") {}
  if (ctx.external?.uri) {
    const id = ctx.external.registry.get(schema)?.id;
    if (!id)
      throw new Error("Schema is missing an `id` property");
    result.$id = ctx.external.uri(id);
  }
  Object.assign(result, root.def ?? root.schema);
  const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
  if (rootMetaId !== undefined && result.id === rootMetaId)
    delete result.id;
  const defs = ctx.external?.defs ?? {};
  for (const entry of ctx.seen.entries()) {
    const seen = entry[1];
    if (seen.def && seen.defId) {
      if (seen.def.id === seen.defId)
        delete seen.def.id;
      defs[seen.defId] = seen.def;
    }
  }
  if (ctx.external) {} else {
    if (Object.keys(defs).length > 0) {
      if (ctx.target === "draft-2020-12") {
        result.$defs = defs;
      } else {
        result.definitions = defs;
      }
    }
  }
  try {
    const finalized = JSON.parse(JSON.stringify(result));
    Object.defineProperty(finalized, "~standard", {
      value: {
        ...schema["~standard"],
        jsonSchema: {
          input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
          output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
        }
      },
      enumerable: false,
      writable: false
    });
    return finalized;
  } catch (_err) {
    throw new Error("Error converting schema to JSON.");
  }
}
function isTransforming(_schema, _ctx) {
  const ctx = _ctx ?? { seen: new Set };
  if (ctx.seen.has(_schema))
    return false;
  ctx.seen.add(_schema);
  const def = _schema._zod.def;
  if (def.type === "transform")
    return true;
  if (def.type === "array")
    return isTransforming(def.element, ctx);
  if (def.type === "set")
    return isTransforming(def.valueType, ctx);
  if (def.type === "lazy")
    return isTransforming(def.getter(), ctx);
  if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") {
    return isTransforming(def.innerType, ctx);
  }
  if (def.type === "intersection") {
    return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
  }
  if (def.type === "record" || def.type === "map") {
    return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
  }
  if (def.type === "pipe") {
    if (_schema._zod.traits.has("$ZodCodec"))
      return true;
    return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
  }
  if (def.type === "object") {
    for (const key in def.shape) {
      if (isTransforming(def.shape[key], ctx))
        return true;
    }
    return false;
  }
  if (def.type === "union") {
    for (const option of def.options) {
      if (isTransforming(option, ctx))
        return true;
    }
    return false;
  }
  if (def.type === "tuple") {
    for (const item of def.items) {
      if (isTransforming(item, ctx))
        return true;
    }
    if (def.rest && isTransforming(def.rest, ctx))
      return true;
    return false;
  }
  return false;
}
var createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
  const ctx = initializeContext({ ...params, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
var createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
  const { libraryOptions, target } = params ?? {};
  const ctx = initializeContext({ ...libraryOptions ?? {}, target, io, processors });
  process(schema, ctx);
  extractDefs(ctx, schema);
  return finalize(ctx, schema);
};
// ../node_modules/zod/v4/core/json-schema-processors.js
var formatMap = {
  guid: "uuid",
  url: "uri",
  datetime: "date-time",
  json_string: "json-string",
  regex: ""
};
var stringProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  json.type = "string";
  const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minLength = minimum;
  if (typeof maximum === "number")
    json.maxLength = maximum;
  if (format) {
    json.format = formatMap[format] ?? format;
    if (json.format === "")
      delete json.format;
    if (format === "time") {
      delete json.format;
    }
  }
  if (contentEncoding)
    json.contentEncoding = contentEncoding;
  if (patterns && patterns.size > 0) {
    const regexes = [...patterns];
    if (regexes.length === 1)
      json.pattern = regexes[0].source;
    else if (regexes.length > 1) {
      json.allOf = [
        ...regexes.map((regex) => ({
          ...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
          pattern: regex.source
        }))
      ];
    }
  }
};
var numberProcessor = (schema, ctx, _json, _params) => {
  const json = _json;
  const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
  if (typeof format === "string" && format.includes("int"))
    json.type = "integer";
  else
    json.type = "number";
  const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
  const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
  const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
  if (exMin) {
    if (legacy) {
      json.minimum = exclusiveMinimum;
      json.exclusiveMinimum = true;
    } else {
      json.exclusiveMinimum = exclusiveMinimum;
    }
  } else if (typeof minimum === "number") {
    json.minimum = minimum;
  }
  if (exMax) {
    if (legacy) {
      json.maximum = exclusiveMaximum;
      json.exclusiveMaximum = true;
    } else {
      json.exclusiveMaximum = exclusiveMaximum;
    }
  } else if (typeof maximum === "number") {
    json.maximum = maximum;
  }
  if (typeof multipleOf === "number")
    json.multipleOf = multipleOf;
};
var booleanProcessor = (_schema, _ctx, json, _params) => {
  json.type = "boolean";
};
var neverProcessor = (_schema, _ctx, json, _params) => {
  json.not = {};
};
var unknownProcessor = (_schema, _ctx, _json, _params) => {};
var enumProcessor = (schema, _ctx, json, _params) => {
  const def = schema._zod.def;
  const values = getEnumValues(def.entries);
  if (values.every((v) => typeof v === "number"))
    json.type = "number";
  if (values.every((v) => typeof v === "string"))
    json.type = "string";
  json.enum = values;
};
var customProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Custom types cannot be represented in JSON Schema");
  }
};
var transformProcessor = (_schema, ctx, _json, _params) => {
  if (ctx.unrepresentable === "throw") {
    throw new Error("Transforms cannot be represented in JSON Schema");
  }
};
var arrayProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  const { minimum, maximum } = schema._zod.bag;
  if (typeof minimum === "number")
    json.minItems = minimum;
  if (typeof maximum === "number")
    json.maxItems = maximum;
  json.type = "array";
  json.items = process(def.element, ctx, {
    ...params,
    path: [...params.path, "items"]
  });
};
var objectProcessor = (schema, ctx, _json, params) => {
  const json = _json;
  const def = schema._zod.def;
  json.type = "object";
  json.properties = {};
  const shape = def.shape;
  for (const key in shape) {
    json.properties[key] = process(shape[key], ctx, {
      ...params,
      path: [...params.path, "properties", key]
    });
  }
  const allKeys = new Set(Object.keys(shape));
  const requiredKeys = new Set([...allKeys].filter((key) => {
    const v = def.shape[key]._zod;
    if (ctx.io === "input") {
      return v.optin === undefined;
    } else {
      return v.optout === undefined;
    }
  }));
  if (requiredKeys.size > 0) {
    json.required = Array.from(requiredKeys);
  }
  if (def.catchall?._zod.def.type === "never") {
    json.additionalProperties = false;
  } else if (!def.catchall) {
    if (ctx.io === "output")
      json.additionalProperties = false;
  } else if (def.catchall) {
    json.additionalProperties = process(def.catchall, ctx, {
      ...params,
      path: [...params.path, "additionalProperties"]
    });
  }
};
var unionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const isExclusive = def.inclusive === false;
  const options = def.options.map((x, i) => process(x, ctx, {
    ...params,
    path: [...params.path, isExclusive ? "oneOf" : "anyOf", i]
  }));
  if (isExclusive) {
    json.oneOf = options;
  } else {
    json.anyOf = options;
  }
};
var intersectionProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const a = process(def.left, ctx, {
    ...params,
    path: [...params.path, "allOf", 0]
  });
  const b = process(def.right, ctx, {
    ...params,
    path: [...params.path, "allOf", 1]
  });
  const isSimpleIntersection = (val) => ("allOf" in val) && Object.keys(val).length === 1;
  const allOf = [
    ...isSimpleIntersection(a) ? a.allOf : [a],
    ...isSimpleIntersection(b) ? b.allOf : [b]
  ];
  json.allOf = allOf;
};
var nullableProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  const inner = process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  if (ctx.target === "openapi-3.0") {
    seen.ref = def.innerType;
    json.nullable = true;
  } else {
    json.anyOf = [inner, { type: "null" }];
  }
};
var nonoptionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
var defaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.default = JSON.parse(JSON.stringify(def.defaultValue));
};
var prefaultProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  if (ctx.io === "input")
    json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
};
var catchProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  let catchValue;
  try {
    catchValue = def.catchValue(undefined);
  } catch {
    throw new Error("Dynamic catch values are not supported in JSON Schema");
  }
  json.default = catchValue;
};
var pipeProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  const inIsTransform = def.in._zod.traits.has("$ZodTransform");
  const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
  process(innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = innerType;
};
var readonlyProcessor = (schema, ctx, json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
  json.readOnly = true;
};
var optionalProcessor = (schema, ctx, _json, params) => {
  const def = schema._zod.def;
  process(def.innerType, ctx, params);
  const seen = ctx.seen.get(schema);
  seen.ref = def.innerType;
};
// ../node_modules/zod/v4/classic/iso.js
var ZodISODateTime = /* @__PURE__ */ $constructor("ZodISODateTime", (inst, def) => {
  $ZodISODateTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function datetime2(params) {
  return _isoDateTime(ZodISODateTime, params);
}
var ZodISODate = /* @__PURE__ */ $constructor("ZodISODate", (inst, def) => {
  $ZodISODate.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function date2(params) {
  return _isoDate(ZodISODate, params);
}
var ZodISOTime = /* @__PURE__ */ $constructor("ZodISOTime", (inst, def) => {
  $ZodISOTime.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function time2(params) {
  return _isoTime(ZodISOTime, params);
}
var ZodISODuration = /* @__PURE__ */ $constructor("ZodISODuration", (inst, def) => {
  $ZodISODuration.init(inst, def);
  ZodStringFormat.init(inst, def);
});
function duration2(params) {
  return _isoDuration(ZodISODuration, params);
}

// ../node_modules/zod/v4/classic/errors.js
var initializer2 = (inst, issues) => {
  $ZodError.init(inst, issues);
  inst.name = "ZodError";
  Object.defineProperties(inst, {
    format: {
      value: (mapper) => formatError(inst, mapper)
    },
    flatten: {
      value: (mapper) => flattenError(inst, mapper)
    },
    addIssue: {
      value: (issue) => {
        inst.issues.push(issue);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    addIssues: {
      value: (issues) => {
        inst.issues.push(...issues);
        inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
      }
    },
    isEmpty: {
      get() {
        return inst.issues.length === 0;
      }
    }
  });
};
var ZodRealError = /* @__PURE__ */ $constructor("ZodError", initializer2, {
  Parent: Error
});

// ../node_modules/zod/v4/classic/parse.js
var parse3 = /* @__PURE__ */ _parse(ZodRealError);
var parseAsync2 = /* @__PURE__ */ _parseAsync(ZodRealError);
var safeParse2 = /* @__PURE__ */ _safeParse(ZodRealError);
var safeParseAsync2 = /* @__PURE__ */ _safeParseAsync(ZodRealError);
var encode = /* @__PURE__ */ _encode(ZodRealError);
var decode = /* @__PURE__ */ _decode(ZodRealError);
var encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
var decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
var safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
var safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
var safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
var safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);

// ../node_modules/zod/v4/classic/schemas.js
var _installedGroups = /* @__PURE__ */ new WeakMap;
function _installLazyMethods(inst, group, methods) {
  const proto = Object.getPrototypeOf(inst);
  let installed = _installedGroups.get(proto);
  if (!installed) {
    installed = new Set;
    _installedGroups.set(proto, installed);
  }
  if (installed.has(group))
    return;
  installed.add(group);
  for (const key in methods) {
    const fn = methods[key];
    Object.defineProperty(proto, key, {
      configurable: true,
      enumerable: false,
      get() {
        const bound = fn.bind(this);
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: bound
        });
        return bound;
      },
      set(v) {
        Object.defineProperty(this, key, {
          configurable: true,
          writable: true,
          enumerable: true,
          value: v
        });
      }
    });
  }
}
var ZodType = /* @__PURE__ */ $constructor("ZodType", (inst, def) => {
  $ZodType.init(inst, def);
  Object.assign(inst["~standard"], {
    jsonSchema: {
      input: createStandardJSONSchemaMethod(inst, "input"),
      output: createStandardJSONSchemaMethod(inst, "output")
    }
  });
  inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
  inst.def = def;
  inst.type = def.type;
  Object.defineProperty(inst, "_def", { value: def });
  inst.parse = (data, params) => parse3(inst, data, params, { callee: inst.parse });
  inst.safeParse = (data, params) => safeParse2(inst, data, params);
  inst.parseAsync = async (data, params) => parseAsync2(inst, data, params, { callee: inst.parseAsync });
  inst.safeParseAsync = async (data, params) => safeParseAsync2(inst, data, params);
  inst.spa = inst.safeParseAsync;
  inst.encode = (data, params) => encode(inst, data, params);
  inst.decode = (data, params) => decode(inst, data, params);
  inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
  inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
  inst.safeEncode = (data, params) => safeEncode(inst, data, params);
  inst.safeDecode = (data, params) => safeDecode(inst, data, params);
  inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
  inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
  _installLazyMethods(inst, "ZodType", {
    check(...chks) {
      const def = this.def;
      return this.clone(mergeDefs(def, {
        checks: [
          ...def.checks ?? [],
          ...chks.map((ch) => typeof ch === "function" ? { _zod: { check: ch, def: { check: "custom" }, onattach: [] } } : ch)
        ]
      }), { parent: true });
    },
    with(...chks) {
      return this.check(...chks);
    },
    clone(def, params) {
      return clone(this, def, params);
    },
    brand() {
      return this;
    },
    register(reg, meta) {
      reg.add(this, meta);
      return this;
    },
    refine(check, params) {
      return this.check(refine(check, params));
    },
    superRefine(refinement, params) {
      return this.check(superRefine(refinement, params));
    },
    overwrite(fn) {
      return this.check(_overwrite(fn));
    },
    optional() {
      return optional(this);
    },
    exactOptional() {
      return exactOptional(this);
    },
    nullable() {
      return nullable(this);
    },
    nullish() {
      return optional(nullable(this));
    },
    nonoptional(params) {
      return nonoptional(this, params);
    },
    array() {
      return array(this);
    },
    or(arg) {
      return union([this, arg]);
    },
    and(arg) {
      return intersection(this, arg);
    },
    transform(tx) {
      return pipe(this, transform(tx));
    },
    default(d) {
      return _default(this, d);
    },
    prefault(d) {
      return prefault(this, d);
    },
    catch(params) {
      return _catch(this, params);
    },
    pipe(target) {
      return pipe(this, target);
    },
    readonly() {
      return readonly(this);
    },
    describe(description) {
      const cl = this.clone();
      globalRegistry.add(cl, { description });
      return cl;
    },
    meta(...args) {
      if (args.length === 0)
        return globalRegistry.get(this);
      const cl = this.clone();
      globalRegistry.add(cl, args[0]);
      return cl;
    },
    isOptional() {
      return this.safeParse(undefined).success;
    },
    isNullable() {
      return this.safeParse(null).success;
    },
    apply(fn) {
      return fn(this);
    }
  });
  Object.defineProperty(inst, "description", {
    get() {
      return globalRegistry.get(inst)?.description;
    },
    configurable: true
  });
  return inst;
});
var _ZodString = /* @__PURE__ */ $constructor("_ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
  const bag = inst._zod.bag;
  inst.format = bag.format ?? null;
  inst.minLength = bag.minimum ?? null;
  inst.maxLength = bag.maximum ?? null;
  _installLazyMethods(inst, "_ZodString", {
    regex(...args) {
      return this.check(_regex(...args));
    },
    includes(...args) {
      return this.check(_includes(...args));
    },
    startsWith(...args) {
      return this.check(_startsWith(...args));
    },
    endsWith(...args) {
      return this.check(_endsWith(...args));
    },
    min(...args) {
      return this.check(_minLength(...args));
    },
    max(...args) {
      return this.check(_maxLength(...args));
    },
    length(...args) {
      return this.check(_length(...args));
    },
    nonempty(...args) {
      return this.check(_minLength(1, ...args));
    },
    lowercase(params) {
      return this.check(_lowercase(params));
    },
    uppercase(params) {
      return this.check(_uppercase(params));
    },
    trim() {
      return this.check(_trim());
    },
    normalize(...args) {
      return this.check(_normalize(...args));
    },
    toLowerCase() {
      return this.check(_toLowerCase());
    },
    toUpperCase() {
      return this.check(_toUpperCase());
    },
    slugify() {
      return this.check(_slugify());
    }
  });
});
var ZodString = /* @__PURE__ */ $constructor("ZodString", (inst, def) => {
  $ZodString.init(inst, def);
  _ZodString.init(inst, def);
  inst.email = (params) => inst.check(_email(ZodEmail, params));
  inst.url = (params) => inst.check(_url(ZodURL, params));
  inst.jwt = (params) => inst.check(_jwt(ZodJWT, params));
  inst.emoji = (params) => inst.check(_emoji2(ZodEmoji, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.uuid = (params) => inst.check(_uuid(ZodUUID, params));
  inst.uuidv4 = (params) => inst.check(_uuidv4(ZodUUID, params));
  inst.uuidv6 = (params) => inst.check(_uuidv6(ZodUUID, params));
  inst.uuidv7 = (params) => inst.check(_uuidv7(ZodUUID, params));
  inst.nanoid = (params) => inst.check(_nanoid(ZodNanoID, params));
  inst.guid = (params) => inst.check(_guid(ZodGUID, params));
  inst.cuid = (params) => inst.check(_cuid(ZodCUID, params));
  inst.cuid2 = (params) => inst.check(_cuid2(ZodCUID2, params));
  inst.ulid = (params) => inst.check(_ulid(ZodULID, params));
  inst.base64 = (params) => inst.check(_base64(ZodBase64, params));
  inst.base64url = (params) => inst.check(_base64url(ZodBase64URL, params));
  inst.xid = (params) => inst.check(_xid(ZodXID, params));
  inst.ksuid = (params) => inst.check(_ksuid(ZodKSUID, params));
  inst.ipv4 = (params) => inst.check(_ipv4(ZodIPv4, params));
  inst.ipv6 = (params) => inst.check(_ipv6(ZodIPv6, params));
  inst.cidrv4 = (params) => inst.check(_cidrv4(ZodCIDRv4, params));
  inst.cidrv6 = (params) => inst.check(_cidrv6(ZodCIDRv6, params));
  inst.e164 = (params) => inst.check(_e164(ZodE164, params));
  inst.datetime = (params) => inst.check(datetime2(params));
  inst.date = (params) => inst.check(date2(params));
  inst.time = (params) => inst.check(time2(params));
  inst.duration = (params) => inst.check(duration2(params));
});
function string2(params) {
  return _string(ZodString, params);
}
var ZodStringFormat = /* @__PURE__ */ $constructor("ZodStringFormat", (inst, def) => {
  $ZodStringFormat.init(inst, def);
  _ZodString.init(inst, def);
});
var ZodEmail = /* @__PURE__ */ $constructor("ZodEmail", (inst, def) => {
  $ZodEmail.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodGUID = /* @__PURE__ */ $constructor("ZodGUID", (inst, def) => {
  $ZodGUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodUUID = /* @__PURE__ */ $constructor("ZodUUID", (inst, def) => {
  $ZodUUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodURL = /* @__PURE__ */ $constructor("ZodURL", (inst, def) => {
  $ZodURL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodEmoji = /* @__PURE__ */ $constructor("ZodEmoji", (inst, def) => {
  $ZodEmoji.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNanoID = /* @__PURE__ */ $constructor("ZodNanoID", (inst, def) => {
  $ZodNanoID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID = /* @__PURE__ */ $constructor("ZodCUID", (inst, def) => {
  $ZodCUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCUID2 = /* @__PURE__ */ $constructor("ZodCUID2", (inst, def) => {
  $ZodCUID2.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodULID = /* @__PURE__ */ $constructor("ZodULID", (inst, def) => {
  $ZodULID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodXID = /* @__PURE__ */ $constructor("ZodXID", (inst, def) => {
  $ZodXID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodKSUID = /* @__PURE__ */ $constructor("ZodKSUID", (inst, def) => {
  $ZodKSUID.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv4 = /* @__PURE__ */ $constructor("ZodIPv4", (inst, def) => {
  $ZodIPv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodIPv6 = /* @__PURE__ */ $constructor("ZodIPv6", (inst, def) => {
  $ZodIPv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv4 = /* @__PURE__ */ $constructor("ZodCIDRv4", (inst, def) => {
  $ZodCIDRv4.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodCIDRv6 = /* @__PURE__ */ $constructor("ZodCIDRv6", (inst, def) => {
  $ZodCIDRv6.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64 = /* @__PURE__ */ $constructor("ZodBase64", (inst, def) => {
  $ZodBase64.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodBase64URL = /* @__PURE__ */ $constructor("ZodBase64URL", (inst, def) => {
  $ZodBase64URL.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodE164 = /* @__PURE__ */ $constructor("ZodE164", (inst, def) => {
  $ZodE164.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodJWT = /* @__PURE__ */ $constructor("ZodJWT", (inst, def) => {
  $ZodJWT.init(inst, def);
  ZodStringFormat.init(inst, def);
});
var ZodNumber = /* @__PURE__ */ $constructor("ZodNumber", (inst, def) => {
  $ZodNumber.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
  _installLazyMethods(inst, "ZodNumber", {
    gt(value, params) {
      return this.check(_gt(value, params));
    },
    gte(value, params) {
      return this.check(_gte(value, params));
    },
    min(value, params) {
      return this.check(_gte(value, params));
    },
    lt(value, params) {
      return this.check(_lt(value, params));
    },
    lte(value, params) {
      return this.check(_lte(value, params));
    },
    max(value, params) {
      return this.check(_lte(value, params));
    },
    int(params) {
      return this.check(int(params));
    },
    safe(params) {
      return this.check(int(params));
    },
    positive(params) {
      return this.check(_gt(0, params));
    },
    nonnegative(params) {
      return this.check(_gte(0, params));
    },
    negative(params) {
      return this.check(_lt(0, params));
    },
    nonpositive(params) {
      return this.check(_lte(0, params));
    },
    multipleOf(value, params) {
      return this.check(_multipleOf(value, params));
    },
    step(value, params) {
      return this.check(_multipleOf(value, params));
    },
    finite() {
      return this;
    }
  });
  const bag = inst._zod.bag;
  inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
  inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
  inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? 0.5);
  inst.isFinite = true;
  inst.format = bag.format ?? null;
});
function number2(params) {
  return _number(ZodNumber, params);
}
var ZodNumberFormat = /* @__PURE__ */ $constructor("ZodNumberFormat", (inst, def) => {
  $ZodNumberFormat.init(inst, def);
  ZodNumber.init(inst, def);
});
function int(params) {
  return _int(ZodNumberFormat, params);
}
var ZodBoolean = /* @__PURE__ */ $constructor("ZodBoolean", (inst, def) => {
  $ZodBoolean.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
});
function boolean2(params) {
  return _boolean(ZodBoolean, params);
}
var ZodUnknown = /* @__PURE__ */ $constructor("ZodUnknown", (inst, def) => {
  $ZodUnknown.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unknownProcessor(inst, ctx, json, params);
});
function unknown() {
  return _unknown(ZodUnknown);
}
var ZodNever = /* @__PURE__ */ $constructor("ZodNever", (inst, def) => {
  $ZodNever.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
});
function never(params) {
  return _never(ZodNever, params);
}
var ZodArray = /* @__PURE__ */ $constructor("ZodArray", (inst, def) => {
  $ZodArray.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
  inst.element = def.element;
  _installLazyMethods(inst, "ZodArray", {
    min(n, params) {
      return this.check(_minLength(n, params));
    },
    nonempty(params) {
      return this.check(_minLength(1, params));
    },
    max(n, params) {
      return this.check(_maxLength(n, params));
    },
    length(n, params) {
      return this.check(_length(n, params));
    },
    unwrap() {
      return this.element;
    }
  });
});
function array(element, params) {
  return _array(ZodArray, element, params);
}
var ZodObject = /* @__PURE__ */ $constructor("ZodObject", (inst, def) => {
  $ZodObjectJIT.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
  defineLazy(inst, "shape", () => {
    return def.shape;
  });
  _installLazyMethods(inst, "ZodObject", {
    keyof() {
      return _enum(Object.keys(this._zod.def.shape));
    },
    catchall(catchall) {
      return this.clone({ ...this._zod.def, catchall });
    },
    passthrough() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    loose() {
      return this.clone({ ...this._zod.def, catchall: unknown() });
    },
    strict() {
      return this.clone({ ...this._zod.def, catchall: never() });
    },
    strip() {
      return this.clone({ ...this._zod.def, catchall: undefined });
    },
    extend(incoming) {
      return extend(this, incoming);
    },
    safeExtend(incoming) {
      return safeExtend(this, incoming);
    },
    merge(other) {
      return merge(this, other);
    },
    pick(mask) {
      return pick(this, mask);
    },
    omit(mask) {
      return omit(this, mask);
    },
    partial(...args) {
      return partial(ZodOptional, this, args[0]);
    },
    required(...args) {
      return required(ZodNonOptional, this, args[0]);
    }
  });
});
function object(shape, params) {
  const def = {
    type: "object",
    shape: shape ?? {},
    ...normalizeParams(params)
  };
  return new ZodObject(def);
}
var ZodUnion = /* @__PURE__ */ $constructor("ZodUnion", (inst, def) => {
  $ZodUnion.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
  inst.options = def.options;
});
function union(options, params) {
  return new ZodUnion({
    type: "union",
    options,
    ...normalizeParams(params)
  });
}
var ZodIntersection = /* @__PURE__ */ $constructor("ZodIntersection", (inst, def) => {
  $ZodIntersection.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
});
function intersection(left, right) {
  return new ZodIntersection({
    type: "intersection",
    left,
    right
  });
}
var ZodEnum = /* @__PURE__ */ $constructor("ZodEnum", (inst, def) => {
  $ZodEnum.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
  inst.enum = def.entries;
  inst.options = Object.values(def.entries);
  const keys = new Set(Object.keys(def.entries));
  inst.extract = (values, params) => {
    const newEntries = {};
    for (const value of values) {
      if (keys.has(value)) {
        newEntries[value] = def.entries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
  inst.exclude = (values, params) => {
    const newEntries = { ...def.entries };
    for (const value of values) {
      if (keys.has(value)) {
        delete newEntries[value];
      } else
        throw new Error(`Key ${value} not found in enum`);
    }
    return new ZodEnum({
      ...def,
      checks: [],
      ...normalizeParams(params),
      entries: newEntries
    });
  };
});
function _enum(values, params) {
  const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
  return new ZodEnum({
    type: "enum",
    entries,
    ...normalizeParams(params)
  });
}
var ZodTransform = /* @__PURE__ */ $constructor("ZodTransform", (inst, def) => {
  $ZodTransform.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
  inst._zod.parse = (payload, _ctx) => {
    if (_ctx.direction === "backward") {
      throw new $ZodEncodeError(inst.constructor.name);
    }
    payload.addIssue = (issue2) => {
      if (typeof issue2 === "string") {
        payload.issues.push(issue(issue2, payload.value, def));
      } else {
        const _issue = issue2;
        if (_issue.fatal)
          _issue.continue = false;
        _issue.code ?? (_issue.code = "custom");
        _issue.input ?? (_issue.input = payload.value);
        _issue.inst ?? (_issue.inst = inst);
        payload.issues.push(issue(_issue));
      }
    };
    const output = def.transform(payload.value, payload);
    if (output instanceof Promise) {
      return output.then((output) => {
        payload.value = output;
        payload.fallback = true;
        return payload;
      });
    }
    payload.value = output;
    payload.fallback = true;
    return payload;
  };
});
function transform(fn) {
  return new ZodTransform({
    type: "transform",
    transform: fn
  });
}
var ZodOptional = /* @__PURE__ */ $constructor("ZodOptional", (inst, def) => {
  $ZodOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function optional(innerType) {
  return new ZodOptional({
    type: "optional",
    innerType
  });
}
var ZodExactOptional = /* @__PURE__ */ $constructor("ZodExactOptional", (inst, def) => {
  $ZodExactOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function exactOptional(innerType) {
  return new ZodExactOptional({
    type: "optional",
    innerType
  });
}
var ZodNullable = /* @__PURE__ */ $constructor("ZodNullable", (inst, def) => {
  $ZodNullable.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nullable(innerType) {
  return new ZodNullable({
    type: "nullable",
    innerType
  });
}
var ZodDefault = /* @__PURE__ */ $constructor("ZodDefault", (inst, def) => {
  $ZodDefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeDefault = inst.unwrap;
});
function _default(innerType, defaultValue) {
  return new ZodDefault({
    type: "default",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodPrefault = /* @__PURE__ */ $constructor("ZodPrefault", (inst, def) => {
  $ZodPrefault.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function prefault(innerType, defaultValue) {
  return new ZodPrefault({
    type: "prefault",
    innerType,
    get defaultValue() {
      return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
    }
  });
}
var ZodNonOptional = /* @__PURE__ */ $constructor("ZodNonOptional", (inst, def) => {
  $ZodNonOptional.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function nonoptional(innerType, params) {
  return new ZodNonOptional({
    type: "nonoptional",
    innerType,
    ...normalizeParams(params)
  });
}
var ZodCatch = /* @__PURE__ */ $constructor("ZodCatch", (inst, def) => {
  $ZodCatch.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
  inst.removeCatch = inst.unwrap;
});
function _catch(innerType, catchValue) {
  return new ZodCatch({
    type: "catch",
    innerType,
    catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
  });
}
var ZodPipe = /* @__PURE__ */ $constructor("ZodPipe", (inst, def) => {
  $ZodPipe.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
  inst.in = def.in;
  inst.out = def.out;
});
function pipe(in_, out) {
  return new ZodPipe({
    type: "pipe",
    in: in_,
    out
  });
}
var ZodReadonly = /* @__PURE__ */ $constructor("ZodReadonly", (inst, def) => {
  $ZodReadonly.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
  inst.unwrap = () => inst._zod.def.innerType;
});
function readonly(innerType) {
  return new ZodReadonly({
    type: "readonly",
    innerType
  });
}
var ZodCustom = /* @__PURE__ */ $constructor("ZodCustom", (inst, def) => {
  $ZodCustom.init(inst, def);
  ZodType.init(inst, def);
  inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
});
function refine(fn, _params = {}) {
  return _refine(ZodCustom, fn, _params);
}
function superRefine(fn, params) {
  return _superRefine(fn, params);
}
// ../node_modules/@hatch/space-sdk/dist/server-contract.js
var ACTION_BRAND = "@hatch/space-sdk/action/v1";
var LEGACY_ACTION_BRAND = Symbol.for("@hatch/space-sdk/action");
function createDefineAction() {
  return function defineAction(spec) {
    return {
      __brand: ACTION_BRAND,
      request: spec.request,
      response: spec.response,
      ...spec.description !== undefined ? { description: spec.description } : {},
      ...spec.privileged !== undefined ? { privileged: spec.privileged } : {},
      handler: spec.handler
    };
  };
}
// ../node_modules/@hatch/space-sdk/dist/index.js
var defineAction = createDefineAction();

// ../node_modules/drizzle-orm/entity.js
var entityKind = Symbol.for("drizzle:entityKind");
var hasOwnEntityKind = Symbol.for("drizzle:hasOwnEntityKind");
function is(value, type) {
  if (!value || typeof value !== "object") {
    return false;
  }
  if (value instanceof type) {
    return true;
  }
  if (!Object.prototype.hasOwnProperty.call(type, entityKind)) {
    throw new Error(`Class "${type.name ?? "<unknown>"}" doesn't look like a Drizzle entity. If this is incorrect and the class is provided by Drizzle, please report this as a bug.`);
  }
  let cls = Object.getPrototypeOf(value).constructor;
  if (cls) {
    while (cls) {
      if (entityKind in cls && cls[entityKind] === type[entityKind]) {
        return true;
      }
      cls = Object.getPrototypeOf(cls);
    }
  }
  return false;
}

// ../node_modules/drizzle-orm/column.js
class Column {
  constructor(table, config) {
    this.table = table;
    this.config = config;
    this.name = config.name;
    this.keyAsName = config.keyAsName;
    this.notNull = config.notNull;
    this.default = config.default;
    this.defaultFn = config.defaultFn;
    this.onUpdateFn = config.onUpdateFn;
    this.hasDefault = config.hasDefault;
    this.primary = config.primaryKey;
    this.isUnique = config.isUnique;
    this.uniqueName = config.uniqueName;
    this.uniqueType = config.uniqueType;
    this.dataType = config.dataType;
    this.columnType = config.columnType;
    this.generated = config.generated;
    this.generatedIdentity = config.generatedIdentity;
  }
  static [entityKind] = "Column";
  name;
  keyAsName;
  primary;
  notNull;
  default;
  defaultFn;
  onUpdateFn;
  hasDefault;
  isUnique;
  uniqueName;
  uniqueType;
  dataType;
  columnType;
  enumValues = undefined;
  generated = undefined;
  generatedIdentity = undefined;
  config;
  mapFromDriverValue(value) {
    return value;
  }
  mapToDriverValue(value) {
    return value;
  }
  shouldDisableInsert() {
    return this.config.generated !== undefined && this.config.generated.type !== "byDefault";
  }
}

// ../node_modules/drizzle-orm/column-builder.js
class ColumnBuilder {
  static [entityKind] = "ColumnBuilder";
  config;
  constructor(name, dataType, columnType) {
    this.config = {
      name,
      keyAsName: name === "",
      notNull: false,
      default: undefined,
      hasDefault: false,
      primaryKey: false,
      isUnique: false,
      uniqueName: undefined,
      uniqueType: undefined,
      dataType,
      columnType,
      generated: undefined
    };
  }
  $type() {
    return this;
  }
  notNull() {
    this.config.notNull = true;
    return this;
  }
  default(value) {
    this.config.default = value;
    this.config.hasDefault = true;
    return this;
  }
  $defaultFn(fn) {
    this.config.defaultFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $default = this.$defaultFn;
  $onUpdateFn(fn) {
    this.config.onUpdateFn = fn;
    this.config.hasDefault = true;
    return this;
  }
  $onUpdate = this.$onUpdateFn;
  primaryKey() {
    this.config.primaryKey = true;
    this.config.notNull = true;
    return this;
  }
  setName(name) {
    if (this.config.name !== "")
      return;
    this.config.name = name;
  }
}

// ../node_modules/drizzle-orm/table.utils.js
var TableName = Symbol.for("drizzle:Name");

// ../node_modules/drizzle-orm/tracing-utils.js
function iife(fn, ...args) {
  return fn(...args);
}

// ../node_modules/drizzle-orm/pg-core/columns/enum.js
var isPgEnumSym = Symbol.for("drizzle:isPgEnum");
function isPgEnum(obj) {
  return !!obj && typeof obj === "function" && isPgEnumSym in obj && obj[isPgEnumSym] === true;
}

// ../node_modules/drizzle-orm/subquery.js
class Subquery {
  static [entityKind] = "Subquery";
  constructor(sql, fields, alias, isWith = false, usedTables = []) {
    this._ = {
      brand: "Subquery",
      sql,
      selectedFields: fields,
      alias,
      isWith,
      usedTables
    };
  }
}

// ../node_modules/drizzle-orm/version.js
var version2 = "0.45.2";

// ../node_modules/drizzle-orm/tracing.js
var otel;
var rawTracer;
var tracer = {
  startActiveSpan(name, fn) {
    if (!otel) {
      return fn();
    }
    if (!rawTracer) {
      rawTracer = otel.trace.getTracer("drizzle-orm", version2);
    }
    return iife((otel2, rawTracer2) => rawTracer2.startActiveSpan(name, (span) => {
      try {
        return fn(span);
      } catch (e) {
        span.setStatus({
          code: otel2.SpanStatusCode.ERROR,
          message: e instanceof Error ? e.message : "Unknown error"
        });
        throw e;
      } finally {
        span.end();
      }
    }), otel, rawTracer);
  }
};

// ../node_modules/drizzle-orm/view-common.js
var ViewBaseConfig = Symbol.for("drizzle:ViewBaseConfig");

// ../node_modules/drizzle-orm/table.js
var Schema = Symbol.for("drizzle:Schema");
var Columns = Symbol.for("drizzle:Columns");
var ExtraConfigColumns = Symbol.for("drizzle:ExtraConfigColumns");
var OriginalName = Symbol.for("drizzle:OriginalName");
var BaseName = Symbol.for("drizzle:BaseName");
var IsAlias = Symbol.for("drizzle:IsAlias");
var ExtraConfigBuilder = Symbol.for("drizzle:ExtraConfigBuilder");
var IsDrizzleTable = Symbol.for("drizzle:IsDrizzleTable");

class Table {
  static [entityKind] = "Table";
  static Symbol = {
    Name: TableName,
    Schema,
    OriginalName,
    Columns,
    ExtraConfigColumns,
    BaseName,
    IsAlias,
    ExtraConfigBuilder
  };
  [TableName];
  [OriginalName];
  [Schema];
  [Columns];
  [ExtraConfigColumns];
  [BaseName];
  [IsAlias] = false;
  [IsDrizzleTable] = true;
  [ExtraConfigBuilder] = undefined;
  constructor(name, schema, baseName) {
    this[TableName] = this[OriginalName] = name;
    this[Schema] = schema;
    this[BaseName] = baseName;
  }
}

// ../node_modules/drizzle-orm/sql/sql.js
function isSQLWrapper(value) {
  return value !== null && value !== undefined && typeof value.getSQL === "function";
}
function mergeQueries(queries) {
  const result = { sql: "", params: [] };
  for (const query of queries) {
    result.sql += query.sql;
    result.params.push(...query.params);
    if (query.typings?.length) {
      if (!result.typings) {
        result.typings = [];
      }
      result.typings.push(...query.typings);
    }
  }
  return result;
}

class StringChunk {
  static [entityKind] = "StringChunk";
  value;
  constructor(value) {
    this.value = Array.isArray(value) ? value : [value];
  }
  getSQL() {
    return new SQL([this]);
  }
}

class SQL {
  constructor(queryChunks) {
    this.queryChunks = queryChunks;
    for (const chunk of queryChunks) {
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        this.usedTables.push(schemaName === undefined ? chunk[Table.Symbol.Name] : schemaName + "." + chunk[Table.Symbol.Name]);
      }
    }
  }
  static [entityKind] = "SQL";
  decoder = noopDecoder;
  shouldInlineParams = false;
  usedTables = [];
  append(query) {
    this.queryChunks.push(...query.queryChunks);
    return this;
  }
  toQuery(config) {
    return tracer.startActiveSpan("drizzle.buildSQL", (span) => {
      const query = this.buildQueryFromSourceParams(this.queryChunks, config);
      span?.setAttributes({
        "drizzle.query.text": query.sql,
        "drizzle.query.params": JSON.stringify(query.params)
      });
      return query;
    });
  }
  buildQueryFromSourceParams(chunks, _config) {
    const config = Object.assign({}, _config, {
      inlineParams: _config.inlineParams || this.shouldInlineParams,
      paramStartIndex: _config.paramStartIndex || { value: 0 }
    });
    const {
      casing,
      escapeName,
      escapeParam,
      prepareTyping,
      inlineParams,
      paramStartIndex
    } = config;
    return mergeQueries(chunks.map((chunk) => {
      if (is(chunk, StringChunk)) {
        return { sql: chunk.value.join(""), params: [] };
      }
      if (is(chunk, Name)) {
        return { sql: escapeName(chunk.value), params: [] };
      }
      if (chunk === undefined) {
        return { sql: "", params: [] };
      }
      if (Array.isArray(chunk)) {
        const result = [new StringChunk("(")];
        for (const [i, p] of chunk.entries()) {
          result.push(p);
          if (i < chunk.length - 1) {
            result.push(new StringChunk(", "));
          }
        }
        result.push(new StringChunk(")"));
        return this.buildQueryFromSourceParams(result, config);
      }
      if (is(chunk, SQL)) {
        return this.buildQueryFromSourceParams(chunk.queryChunks, {
          ...config,
          inlineParams: inlineParams || chunk.shouldInlineParams
        });
      }
      if (is(chunk, Table)) {
        const schemaName = chunk[Table.Symbol.Schema];
        const tableName = chunk[Table.Symbol.Name];
        return {
          sql: schemaName === undefined || chunk[IsAlias] ? escapeName(tableName) : escapeName(schemaName) + "." + escapeName(tableName),
          params: []
        };
      }
      if (is(chunk, Column)) {
        const columnName = casing.getColumnCasing(chunk);
        if (_config.invokeSource === "indexes") {
          return { sql: escapeName(columnName), params: [] };
        }
        const schemaName = chunk.table[Table.Symbol.Schema];
        return {
          sql: chunk.table[IsAlias] || schemaName === undefined ? escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName) : escapeName(schemaName) + "." + escapeName(chunk.table[Table.Symbol.Name]) + "." + escapeName(columnName),
          params: []
        };
      }
      if (is(chunk, View)) {
        const schemaName = chunk[ViewBaseConfig].schema;
        const viewName = chunk[ViewBaseConfig].name;
        return {
          sql: schemaName === undefined || chunk[ViewBaseConfig].isAlias ? escapeName(viewName) : escapeName(schemaName) + "." + escapeName(viewName),
          params: []
        };
      }
      if (is(chunk, Param)) {
        if (is(chunk.value, Placeholder)) {
          return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
        }
        const mappedValue = chunk.value === null ? null : chunk.encoder.mapToDriverValue(chunk.value);
        if (is(mappedValue, SQL)) {
          return this.buildQueryFromSourceParams([mappedValue], config);
        }
        if (inlineParams) {
          return { sql: this.mapInlineParam(mappedValue, config), params: [] };
        }
        let typings = ["none"];
        if (prepareTyping) {
          typings = [prepareTyping(chunk.encoder)];
        }
        return { sql: escapeParam(paramStartIndex.value++, mappedValue), params: [mappedValue], typings };
      }
      if (is(chunk, Placeholder)) {
        return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
      }
      if (is(chunk, SQL.Aliased) && chunk.fieldAlias !== undefined) {
        return { sql: escapeName(chunk.fieldAlias), params: [] };
      }
      if (is(chunk, Subquery)) {
        if (chunk._.isWith) {
          return { sql: escapeName(chunk._.alias), params: [] };
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk._.sql,
          new StringChunk(") "),
          new Name(chunk._.alias)
        ], config);
      }
      if (isPgEnum(chunk)) {
        if (chunk.schema) {
          return { sql: escapeName(chunk.schema) + "." + escapeName(chunk.enumName), params: [] };
        }
        return { sql: escapeName(chunk.enumName), params: [] };
      }
      if (isSQLWrapper(chunk)) {
        if (chunk.shouldOmitSQLParens?.()) {
          return this.buildQueryFromSourceParams([chunk.getSQL()], config);
        }
        return this.buildQueryFromSourceParams([
          new StringChunk("("),
          chunk.getSQL(),
          new StringChunk(")")
        ], config);
      }
      if (inlineParams) {
        return { sql: this.mapInlineParam(chunk, config), params: [] };
      }
      return { sql: escapeParam(paramStartIndex.value++, chunk), params: [chunk], typings: ["none"] };
    }));
  }
  mapInlineParam(chunk, { escapeString }) {
    if (chunk === null) {
      return "null";
    }
    if (typeof chunk === "number" || typeof chunk === "boolean") {
      return chunk.toString();
    }
    if (typeof chunk === "string") {
      return escapeString(chunk);
    }
    if (typeof chunk === "object") {
      const mappedValueAsString = chunk.toString();
      if (mappedValueAsString === "[object Object]") {
        return escapeString(JSON.stringify(chunk));
      }
      return escapeString(mappedValueAsString);
    }
    throw new Error("Unexpected param value: " + chunk);
  }
  getSQL() {
    return this;
  }
  as(alias) {
    if (alias === undefined) {
      return this;
    }
    return new SQL.Aliased(this, alias);
  }
  mapWith(decoder) {
    this.decoder = typeof decoder === "function" ? { mapFromDriverValue: decoder } : decoder;
    return this;
  }
  inlineParams() {
    this.shouldInlineParams = true;
    return this;
  }
  if(condition) {
    return condition ? this : undefined;
  }
}

class Name {
  constructor(value) {
    this.value = value;
  }
  static [entityKind] = "Name";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function isDriverValueEncoder(value) {
  return typeof value === "object" && value !== null && "mapToDriverValue" in value && typeof value.mapToDriverValue === "function";
}
var noopDecoder = {
  mapFromDriverValue: (value) => value
};
var noopEncoder = {
  mapToDriverValue: (value) => value
};
var noopMapper = {
  ...noopDecoder,
  ...noopEncoder
};

class Param {
  constructor(value, encoder = noopEncoder) {
    this.value = value;
    this.encoder = encoder;
  }
  static [entityKind] = "Param";
  brand;
  getSQL() {
    return new SQL([this]);
  }
}
function sql(strings, ...params) {
  const queryChunks = [];
  if (params.length > 0 || strings.length > 0 && strings[0] !== "") {
    queryChunks.push(new StringChunk(strings[0]));
  }
  for (const [paramIndex, param2] of params.entries()) {
    queryChunks.push(param2, new StringChunk(strings[paramIndex + 1]));
  }
  return new SQL(queryChunks);
}
((sql2) => {
  function empty() {
    return new SQL([]);
  }
  sql2.empty = empty;
  function fromList(list) {
    return new SQL(list);
  }
  sql2.fromList = fromList;
  function raw(str) {
    return new SQL([new StringChunk(str)]);
  }
  sql2.raw = raw;
  function join(chunks, separator) {
    const result = [];
    for (const [i, chunk] of chunks.entries()) {
      if (i > 0 && separator !== undefined) {
        result.push(separator);
      }
      result.push(chunk);
    }
    return new SQL(result);
  }
  sql2.join = join;
  function identifier(value) {
    return new Name(value);
  }
  sql2.identifier = identifier;
  function placeholder2(name2) {
    return new Placeholder(name2);
  }
  sql2.placeholder = placeholder2;
  function param2(value, encoder) {
    return new Param(value, encoder);
  }
  sql2.param = param2;
})(sql || (sql = {}));
((SQL2) => {

  class Aliased {
    constructor(sql2, fieldAlias) {
      this.sql = sql2;
      this.fieldAlias = fieldAlias;
    }
    static [entityKind] = "SQL.Aliased";
    isSelectionField = false;
    getSQL() {
      return this.sql;
    }
    clone() {
      return new Aliased(this.sql, this.fieldAlias);
    }
  }
  SQL2.Aliased = Aliased;
})(SQL || (SQL = {}));

class Placeholder {
  constructor(name2) {
    this.name = name2;
  }
  static [entityKind] = "Placeholder";
  getSQL() {
    return new SQL([this]);
  }
}
var IsDrizzleView = Symbol.for("drizzle:IsDrizzleView");

class View {
  static [entityKind] = "View";
  [ViewBaseConfig];
  [IsDrizzleView] = true;
  constructor({ name: name2, schema, selectedFields, query }) {
    this[ViewBaseConfig] = {
      name: name2,
      originalName: name2,
      schema,
      selectedFields,
      query,
      isExisting: !query,
      isAlias: false
    };
  }
  getSQL() {
    return new SQL([this]);
  }
}
Column.prototype.getSQL = function() {
  return new SQL([this]);
};
Table.prototype.getSQL = function() {
  return new SQL([this]);
};
Subquery.prototype.getSQL = function() {
  return new SQL([this]);
};

// ../node_modules/drizzle-orm/utils.js
function getColumnNameAndConfig(a, b) {
  return {
    name: typeof a === "string" && a.length > 0 ? a : "",
    config: typeof a === "object" ? a : b
  };
}
var textDecoder = typeof TextDecoder === "undefined" ? null : new TextDecoder;

// ../node_modules/drizzle-orm/sql/expressions/conditions.js
function bindIfParam(value, column) {
  if (isDriverValueEncoder(column) && !isSQLWrapper(value) && !is(value, Param) && !is(value, Placeholder) && !is(value, Column) && !is(value, Table) && !is(value, View)) {
    return new Param(value, column);
  }
  return value;
}
var eq = (left, right) => {
  return sql`${left} = ${bindIfParam(right, left)}`;
};

// ../node_modules/drizzle-orm/sql/expressions/select.js
function asc(column) {
  return sql`${column} asc`;
}
function desc(column) {
  return sql`${column} desc`;
}

// ../node_modules/drizzle-orm/sqlite-core/foreign-keys.js
class ForeignKeyBuilder {
  static [entityKind] = "SQLiteForeignKeyBuilder";
  reference;
  _onUpdate;
  _onDelete;
  constructor(config, actions) {
    this.reference = () => {
      const { name, columns, foreignColumns } = config();
      return { name, columns, foreignTable: foreignColumns[0].table, foreignColumns };
    };
    if (actions) {
      this._onUpdate = actions.onUpdate;
      this._onDelete = actions.onDelete;
    }
  }
  onUpdate(action) {
    this._onUpdate = action;
    return this;
  }
  onDelete(action) {
    this._onDelete = action;
    return this;
  }
  build(table) {
    return new ForeignKey(table, this);
  }
}

class ForeignKey {
  constructor(table, builder) {
    this.table = table;
    this.reference = builder.reference;
    this.onUpdate = builder._onUpdate;
    this.onDelete = builder._onDelete;
  }
  static [entityKind] = "SQLiteForeignKey";
  reference;
  onUpdate;
  onDelete;
  getName() {
    const { name, columns, foreignColumns } = this.reference();
    const columnNames = columns.map((column) => column.name);
    const foreignColumnNames = foreignColumns.map((column) => column.name);
    const chunks = [
      this.table[TableName],
      ...columnNames,
      foreignColumns[0].table[TableName],
      ...foreignColumnNames
    ];
    return name ?? `${chunks.join("_")}_fk`;
  }
}

// ../node_modules/drizzle-orm/sqlite-core/unique-constraint.js
function uniqueKeyName(table, columns) {
  return `${table[TableName]}_${columns.join("_")}_unique`;
}

// ../node_modules/drizzle-orm/sqlite-core/columns/common.js
class SQLiteColumnBuilder extends ColumnBuilder {
  static [entityKind] = "SQLiteColumnBuilder";
  foreignKeyConfigs = [];
  references(ref, actions = {}) {
    this.foreignKeyConfigs.push({ ref, actions });
    return this;
  }
  unique(name) {
    this.config.isUnique = true;
    this.config.uniqueName = name;
    return this;
  }
  generatedAlwaysAs(as, config) {
    this.config.generated = {
      as,
      type: "always",
      mode: config?.mode ?? "virtual"
    };
    return this;
  }
  buildForeignKeys(column, table) {
    return this.foreignKeyConfigs.map(({ ref, actions }) => {
      return ((ref2, actions2) => {
        const builder = new ForeignKeyBuilder(() => {
          const foreignColumn = ref2();
          return { columns: [column], foreignColumns: [foreignColumn] };
        });
        if (actions2.onUpdate) {
          builder.onUpdate(actions2.onUpdate);
        }
        if (actions2.onDelete) {
          builder.onDelete(actions2.onDelete);
        }
        return builder.build(table);
      })(ref, actions);
    });
  }
}

class SQLiteColumn extends Column {
  constructor(table, config) {
    if (!config.uniqueName) {
      config.uniqueName = uniqueKeyName(table, [config.name]);
    }
    super(table, config);
    this.table = table;
  }
  static [entityKind] = "SQLiteColumn";
}

// ../node_modules/drizzle-orm/sqlite-core/columns/blob.js
class SQLiteBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteBigInt");
  }
  build(table) {
    return new SQLiteBigInt(table, this.config);
  }
}

class SQLiteBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteBigInt";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return BigInt(buf.toString("utf8"));
    }
    return BigInt(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(value.toString());
  }
}

class SQLiteBlobJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteBlobJson");
  }
  build(table) {
    return new SQLiteBlobJson(table, this.config);
  }
}

class SQLiteBlobJson extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobJson";
  getSQLType() {
    return "blob";
  }
  mapFromDriverValue(value) {
    if (typeof Buffer !== "undefined" && Buffer.from) {
      const buf = Buffer.isBuffer(value) ? value : value instanceof ArrayBuffer ? Buffer.from(value) : value.buffer ? Buffer.from(value.buffer, value.byteOffset, value.byteLength) : Buffer.from(value);
      return JSON.parse(buf.toString("utf8"));
    }
    return JSON.parse(textDecoder.decode(value));
  }
  mapToDriverValue(value) {
    return Buffer.from(JSON.stringify(value));
  }
}

class SQLiteBlobBufferBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBlobBufferBuilder";
  constructor(name) {
    super(name, "buffer", "SQLiteBlobBuffer");
  }
  build(table) {
    return new SQLiteBlobBuffer(table, this.config);
  }
}

class SQLiteBlobBuffer extends SQLiteColumn {
  static [entityKind] = "SQLiteBlobBuffer";
  mapFromDriverValue(value) {
    if (Buffer.isBuffer(value)) {
      return value;
    }
    return Buffer.from(value);
  }
  getSQLType() {
    return "blob";
  }
}
function blob(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "json") {
    return new SQLiteBlobJsonBuilder(name);
  }
  if (config?.mode === "bigint") {
    return new SQLiteBigIntBuilder(name);
  }
  return new SQLiteBlobBufferBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/custom.js
class SQLiteCustomColumnBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteCustomColumnBuilder";
  constructor(name, fieldConfig, customTypeParams) {
    super(name, "custom", "SQLiteCustomColumn");
    this.config.fieldConfig = fieldConfig;
    this.config.customTypeParams = customTypeParams;
  }
  build(table) {
    return new SQLiteCustomColumn(table, this.config);
  }
}

class SQLiteCustomColumn extends SQLiteColumn {
  static [entityKind] = "SQLiteCustomColumn";
  sqlName;
  mapTo;
  mapFrom;
  constructor(table, config) {
    super(table, config);
    this.sqlName = config.customTypeParams.dataType(config.fieldConfig);
    this.mapTo = config.customTypeParams.toDriver;
    this.mapFrom = config.customTypeParams.fromDriver;
  }
  getSQLType() {
    return this.sqlName;
  }
  mapFromDriverValue(value) {
    return typeof this.mapFrom === "function" ? this.mapFrom(value) : value;
  }
  mapToDriverValue(value) {
    return typeof this.mapTo === "function" ? this.mapTo(value) : value;
  }
}
function customType(customTypeParams) {
  return (a, b) => {
    const { name, config } = getColumnNameAndConfig(a, b);
    return new SQLiteCustomColumnBuilder(name, config, customTypeParams);
  };
}

// ../node_modules/drizzle-orm/sqlite-core/columns/integer.js
class SQLiteBaseIntegerBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteBaseIntegerBuilder";
  constructor(name, dataType, columnType) {
    super(name, dataType, columnType);
    this.config.autoIncrement = false;
  }
  primaryKey(config) {
    if (config?.autoIncrement) {
      this.config.autoIncrement = true;
    }
    this.config.hasDefault = true;
    return super.primaryKey();
  }
}

class SQLiteBaseInteger extends SQLiteColumn {
  static [entityKind] = "SQLiteBaseInteger";
  autoIncrement = this.config.autoIncrement;
  getSQLType() {
    return "integer";
  }
}

class SQLiteIntegerBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteIntegerBuilder";
  constructor(name) {
    super(name, "number", "SQLiteInteger");
  }
  build(table) {
    return new SQLiteInteger(table, this.config);
  }
}

class SQLiteInteger extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteInteger";
}

class SQLiteTimestampBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteTimestampBuilder";
  constructor(name, mode) {
    super(name, "date", "SQLiteTimestamp");
    this.config.mode = mode;
  }
  defaultNow() {
    return this.default(sql`(cast((julianday('now') - 2440587.5)*86400000 as integer))`);
  }
  build(table) {
    return new SQLiteTimestamp(table, this.config);
  }
}

class SQLiteTimestamp extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteTimestamp";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    if (this.config.mode === "timestamp") {
      return new Date(value * 1000);
    }
    return new Date(value);
  }
  mapToDriverValue(value) {
    const unix = value.getTime();
    if (this.config.mode === "timestamp") {
      return Math.floor(unix / 1000);
    }
    return unix;
  }
}

class SQLiteBooleanBuilder extends SQLiteBaseIntegerBuilder {
  static [entityKind] = "SQLiteBooleanBuilder";
  constructor(name, mode) {
    super(name, "boolean", "SQLiteBoolean");
    this.config.mode = mode;
  }
  build(table) {
    return new SQLiteBoolean(table, this.config);
  }
}

class SQLiteBoolean extends SQLiteBaseInteger {
  static [entityKind] = "SQLiteBoolean";
  mode = this.config.mode;
  mapFromDriverValue(value) {
    return Number(value) === 1;
  }
  mapToDriverValue(value) {
    return value ? 1 : 0;
  }
}
function integer2(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config?.mode === "timestamp" || config?.mode === "timestamp_ms") {
    return new SQLiteTimestampBuilder(name, config.mode);
  }
  if (config?.mode === "boolean") {
    return new SQLiteBooleanBuilder(name, config.mode);
  }
  return new SQLiteIntegerBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/numeric.js
class SQLiteNumericBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBuilder";
  constructor(name) {
    super(name, "string", "SQLiteNumeric");
  }
  build(table) {
    return new SQLiteNumeric(table, this.config);
  }
}

class SQLiteNumeric extends SQLiteColumn {
  static [entityKind] = "SQLiteNumeric";
  mapFromDriverValue(value) {
    if (typeof value === "string")
      return value;
    return String(value);
  }
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericNumberBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericNumberBuilder";
  constructor(name) {
    super(name, "number", "SQLiteNumericNumber");
  }
  build(table) {
    return new SQLiteNumericNumber(table, this.config);
  }
}

class SQLiteNumericNumber extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericNumber";
  mapFromDriverValue(value) {
    if (typeof value === "number")
      return value;
    return Number(value);
  }
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}

class SQLiteNumericBigIntBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteNumericBigIntBuilder";
  constructor(name) {
    super(name, "bigint", "SQLiteNumericBigInt");
  }
  build(table) {
    return new SQLiteNumericBigInt(table, this.config);
  }
}

class SQLiteNumericBigInt extends SQLiteColumn {
  static [entityKind] = "SQLiteNumericBigInt";
  mapFromDriverValue = BigInt;
  mapToDriverValue = String;
  getSQLType() {
    return "numeric";
  }
}
function numeric(a, b) {
  const { name, config } = getColumnNameAndConfig(a, b);
  const mode = config?.mode;
  return mode === "number" ? new SQLiteNumericNumberBuilder(name) : mode === "bigint" ? new SQLiteNumericBigIntBuilder(name) : new SQLiteNumericBuilder(name);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/real.js
class SQLiteRealBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteRealBuilder";
  constructor(name) {
    super(name, "number", "SQLiteReal");
  }
  build(table) {
    return new SQLiteReal(table, this.config);
  }
}

class SQLiteReal extends SQLiteColumn {
  static [entityKind] = "SQLiteReal";
  getSQLType() {
    return "real";
  }
}
function real(name) {
  return new SQLiteRealBuilder(name ?? "");
}

// ../node_modules/drizzle-orm/sqlite-core/columns/text.js
class SQLiteTextBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextBuilder";
  constructor(name, config) {
    super(name, "string", "SQLiteText");
    this.config.enumValues = config.enum;
    this.config.length = config.length;
  }
  build(table) {
    return new SQLiteText(table, this.config);
  }
}

class SQLiteText extends SQLiteColumn {
  static [entityKind] = "SQLiteText";
  enumValues = this.config.enumValues;
  length = this.config.length;
  constructor(table, config) {
    super(table, config);
  }
  getSQLType() {
    return `text${this.config.length ? `(${this.config.length})` : ""}`;
  }
}

class SQLiteTextJsonBuilder extends SQLiteColumnBuilder {
  static [entityKind] = "SQLiteTextJsonBuilder";
  constructor(name) {
    super(name, "json", "SQLiteTextJson");
  }
  build(table) {
    return new SQLiteTextJson(table, this.config);
  }
}

class SQLiteTextJson extends SQLiteColumn {
  static [entityKind] = "SQLiteTextJson";
  getSQLType() {
    return "text";
  }
  mapFromDriverValue(value) {
    return JSON.parse(value);
  }
  mapToDriverValue(value) {
    return JSON.stringify(value);
  }
}
function text(a, b = {}) {
  const { name, config } = getColumnNameAndConfig(a, b);
  if (config.mode === "json") {
    return new SQLiteTextJsonBuilder(name);
  }
  return new SQLiteTextBuilder(name, config);
}

// ../node_modules/drizzle-orm/sqlite-core/columns/all.js
function getSQLiteColumnBuilders() {
  return {
    blob,
    customType,
    integer: integer2,
    numeric,
    real,
    text
  };
}

// ../node_modules/drizzle-orm/sqlite-core/table.js
var InlineForeignKeys = Symbol.for("drizzle:SQLiteInlineForeignKeys");

class SQLiteTable extends Table {
  static [entityKind] = "SQLiteTable";
  static Symbol = Object.assign({}, Table.Symbol, {
    InlineForeignKeys
  });
  [Table.Symbol.Columns];
  [InlineForeignKeys] = [];
  [Table.Symbol.ExtraConfigBuilder] = undefined;
}
function sqliteTableBase(name, columns, extraConfig, schema, baseName = name) {
  const rawTable = new SQLiteTable(name, schema, baseName);
  const parsedColumns = typeof columns === "function" ? columns(getSQLiteColumnBuilders()) : columns;
  const builtColumns = Object.fromEntries(Object.entries(parsedColumns).map(([name2, colBuilderBase]) => {
    const colBuilder = colBuilderBase;
    colBuilder.setName(name2);
    const column = colBuilder.build(rawTable);
    rawTable[InlineForeignKeys].push(...colBuilder.buildForeignKeys(column, rawTable));
    return [name2, column];
  }));
  const table = Object.assign(rawTable, builtColumns);
  table[Table.Symbol.Columns] = builtColumns;
  table[Table.Symbol.ExtraConfigColumns] = builtColumns;
  if (extraConfig) {
    table[SQLiteTable.Symbol.ExtraConfigBuilder] = extraConfig;
  }
  return table;
}
var sqliteTable = (name, columns, extraConfig) => {
  return sqliteTableBase(name, columns, extraConfig);
};

// ../node_modules/drizzle-orm/sqlite-core/primary-keys.js
function primaryKey(...config) {
  if (config[0].columns) {
    return new PrimaryKeyBuilder(config[0].columns, config[0].name);
  }
  return new PrimaryKeyBuilder(config);
}

class PrimaryKeyBuilder {
  static [entityKind] = "SQLitePrimaryKeyBuilder";
  columns;
  name;
  constructor(columns, name) {
    this.columns = columns;
    this.name = name;
  }
  build(table) {
    return new PrimaryKey(table, this.columns, this.name);
  }
}

class PrimaryKey {
  constructor(table, columns, name) {
    this.table = table;
    this.columns = columns;
    this.name = name;
  }
  static [entityKind] = "SQLitePrimaryKey";
  columns;
  name;
  getName() {
    return this.name ?? `${this.table[SQLiteTable.Symbol.Name]}_${this.columns.map((column) => column.name).join("_")}_pk`;
  }
}

// src/schema.ts
var products = sqliteTable("products", {
  id: integer2("id").primaryKey(),
  name: text("name").notNull(),
  hi: text("hi").notNull().default(""),
  weight: text("weight").notNull().default(""),
  price: integer2("price").notNull(),
  mrp: integer2("mrp").notNull(),
  category: text("category").notNull(),
  brand: text("brand").notNull().default(""),
  stock: integer2("stock").notNull().default(0),
  source: text("source").notNull().default("dark"),
  vendor: text("vendor").notNull().default(""),
  rating: real("rating").notNull().default(4.5),
  offPct: integer2("off_pct").notNull().default(0),
  description: text("description").notNull().default(""),
  bg: text("bg").notNull().default("#FFF1E6"),
  icon: text("icon").notNull().default("\uD83D\uDED2"),
  sortOrder: integer2("sort_order").notNull().default(0)
});
var areas = sqliteTable("areas", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  distKm: real("dist_km").notNull(),
  serviceable: integer2("serviceable").notNull().default(1),
  storeName: text("store_name").notNull(),
  storeType: text("store_type").notNull(),
  eta: text("eta").notNull(),
  unavailableIds: text("unavailable_ids").notNull().default("[]")
});
var profile = sqliteTable("profile", {
  id: integer2("id").primaryKey(),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  currentAreaId: text("current_area_id").notNull().default("sec62"),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: text("referred_by").notNull().default(""),
  coins: integer2("coins").notNull().default(0)
});
var subscriptions = sqliteTable("subscriptions", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  accountId: integer2("account_id").notNull().default(1),
  productId: integer2("product_id").notNull(),
  frequency: text("frequency").notNull().default("daily"),
  qty: integer2("qty").notNull().default(1),
  status: text("status").notNull().default("active"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var coinLedger = sqliteTable("coin_ledger", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  accountId: integer2("account_id").notNull().default(1),
  kind: text("kind").notNull().default("earn"),
  amount: integer2("amount").notNull().default(0),
  note: text("note").notNull().default(""),
  orderId: text("order_id"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var addresses = sqliteTable("addresses", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  accountId: integer2("account_id").notNull().default(1),
  label: text("label").notNull(),
  text: text("text").notNull(),
  isActive: integer2("is_active").notNull().default(0)
});
var wishlist = sqliteTable("wishlist", {
  accountId: integer2("account_id").notNull().default(1),
  productId: integer2("product_id").notNull()
}, (t) => [primaryKey({ columns: [t.accountId, t.productId] })]);
var orders = sqliteTable("orders", {
  id: text("id").primaryKey(),
  accountId: integer2("account_id").notNull().default(1),
  customerName: text("customer_name").notNull(),
  phone: text("phone").notNull(),
  addressLabel: text("address_label").notNull().default(""),
  addressText: text("address_text").notNull().default(""),
  areaId: text("area_id").notNull().default(""),
  areaName: text("area_name").notNull().default(""),
  items: text("items").notNull().default("[]"),
  itemsCount: integer2("items_count").notNull().default(0),
  subtotal: integer2("subtotal").notNull().default(0),
  discount: integer2("discount").notNull().default(0),
  deliveryFee: integer2("delivery_fee").notNull().default(0),
  grandTotal: integer2("grand_total").notNull().default(0),
  couponCode: text("coupon_code").notNull().default(""),
  coinsRedeemed: integer2("coins_redeemed").notNull().default(0),
  coinsEarned: integer2("coins_earned").notNull().default(0),
  paymentMethod: text("payment_method").notNull().default("cod"),
  paymentDetail: text("payment_detail").notNull().default(""),
  instructions: text("instructions").notNull().default(""),
  deliverySlot: text("delivery_slot").notNull().default("Abhi \u2014 8 minutes me"),
  isGift: integer2("is_gift").notNull().default(0),
  giftName: text("gift_name").notNull().default(""),
  giftPhone: text("gift_phone").notNull().default(""),
  giftNote: text("gift_note").notNull().default(""),
  status: text("status").notNull().default("placed"),
  statusStep: integer2("status_step").notNull().default(0),
  rating: integer2("rating"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var reviews = sqliteTable("reviews", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  productId: integer2("product_id").notNull(),
  author: text("author").notNull().default(""),
  rating: integer2("rating").notNull().default(5),
  text: text("text").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var notifyMe = sqliteTable("notify_me", {
  accountId: integer2("account_id").notNull().default(1),
  productId: integer2("product_id").notNull()
}, (t) => [primaryKey({ columns: [t.accountId, t.productId] })]);
var vendors = sqliteTable("vendors", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  shopName: text("shop_name").notNull(),
  ownerName: text("owner_name").notNull().default(""),
  phone: text("phone").notNull().default(""),
  area: text("area").notNull().default(""),
  status: text("status").notNull().default("approved"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var vendorCoupons = sqliteTable("vendor_coupons", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  off: integer2("off").notNull().default(0),
  minOrder: integer2("min_order").notNull().default(0),
  vendorName: text("vendor_name").notNull().default(""),
  enabled: integer2("enabled").notNull().default(1),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var adminConfig = sqliteTable("admin_config", {
  id: integer2("id").primaryKey(),
  pinHash: text("pin_hash").notNull(),
  salt: text("salt").notNull(),
  failedAttempts: integer2("failed_attempts").notNull().default(0),
  lockedUntil: integer2("locked_until").notNull().default(0)
});
var adminSessions = sqliteTable("admin_sessions", {
  token: text("token").primaryKey(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer2("expires_at", { mode: "timestamp_ms" }).notNull()
});
var adminActivity = sqliteTable("admin_activity", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  kind: text("kind").notNull(),
  detail: text("detail").notNull().default(""),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var appSettings = sqliteTable("app_settings", {
  id: integer2("id").primaryKey(),
  deliveryCharge: integer2("delivery_charge").notNull().default(25),
  freeThreshold: integer2("free_threshold").notNull().default(199),
  geofenceKm: real("geofence_km").notNull().default(2)
});
var platformCoupons = sqliteTable("platform_coupons", {
  code: text("code").primaryKey(),
  off: integer2("off").notNull().default(0),
  minOrder: integer2("min_order").notNull().default(0),
  label: text("label").notNull().default(""),
  enabled: integer2("enabled").notNull().default(1)
});
var accounts = sqliteTable("accounts", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  phone: text("phone").notNull(),
  pinHash: text("pin_hash").notNull().default(""),
  salt: text("salt").notNull().default(""),
  failedAttempts: integer2("failed_attempts").notNull().default(0),
  lockedUntil: integer2("locked_until").notNull().default(0),
  referralCode: text("referral_code").notNull().default(""),
  referredBy: text("referred_by").notNull().default(""),
  coins: integer2("coins").notNull().default(0),
  currentAreaId: text("current_area_id").notNull().default("sec62"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var customerSessions = sqliteTable("customer_sessions", {
  token: text("token").primaryKey(),
  accountId: integer2("account_id").notNull(),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull(),
  expiresAt: integer2("expires_at", { mode: "timestamp_ms" }).notNull()
});
var appState = sqliteTable("app_state", {
  id: integer2("id").primaryKey(),
  currentAccountId: integer2("current_account_id").notNull().default(1),
  currentSessionToken: text("current_session_token").notNull().default("")
});
var supportTickets = sqliteTable("support_tickets", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  mobile: text("mobile").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull().default("open"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});
var notifications = sqliteTable("notifications", {
  id: integer2("id").primaryKey({ autoIncrement: true }),
  audience: text("audience").notNull().default("customer"),
  type: text("type").notNull().default("order"),
  title: text("title").notNull(),
  message: text("message").notNull().default(""),
  isRead: integer2("is_read").notNull().default(0),
  orderId: text("order_id"),
  productId: integer2("product_id"),
  createdAt: integer2("created_at", { mode: "timestamp_ms" }).notNull()
});

// src/actions.ts
var SEED_PRODUCTS = [
  { id: 1, name: "Farm Fresh Toned Milk", hi: "Doodh", weight: "500 ml", price: 27, mrp: 30, category: "dairy", icon: "\uD83E\uDD5B", bg: "#FFF7D6", rating: 4.8, off: 10, description: "Roz subah farm se aaya toned doodh. Chai, coffee aur baccho ke liye perfect.", brand: "Amul", stock: 24, source: "dark", vendor: "" },
  { id: 2, name: "Desi Tamatar (Tomato)", hi: "Tamatar", weight: "500 g", price: 24, mrp: 40, category: "fruits", icon: "\uD83C\uDF45", bg: "#FFE8E0", rating: 4.6, off: 40, description: "Laal, raseele desi tamatar \u2014 sabzi, salad aur chutney ke liye best.", brand: "Fatafat Fresh", stock: 18, source: "dark", vendor: "" },
  { id: 3, name: "Robusta Kela (Banana)", hi: "Kela", weight: "6 pcs", price: 36, mrp: 48, category: "fruits", icon: "\uD83C\uDF4C", bg: "#FFF3C4", rating: 4.7, off: 25, description: "Pakke hue robusta kele, energy se bharpoor. Shake aur snack dono ke liye.", brand: "Fatafat Fresh", stock: 22, source: "dark", vendor: "" },
  { id: 4, name: "Brown Bread \u2014 Whole Wheat", hi: "Bread", weight: "400 g", price: 45, mrp: 55, category: "dairy", icon: "\uD83C\uDF5E", bg: "#FDEBD0", rating: 4.5, off: 18, description: "100% whole wheat brown bread, aaj hi baked. Sandwich ke liye soft slices.", brand: "Britannia", stock: 14, source: "vendor", vendor: "Sharma General Store" },
  { id: 5, name: "Farm Eggs \u2014 Tray", hi: "Ande", weight: "12 pcs", price: 78, mrp: 96, category: "dairy", icon: "\uD83E\uDD5A", bg: "#FFF1E6", rating: 4.8, off: 19, description: "Protein-rich farm eggs, har egg check karke pack kiya gaya.", brand: "Farm Fresh", stock: 16, source: "dark", vendor: "" },
  { id: 6, name: "Aloo Chips \u2014 Masala Magic", hi: "Chips", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "\uD83C\uDF5F", bg: "#FFEFE0", rating: 4.4, off: 0, description: "Crispy aloo chips chatpate masale ke saath. Chai-time ka best dost.", brand: "Haldiram's", stock: 30, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 7, name: "Salted Peanuts", hi: "Moongphali", weight: "200 g", price: 49, mrp: 65, category: "snacks", icon: "\uD83E\uDD5C", bg: "#F3EAD9", rating: 4.5, off: 25, description: "Bhuni hui namkeen moongphali, bilkul fresh aur crunchy.", brand: "Haldiram's", stock: 9, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 8, name: "Choco Cookies Pack", hi: "Biscuit Cookies", weight: "300 g", price: 65, mrp: 85, category: "snacks", icon: "\uD83C\uDF6A", bg: "#FDEBD0", rating: 4.6, off: 24, description: "Chocolate chips se bhari cookies \u2014 doodh ke saath kamaal.", brand: "Parle", stock: 20, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 9, name: "Cola \u2014 Chilled", hi: "Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "\uD83E\uDD64", bg: "#E6F4FF", rating: 4.5, off: 11, description: "Bilkul chilled cola bottle. Khana ke saath perfect fizz.", brand: "Fizz Cola", stock: 26, source: "vendor", vendor: "Sharma General Store" },
  { id: 10, name: "Orange Juice \u2014 No Sugar", hi: "Juice", weight: "1 L", price: 99, mrp: 130, category: "drinks", icon: "\uD83E\uDDC3", bg: "#FFE8CC", rating: 4.7, off: 24, description: "Bina added sugar wala orange juice, Vitamin C se bharpoor.", brand: "Real", stock: 12, source: "vendor", vendor: "Sharma General Store" },
  { id: 11, name: "Cold Coffee Can", hi: "Coffee", weight: "240 ml", price: 55, mrp: 70, category: "drinks", icon: "\u2615", bg: "#EFE6DD", rating: 4.6, off: 21, description: "Ready-to-drink creamy cold coffee. Fridge se seedha sip.", brand: "Nescafe", stock: 4, source: "vendor", vendor: "Sharma General Store" },
  { id: 12, name: "Butter Croissant (2 pc)", hi: "Croissant", weight: "120 g", price: 89, mrp: 110, category: "bakery", icon: "\uD83E\uDD50", bg: "#FDECEC", rating: 4.8, off: 19, description: "Makhan wala flaky croissant, bakery se fresh aaya.", brand: "Bake House", stock: 7, source: "dark", vendor: "" },
  { id: 13, name: "Chocolate Muffin", hi: "Muffin", weight: "110 g", price: 59, mrp: 75, category: "bakery", icon: "\uD83E\uDDC1", bg: "#FDECEC", rating: 4.7, off: 21, description: "Soft chocolate muffin, beech me gooey choco center.", brand: "Bake House", stock: 11, source: "dark", vendor: "" },
  { id: 14, name: "Sharbati Atta", hi: "Atta Gehu", weight: "5 kg", price: 229, mrp: 285, category: "grocery", icon: "\uD83C\uDF3E", bg: "#F3EAD9", rating: 4.8, off: 20, description: "Sharbati gehu ka atta \u2014 roti phuli-phuli aur naram banti hai.", brand: "Aashirvaad", stock: 15, source: "dark", vendor: "" },
  { id: 15, name: "Basmati Chawal", hi: "Rice Chawal", weight: "1 kg", price: 89, mrp: 115, category: "grocery", icon: "\uD83C\uDF5A", bg: "#F7F1E3", rating: 4.7, off: 23, description: "Lambi basmati, biryani aur pulao ke liye khushboodar.", brand: "India Gate", stock: 13, source: "dark", vendor: "" },
  { id: 16, name: "Haldi Powder", hi: "Haldi Turmeric", weight: "200 g", price: 42, mrp: 55, category: "grocery", icon: "\uD83D\uDFE1", bg: "#FFF3C4", rating: 4.6, off: 24, description: "Shudh haldi powder, rang aur sehat dono ke liye.", brand: "MDH", stock: 19, source: "vendor", vendor: "Sharma General Store" },
  { id: 17, name: "Fresh Paneer", hi: "Paneer", weight: "200 g", price: 85, mrp: 99, category: "dairy", icon: "\uD83E\uDDC0", bg: "#FFF7D6", rating: 4.8, off: 14, description: "Aaj ka bana naram paneer \u2014 sabzi, pakode, tikka sab chalega.", brand: "Amul", stock: 5, source: "dark", vendor: "" },
  { id: 18, name: "Hara Dhaniya + Mirchi Combo", hi: "Dhaniya Mirchi", weight: "100 g", price: 15, mrp: 25, category: "fruits", icon: "\uD83C\uDF3F", bg: "#EAF7EC", rating: 4.5, off: 40, description: "Taaza hara dhaniya aur hari mirchi ka combo pack.", brand: "Fatafat Fresh", stock: 28, source: "dark", vendor: "" },
  { id: 19, name: "Shimla Mirchi (Capsicum)", hi: "Shimla Mirchi", weight: "500 g", price: 38, mrp: 55, category: "fruits", icon: "\uD83E\uDED1", bg: "#EAF7EC", rating: 4.6, off: 31, description: "Hari shimla mirchi, crunchy aur fresh.", brand: "Fatafat Fresh", stock: 17, source: "dark", vendor: "" },
  { id: 20, name: "Aam \u2014 Alphonso Special", hi: "Aam Mango", weight: "1 kg", price: 349, mrp: 499, category: "fruits", icon: "\uD83E\uDD6D", bg: "#FFE8CC", rating: 4.9, off: 30, description: "Season ke best Alphonso aam \u2014 meethe, raseele, khushboodar.", brand: "Fatafat Fresh", stock: 6, source: "dark", vendor: "" },
  { id: 21, name: "Gentle Face Wash", hi: "Face Wash", weight: "100 ml", price: 149, mrp: 199, category: "care", icon: "\uD83E\uDDF4", bg: "#EDE9FF", rating: 4.6, off: 25, description: "Har skin type ke liye gentle face wash, roz ke use ke liye.", brand: "Mamaearth", stock: 10, source: "vendor", vendor: "City Care Store" },
  { id: 22, name: "Herbal Shampoo", hi: "Shampoo", weight: "340 ml", price: 179, mrp: 240, category: "care", icon: "\uD83E\uDDD6", bg: "#EDE9FF", rating: 4.5, off: 25, description: "Amla-shikakai wala herbal shampoo, baalo ko naram rakhe.", brand: "Ayur Herbal", stock: 8, source: "vendor", vendor: "City Care Store" },
  { id: 23, name: "Instant Noodles (Pack of 4)", hi: "Noodles Maggi", weight: "280 g", price: 56, mrp: 64, category: "snacks", icon: "\uD83C\uDF5C", bg: "#FFEFE0", rating: 4.7, off: 13, description: "2-minute instant noodles, 4 pack. Hostel aur ghar dono ke hero.", brand: "Maggi", stock: 25, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 24, name: "Vanilla Ice Cream Tub", hi: "Ice Cream", weight: "700 ml", price: 145, mrp: 180, category: "bakery", icon: "\uD83C\uDF66", bg: "#E6F4FF", rating: 4.8, off: 19, description: "Creamy vanilla ice cream tub \u2014 poori family ke liye.", brand: "Amul", stock: 3, source: "dark", vendor: "" },
  { id: 25, name: "Cadbury Dairy Milk Chocolate", hi: "Chocolate Dairy Milk", weight: "110 g", price: 82, mrp: 90, category: "chocolates", icon: "\uD83C\uDF6B", bg: "#F3E5F5", rating: 4.8, off: 9, description: "Silky smooth milk chocolate bar \u2014 India ki sabse pasandeeda chocolate.", brand: "Cadbury", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 26, name: "KitKat 4 Fingers", hi: "KitKat Chocolate Wafer", weight: "38.5 g", price: 28, mrp: 30, category: "chocolates", icon: "\uD83C\uDF6B", bg: "#FDECEC", rating: 4.7, off: 7, description: "Crispy wafer fingers chocolate me lipte \u2014 have a break, have a KitKat!", brand: "Nestle", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 27, name: "Snickers Peanut Chocolate Bar", hi: "Snickers Chocolate", weight: "45 g", price: 35, mrp: 40, category: "chocolates", icon: "\uD83E\uDD5C", bg: "#FDEBD0", rating: 4.7, off: 13, description: "Moongphali, caramel aur nougat se bhari chocolate bar \u2014 bhookh ka full ilaaj.", brand: "Mars", stock: 38, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 28, name: "Cadbury 5 Star", hi: "5 Star Chocolate", weight: "40 g", price: 20, mrp: 20, category: "chocolates", icon: "\u2B50", bg: "#FFF3C4", rating: 4.5, off: 0, description: "Soft caramel-nougat wali classic 5 Star \u2014 khao aur kho jao.", brand: "Cadbury", stock: 50, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 29, name: "Cadbury Perk", hi: "Perk Chocolate Wafer", weight: "13 g", price: 5, mrp: 5, category: "chocolates", icon: "\u26A1", bg: "#E6F4FF", rating: 4.4, off: 0, description: "Halki-phulki crispy wafer chocolate \u2014 kabhi bhi, kahin bhi wali treat.", brand: "Cadbury", stock: 60, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 30, name: "Nestle Munch Max", hi: "Munch Chocolate Wafer", weight: "38.5 g", price: 20, mrp: 20, category: "chocolates", icon: "\uD83C\uDF6B", bg: "#F3E5F5", rating: 4.5, off: 0, description: "Extra crunchy, extra choco wafer bar \u2014 Munch ka full mazaa.", brand: "Nestle", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 31, name: "Cadbury Dairy Milk Silk", hi: "Silk Chocolate Premium", weight: "150 g", price: 165, mrp: 185, category: "chocolates", icon: "\uD83C\uDF6B", bg: "#F3E5F5", rating: 4.9, off: 11, description: "Premium silky-smooth chocolate \u2014 gift ke liye aur khud ko treat dene ke liye best.", brand: "Cadbury", stock: 18, source: "dark", vendor: "" },
  { id: 32, name: "Ferrero Rocher (4 pc)", hi: "Ferrero Rocher Chocolate", weight: "50 g", price: 149, mrp: 175, category: "chocolates", icon: "\uD83C\uDF30", bg: "#FDEBD0", rating: 4.9, off: 15, description: "Golden hazelnut chocolate balls \u2014 premium gifting wala pack.", brand: "Ferrero", stock: 14, source: "dark", vendor: "" },
  { id: 33, name: "Lay's Magic Masala Chips", hi: "Lays Chips Masala", weight: "73 g", price: 20, mrp: 20, category: "snacks", icon: "\uD83E\uDD54", bg: "#E3F2FD", rating: 4.6, off: 0, description: "India ka favourite \u2014 chatpata Magic Masala flavour, perfect crunch ke saath.", brand: "Lay's", stock: 50, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 34, name: "Lay's Classic Salted Chips", hi: "Lays Chips Salted Namkeen", weight: "73 g", price: 20, mrp: 20, category: "snacks", icon: "\uD83E\uDD54", bg: "#FFF3C4", rating: 4.5, off: 0, description: "Halke namak wale classic crispy chips \u2014 simple aur sabse best.", brand: "Lay's", stock: 45, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 35, name: "Kurkure Masala Munch", hi: "Kurkure Namkeen", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "\uD83C\uDF3D", bg: "#FFE8E0", rating: 4.5, off: 0, description: "Tedha hai par mera hai \u2014 masaledar crunchy Kurkure sticks.", brand: "Kurkure", stock: 48, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 36, name: "Bingo! Mad Angles \u2014 Mmmmm Masala", hi: "Bingo Chips Namkeen", weight: "90 g", price: 20, mrp: 20, category: "snacks", icon: "\uD83D\uDD3A", bg: "#FFEFE0", rating: 4.4, off: 0, description: "Triangle wale masala corn chips \u2014 har angle se chatpate.", brand: "Bingo", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 37, name: "Haldiram's Aloo Bhujia", hi: "Aloo Bhujia Namkeen", weight: "400 g", price: 105, mrp: 120, category: "snacks", icon: "\uD83E\uDD68", bg: "#EAF7EC", rating: 4.7, off: 13, description: "Masaledar aloo bhujia \u2014 chai ke saath aur bina chai ke bhi superhit namkeen.", brand: "Haldiram's", stock: 25, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 38, name: "Act II Popcorn \u2014 Classic Salted", hi: "Popcorn", weight: "90 g", price: 35, mrp: 40, category: "snacks", icon: "\uD83C\uDF7F", bg: "#FFF3C4", rating: 4.5, off: 13, description: "3 minute me garam-garam popcorn \u2014 movie night ke liye ready.", brand: "Act II", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 39, name: "Parle-G Gold Biscuits", hi: "Parle G Biscuit", weight: "1 kg", price: 140, mrp: 150, category: "snacks", icon: "\uD83C\uDF6A", bg: "#FDEBD0", rating: 4.8, off: 7, description: "Bharat ka apna biscuit \u2014 chai me dubo ke khane wala bada family pack.", brand: "Parle", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 40, name: "Britannia Good Day Butter Cookies", hi: "Good Day Biscuit Cookies", weight: "100 g", price: 25, mrp: 30, category: "snacks", icon: "\uD83C\uDF6A", bg: "#E6F4FF", rating: 4.6, off: 17, description: "Makhan wali smile cookies \u2014 har bite me good day wala taste.", brand: "Britannia", stock: 35, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 41, name: "Cadbury Oreo Original", hi: "Oreo Biscuit Cookies", weight: "41.75 g", price: 25, mrp: 25, category: "snacks", icon: "\uD83C\uDF6A", bg: "#E3F2FD", rating: 4.6, off: 0, description: "Twist, lick, dunk \u2014 cream wale chocolate sandwich biscuits.", brand: "Cadbury", stock: 40, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 42, name: "Parle Monaco Classic", hi: "Monaco Biscuit Namkeen", weight: "261 g", price: 55, mrp: 65, category: "snacks", icon: "\uD83C\uDF58", bg: "#FFF3C4", rating: 4.5, off: 15, description: "Halke namkeen crispy crackers \u2014 chai-time aur topping dono ke liye.", brand: "Parle", stock: 28, source: "vendor", vendor: "Sharma General Store" },
  { id: 43, name: "Britannia Toastea Rusk", hi: "Rusk Toast Chai", weight: "400 g", price: 65, mrp: 75, category: "bakery", icon: "\uD83C\uDF5E", bg: "#FDEBD0", rating: 4.6, off: 13, description: "Kadak bake rusk \u2014 subah ki chai ka permanent saathi.", brand: "Britannia", stock: 20, source: "vendor", vendor: "Sharma General Store" },
  { id: 44, name: "Coca-Cola \u2014 Original Taste", hi: "Coke Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "\uD83E\uDD64", bg: "#FDECEC", rating: 4.7, off: 11, description: "Bilkul chilled original Coca-Cola \u2014 khana ho ya party, sab ke saath perfect.", brand: "Coca-Cola", stock: 30, source: "vendor", vendor: "Sharma General Store" },
  { id: 45, name: "Pepsi \u2014 Original", hi: "Pepsi Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "\uD83E\uDD64", bg: "#E6F4FF", rating: 4.6, off: 11, description: "Thandi Pepsi bottle \u2014 full fizz, full refreshment.", brand: "Pepsi", stock: 28, source: "vendor", vendor: "Sharma General Store" },
  { id: 46, name: "Sprite \u2014 Lemon-Lime", hi: "Sprite Cold Drink", weight: "750 ml", price: 40, mrp: 45, category: "drinks", icon: "\uD83C\uDF4B", bg: "#EAF7EC", rating: 4.6, off: 11, description: "Nimbu wala fresh sparkle \u2014 garmi me sabse best thandak.", brand: "Sprite", stock: 26, source: "vendor", vendor: "Sharma General Store" },
  { id: 47, name: "Frooti \u2014 Mango Drink", hi: "Frooti Aam Mango Drink", weight: "1 L", price: 60, mrp: 66, category: "drinks", icon: "\uD83E\uDDC3", bg: "#FFF3C4", rating: 4.7, off: 9, description: "Aam ka asli mazaa \u2014 bachpan wali Frooti, bade pack me.", brand: "Parle Agro", stock: 22, source: "vendor", vendor: "Sharma General Store" },
  { id: 48, name: "Maaza \u2014 Mango Drink", hi: "Maaza Aam Mango Drink", weight: "1.2 L", price: 72, mrp: 80, category: "drinks", icon: "\uD83E\uDD6D", bg: "#FFE8CC", rating: 4.7, off: 10, description: "Raseela aam drink \u2014 poori family ke liye bada bottle pack.", brand: "Maaza", stock: 20, source: "vendor", vendor: "Sharma General Store" },
  { id: 49, name: "Red Bull Energy Drink", hi: "Red Bull Energy Drink", weight: "250 ml", price: 125, mrp: 125, category: "drinks", icon: "\u26A1", bg: "#E6F4FF", rating: 4.6, off: 0, description: "Energy wala can \u2014 kaam, gym ya late-night padhai ke liye boost.", brand: "Red Bull", stock: 16, source: "dark", vendor: "" },
  { id: 50, name: "Maggi Noodles \u2014 Single Pack", hi: "Maggi Noodles", weight: "70 g", price: 14, mrp: 14, category: "snacks", icon: "\uD83C\uDF5C", bg: "#FFEFE0", rating: 4.7, off: 0, description: "Ek wala chhota pack \u2014 2 minute me masala noodles ready.", brand: "Maggi", stock: 60, source: "vendor", vendor: "Gupta Snacks Corner" },
  { id: 51, name: "Knorr Hot & Sour Veg Soup", hi: "Soup Knorr", weight: "51 g", price: 55, mrp: 62, category: "grocery", icon: "\uD83C\uDF72", bg: "#EAF7EC", rating: 4.5, off: 11, description: "Garam-garam Chinese style soup \u2014 100% real sabziyon ke saath, ghar par restaurant wala swad.", brand: "Knorr", stock: 18, source: "vendor", vendor: "Sharma General Store" },
  { id: 52, name: "Tata Tea Gold", hi: "Chai Tea Tata Gold", weight: "500 g", price: 240, mrp: 270, category: "grocery", icon: "\uD83C\uDF75", bg: "#FFF3C4", rating: 4.8, off: 11, description: "Kadak chai patti \u2014 rich taste aur khushboo, subah ki shuruaat ke liye.", brand: "Tata Tea", stock: 15, source: "dark", vendor: "" },
  { id: 53, name: "Nescafe Classic Coffee", hi: "Coffee Nescafe", weight: "200 g", price: 355, mrp: 390, category: "grocery", icon: "\u2615", bg: "#EFE6DD", rating: 4.7, off: 9, description: "Instant coffee jar \u2014 garam ya thandi, jaise chaaho waise banao.", brand: "Nescafe", stock: 12, source: "vendor", vendor: "Sharma General Store" },
  { id: 54, name: "Cadbury Bournvita", hi: "Bournvita Health Drink", weight: "500 g", price: 235, mrp: 260, category: "grocery", icon: "\uD83E\uDD5B", bg: "#FFE8CC", rating: 4.7, off: 10, description: "Baccho ke liye chocolate health drink \u2014 doodh ke saath tann ki shakti, mann ki shakti.", brand: "Cadbury", stock: 14, source: "vendor", vendor: "Sharma General Store" },
  { id: 55, name: "Dabur Honey \u2014 100% Pure", hi: "Shahad Honey Dabur", weight: "250 g", price: 105, mrp: 125, category: "grocery", icon: "\uD83C\uDF6F", bg: "#FFF7D6", rating: 4.6, off: 16, description: "Shudh shahad \u2014 garam paani, chai ya toast ke saath roz ki sehat.", brand: "Dabur", stock: 16, source: "dark", vendor: "" },
  { id: 56, name: "Dettol Original Soap (Pack of 4)", hi: "Sabun Soap Dettol", weight: "4 \xD7 100 g", price: 118, mrp: 136, category: "care", icon: "\uD83E\uDDFC", bg: "#EAF7EC", rating: 4.6, off: 13, description: "99.99% germs se protection wala original Dettol sabun \u2014 poori family ke liye 4 ka pack.", brand: "Dettol", stock: 22, source: "vendor", vendor: "City Care Store" },
  { id: 57, name: "Colgate MaxFresh Toothpaste", hi: "Toothpaste Colgate Manjan", weight: "150 g", price: 95, mrp: 110, category: "care", icon: "\uD83E\uDEA5", bg: "#FDECEC", rating: 4.7, off: 14, description: "Gehri saafai aur taaza saans \u2014 cavity protection ke saath roz wala toothpaste.", brand: "Colgate", stock: 26, source: "vendor", vendor: "City Care Store" },
  { id: 58, name: "Fogg Force Deodorant Spray", hi: "Deo Perfume Fogg Body Spray", weight: "150 ml", price: 199, mrp: 275, category: "care", icon: "\uD83E\uDDF4", bg: "#E6F4FF", rating: 4.5, off: 28, description: "Long-lasting fragrance body spray \u2014 bina gas wala, poora din fresh rakhe.", brand: "Fogg", stock: 18, source: "vendor", vendor: "City Care Store" },
  { id: 59, name: "Parachute Coconut Hair Oil", hi: "Nariyal Tel Hair Oil Parachute", weight: "300 ml", price: 115, mrp: 132, category: "care", icon: "\uD83E\uDD65", bg: "#EAF7EC", rating: 4.7, off: 13, description: "100% shudh nariyal tel \u2014 lambe, ghane aur mazboot baalo ke liye.", brand: "Parachute", stock: 20, source: "vendor", vendor: "City Care Store" },
  { id: 60, name: "Lifebuoy Hand Sanitizer", hi: "Sanitizer Hand Wash Lifebuoy", weight: "190 ml", price: 75, mrp: 99, category: "care", icon: "\uD83E\uDDF4", bg: "#E6F4FF", rating: 4.5, off: 24, description: "99.99% germs marne wala hand sanitizer \u2014 ghar, office aur safar ke liye.", brand: "Lifebuoy", stock: 24, source: "vendor", vendor: "City Care Store" },
  { id: 61, name: "Surf Excel Easy Wash Detergent", hi: "Detergent Surf Kapde Dhone", weight: "1 kg", price: 118, mrp: 135, category: "care", icon: "\uD83E\uDDFA", bg: "#E3F2FD", rating: 4.6, off: 13, description: "Ziddi daag aasani se nikale \u2014 haath aur machine dono wash ke liye.", brand: "Surf Excel", stock: 16, source: "vendor", vendor: "Sharma General Store" },
  { id: 62, name: "Nivea Body Lotion", hi: "Body Lotion Cream Nivea", weight: "200 ml", price: 185, mrp: 225, category: "care", icon: "\uD83E\uDDF4", bg: "#EDE9FF", rating: 4.6, off: 18, description: "48 ghante tak gehra moisture \u2014 dry skin ke liye roz wala body lotion.", brand: "Nivea", stock: 14, source: "vendor", vendor: "City Care Store" },
  { id: 63, name: "Gillette Shaving Foam", hi: "Shaving Cream Foam Gillette", weight: "196 g", price: 160, mrp: 185, category: "care", icon: "\uD83E\uDE92", bg: "#EFE6DD", rating: 4.5, off: 14, description: "Ghani, naram foam \u2014 smooth shave bina jalan ke.", brand: "Gillette", stock: 12, source: "vendor", vendor: "City Care Store" },
  { id: 64, name: "Pampers Baby Diapers (M, 24 pc)", hi: "Diaper Baby Pampers", weight: "24 pcs", price: 399, mrp: 499, category: "babypet", icon: "\uD83D\uDC76", bg: "#FFF7D6", rating: 4.8, off: 20, description: "12 ghante tak dry rakhe \u2014 soft, rash-free diapers baby ki neend ke liye.", brand: "Pampers", stock: 15, source: "vendor", vendor: "City Care Store" },
  { id: 65, name: "Nestle Cerelac Wheat Baby Food", hi: "Cerelac Baby Khana", weight: "300 g", price: 255, mrp: 285, category: "babypet", icon: "\uD83C\uDF7C", bg: "#FFE8CC", rating: 4.8, off: 11, description: "6 mahine+ ke baby ke liye iron aur vitamins wala wheat cereal.", brand: "Nestle", stock: 13, source: "vendor", vendor: "City Care Store" },
  { id: 66, name: "Johnson's Baby Soap", hi: "Baby Sabun Soap Johnsons", weight: "75 g", price: 52, mrp: 60, category: "babypet", icon: "\uD83E\uDDFC", bg: "#FDECEC", rating: 4.7, off: 13, description: "Baby ki naram skin ke liye extra mild soap \u2014 no tears, sirf softness.", brand: "Johnson's", stock: 21, source: "vendor", vendor: "City Care Store" },
  { id: 67, name: "Pedigree Dog Food \u2014 Chicken & Veg", hi: "Dog Food Kutta Khana Pedigree", weight: "1.2 kg", price: 349, mrp: 399, category: "babypet", icon: "\uD83D\uDC36", bg: "#FDEBD0", rating: 4.7, off: 13, description: "Adult dogs ke liye complete nutrition \u2014 chicken aur sabziyon ke saath.", brand: "Pedigree", stock: 11, source: "vendor", vendor: "City Care Store" },
  { id: 68, name: "Whiskas Cat Food \u2014 Ocean Fish", hi: "Cat Food Billi Khana Whiskas", weight: "480 g", price: 185, mrp: 210, category: "babypet", icon: "\uD83D\uDC31", bg: "#F3E5F5", rating: 4.6, off: 12, description: "Billi ke liye ocean fish flavour \u2014 chamakti skin aur sehatmand coat ke liye.", brand: "Whiskas", stock: 14, source: "vendor", vendor: "City Care Store" },
  { id: 69, name: "Drools Dog Treats \u2014 Calcium Bones", hi: "Dog Treats Biscuit Drools", weight: "300 g", price: 165, mrp: 199, category: "babypet", icon: "\uD83E\uDDB4", bg: "#F3EAD9", rating: 4.6, off: 17, description: "Calcium wali treat bones \u2014 daant mazboot, kutta khush.", brand: "Drools", stock: 17, source: "vendor", vendor: "City Care Store" },
  { id: 70, name: "Safal Frozen Green Peas", hi: "Frozen Matar Peas Safal", weight: "500 g", price: 65, mrp: 80, category: "frozen", icon: "\uD83D\uDFE2", bg: "#EAF7EC", rating: 4.6, off: 19, description: "Taaze hare matar, frozen fresh \u2014 bina chilke ki mehnat, seedha sabzi me.", brand: "Safal", stock: 25, source: "dark", vendor: "" },
  { id: 71, name: "Frozen Mix Veg Momos (25 pc)", hi: "Momos Frozen Veg", weight: "500 g", price: 149, mrp: 180, category: "frozen", icon: "\uD83E\uDD5F", bg: "#EAF7EC", rating: 4.5, off: 17, description: "Steam karo 6-8 minute \u2014 ghar par restaurant wale mix veg momos ready.", brand: "Fatafat Fresh", stock: 18, source: "dark", vendor: "" },
  { id: 72, name: "Frozen Sweet Corn", hi: "Frozen Corn Makka Sweet", weight: "500 g", price: 75, mrp: 95, category: "frozen", icon: "\uD83C\uDF3D", bg: "#FFF3C4", rating: 4.5, off: 21, description: "Meethe corn ke daane \u2014 chaat, soup, sabzi aur pulao ke liye ready.", brand: "Safal", stock: 22, source: "dark", vendor: "" },
  { id: 73, name: "Frozen Mixed Vegetables", hi: "Frozen Mix Sabzi Vegetables", weight: "500 g", price: 69, mrp: 85, category: "frozen", icon: "\uD83E\uDD55", bg: "#FFE8E0", rating: 4.4, off: 19, description: "Gajar, beans, matar aur corn ka ready mix \u2014 pulao aur sabzi ke liye perfect.", brand: "Safal", stock: 20, source: "dark", vendor: "" },
  { id: 74, name: "Amul Sundae Chocolate Ice Cream", hi: "Ice Cream Chocolate Amul", weight: "700 ml", price: 160, mrp: 199, category: "frozen", icon: "\uD83C\uDF68", bg: "#FDEBD0", rating: 4.8, off: 20, description: "Rich chocolate sundae tub \u2014 upar se choco sauce ke saath family pack.", brand: "Amul", stock: 12, source: "dark", vendor: "" },
  { id: 75, name: "Butterscotch Ice Cream Tub", hi: "Ice Cream Butterscotch", weight: "700 ml", price: 155, mrp: 185, category: "frozen", icon: "\uD83C\uDF66", bg: "#FFF3C4", rating: 4.7, off: 16, description: "Crunchy praline wala creamy butterscotch \u2014 har party ki shaan.", brand: "Kwality Wall's", stock: 10, source: "dark", vendor: "" }
];
var SEED_AREAS = [
  { id: "sec62", name: "Sector 62, Noida", distKm: 0.8, serviceable: 1, storeName: "Fatafat Dark Store \u2014 Sector 62", storeType: "Apna Dark Store (Hybrid Model)", eta: "8 min", unavailableIds: "[]" },
  { id: "sec18", name: "Sector 18, Noida", distKm: 1.5, serviceable: 1, storeName: "Partner: Sharma General Store \u2014 Sector 18", storeType: "Multi-Vendor Partner Store", eta: "10 min", unavailableIds: "[20,12,32]" },
  { id: "indirapuram", name: "Indirapuram, Ghaziabad", distKm: 1.9, serviceable: 1, storeName: "Fatafat Dark Store \u2014 Indirapuram", storeType: "Apna Dark Store (Hybrid Model)", eta: "11 min", unavailableIds: "[24,17,49]" },
  { id: "grnoida", name: "Greater Noida West", distKm: 4.5, serviceable: 0, storeName: "Koi store paas nahi", storeType: "2 km radius ke bahar", eta: "\u2014", unavailableIds: "[]" },
  { id: "mayur", name: "Mayur Vihar, Delhi", distKm: 3.2, serviceable: 0, storeName: "Koi store paas nahi", storeType: "2 km radius ke bahar", eta: "\u2014", unavailableIds: "[]" }
];
var COUPONS = {
  FATA75: { off: 75, min: 299, label: "FATA75 \xB7 \u20B975 OFF" },
  FIRST50: { off: 50, min: 199, label: "FIRST50 \xB7 \u20B950 OFF" }
};
var STATUS_STEPS = ["placed", "packing", "on_the_way", "delivered"];
var STATUS_LABELS = {
  placed: "Order Mil Gaya",
  packing: "Packing Ho Rahi Hai",
  on_the_way: "Rider Raste Me Hai",
  delivered: "Delivered \u2713",
  cancelled: "Cancelled"
};
var STEP_SECONDS = [0, 40, 100, 190];
async function ensureSeeded(ctx) {
  const db = ctx.db();
  const existing = await db.select({ id: products.id }).from(products);
  if (existing.length > 0) {
    const have = new Set(existing.map((r) => r.id));
    const stmts = [];
    for (const [i, p] of SEED_PRODUCTS.entries()) {
      if (have.has(p.id))
        continue;
      stmts.push(db.insert(products).values({
        id: p.id,
        name: p.name,
        hi: p.hi,
        weight: p.weight,
        price: p.price,
        mrp: p.mrp,
        category: p.category,
        brand: p.brand,
        stock: p.stock,
        source: p.source,
        vendor: p.vendor,
        rating: p.rating,
        offPct: p.off,
        description: p.description,
        bg: p.bg,
        icon: p.icon,
        sortOrder: i
      }));
    }
    for (const a of SEED_AREAS) {
      stmts.push(db.update(areas).set({ unavailableIds: a.unavailableIds }).where(eq(areas.id, a.id)));
    }
    const [first, ...rest] = stmts;
    if (first)
      await db.batch([first, ...rest]);
    await ensurePartnerVendors(ctx);
    return;
  }
  const stmts = [];
  for (const [i, p] of SEED_PRODUCTS.entries()) {
    stmts.push(db.insert(products).values({
      id: p.id,
      name: p.name,
      hi: p.hi,
      weight: p.weight,
      price: p.price,
      mrp: p.mrp,
      category: p.category,
      brand: p.brand,
      stock: p.stock,
      source: p.source,
      vendor: p.vendor,
      rating: p.rating,
      offPct: p.off,
      description: p.description,
      bg: p.bg,
      icon: p.icon,
      sortOrder: i
    }));
  }
  for (const a of SEED_AREAS)
    stmts.push(db.insert(areas).values(a));
  stmts.push(db.insert(profile).values({ id: 1, name: "Aryan", phone: "98765 43210", currentAreaId: "sec62", referralCode: referralCodeFor("Aryan", "98765 43210"), referredBy: "", coins: 0 }));
  stmts.push(db.insert(addresses).values({ label: "Home", text: "Sector 62, Noida, Uttar Pradesh 201301", isActive: 1 }));
  stmts.push(db.insert(addresses).values({ label: "Office", text: "C-Block, Sector 62, Noida 201309", isActive: 0 }));
  stmts.push(db.insert(notifications).values({
    audience: "customer",
    type: "offer",
    title: "\uD83C\uDF89 FATA75 Ready Hai",
    message: "\u20B9299+ par \u20B975 OFF \u2014 cart me coupon lagao.",
    isRead: 0,
    createdAt: new Date
  }));
  const [first, ...rest] = stmts;
  if (first)
    await db.batch([first, ...rest]);
  await ensurePartnerVendors(ctx);
}
var PARTNER_VENDOR_NAMES = ["Sharma General Store", "Gupta Snacks Corner", "City Care Store"];
async function ensurePartnerVendors(ctx) {
  const db = ctx.db();
  const existing = await db.select({ id: vendors.id }).from(vendors).limit(1);
  if (existing.length > 0)
    return;
  const prods = await db.select({ vendor: products.vendor }).from(products);
  const used = new Set(prods.map((p) => p.vendor).filter((v) => v !== ""));
  const now = new Date;
  for (const name of PARTNER_VENDOR_NAMES) {
    if (!used.has(name))
      continue;
    await db.insert(vendors).values({ shopName: name, ownerName: "", phone: "", area: "", status: "approved", createdAt: now });
  }
}
function referralCodeFor(name, phone) {
  const clean = name.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8) || "DOST";
  const last4 = phone.replace(/\D/g, "").slice(-4) || "0000";
  return `FF-${clean}-${last4}`;
}
async function ensureLoyalty(ctx) {
  const db = ctx.db();
  const rows = await db.select().from(profile).limit(1);
  const p = rows[0];
  if (p && !p.referralCode) {
    await db.update(profile).set({ referralCode: referralCodeFor(p.name, p.phone) }).where(eq(profile.id, p.id));
  }
}
var DEFAULT_ADMIN_PIN = "1114";
var ADMIN_SESSION_MS = 30 * 60 * 1000;
var ADMIN_LOCK_MS = 5 * 60 * 1000;
var ADMIN_MAX_ATTEMPTS = 5;
function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function hashPin(pin, salt) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${salt}:${pin}`));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function logActivity(ctx, kind, detail) {
  const db = ctx.db();
  await db.insert(adminActivity).values({ kind, detail, createdAt: new Date });
}
async function ensureAdminSeeded(ctx) {
  const db = ctx.db();
  const cfg = await db.select().from(adminConfig).limit(1);
  if (!cfg[0]) {
    const salt = randomHex(16);
    const pinHash = await hashPin(DEFAULT_ADMIN_PIN, salt);
    await db.insert(adminConfig).values({ id: 1, pinHash, salt, failedAttempts: 0, lockedUntil: 0 });
  }
  const st = await db.select().from(appSettings).limit(1);
  if (!st[0]) {
    await db.insert(appSettings).values({ id: 1, deliveryCharge: 25, freeThreshold: 199, geofenceKm: 2 });
  }
  const pc = await db.select().from(platformCoupons);
  if (pc.length === 0) {
    for (const [code, c] of Object.entries(COUPONS)) {
      await db.insert(platformCoupons).values({ code, off: c.off, minOrder: c.min, label: c.label, enabled: 1 });
    }
  }
}
async function getSettings(ctx) {
  await ensureAdminSeeded(ctx);
  const db = ctx.db();
  const rows = await db.select().from(appSettings).limit(1);
  const s = rows[0];
  return {
    deliveryCharge: s?.deliveryCharge ?? 25,
    freeThreshold: s?.freeThreshold ?? 199,
    geofenceKm: s?.geofenceKm ?? 2
  };
}
async function requireAdmin(ctx, token) {
  if (!token)
    return false;
  const db = ctx.db();
  const rows = await db.select().from(adminSessions).where(eq(adminSessions.token, token)).limit(1);
  const s = rows[0];
  if (!s)
    return false;
  const now = Date.now();
  if (s.expiresAt.getTime() <= now) {
    await db.delete(adminSessions).where(eq(adminSessions.token, token));
    return false;
  }
  await db.update(adminSessions).set({ expiresAt: new Date(now + ADMIN_SESSION_MS) }).where(eq(adminSessions.token, token));
  return true;
}
var SESSION_EXPIRED = "Admin session expire ya invalid hai \u2014 suraksha ke liye phir se PIN daal kar login karo.";
async function findCoupon(ctx, code) {
  await ensureAdminSeeded(ctx);
  const db = ctx.db();
  const pc = await db.select().from(platformCoupons).where(eq(platformCoupons.code, code)).limit(1);
  const p = pc[0];
  if (p) {
    if (p.enabled !== 1)
      return { found: false, reason: "disabled" };
    return { found: true, off: p.off, min: p.minOrder, label: p.label };
  }
  const vc = await db.select().from(vendorCoupons).where(eq(vendorCoupons.code, code)).limit(1);
  const v = vc[0];
  if (v) {
    if (v.enabled !== 1)
      return { found: false, reason: "disabled" };
    return { found: true, off: v.off, min: v.minOrder, label: `${v.code} \xB7 \u20B9${v.off} OFF (${v.vendorName})` };
  }
  return { found: false, reason: "unknown" };
}
var CUSTOMER_SESSION_MS = 30 * 24 * 60 * 60 * 1000;
function normalizePhone(raw) {
  const digits = raw.replace(/\D/g, "");
  const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
  return /^[6-9]\d{9}$/.test(local) ? local : null;
}
async function ensureAccounts(ctx) {
  const db = ctx.db();
  const accs = await db.select({ id: accounts.id }).from(accounts);
  if (accs.length === 0) {
    const prof = await db.select().from(profile).limit(1);
    const p = prof[0];
    await db.insert(accounts).values({
      id: 1,
      name: p?.name ?? "Aryan",
      phone: p?.phone ?? "98765 43210",
      pinHash: "",
      salt: "",
      referralCode: p?.referralCode || referralCodeFor(p?.name ?? "Aryan", p?.phone ?? "98765 43210"),
      referredBy: p?.referredBy ?? "",
      coins: p?.coins ?? 0,
      currentAreaId: p?.currentAreaId ?? "sec62",
      createdAt: new Date
    });
  }
  const st = await db.select().from(appState).limit(1);
  if (!st[0]) {
    await db.insert(appState).values({ id: 1, currentAccountId: 1, currentSessionToken: "" });
  }
}
async function currentContext(ctx) {
  await ensureAccounts(ctx);
  const db = ctx.db();
  const st = await db.select().from(appState).limit(1);
  const state = st[0];
  const wanted = state?.currentAccountId ?? 1;
  const rows = await db.select().from(accounts).where(eq(accounts.id, wanted)).limit(1);
  let account = rows[0];
  if (!account) {
    const guest = await db.select().from(accounts).where(eq(accounts.id, 1)).limit(1);
    account = guest[0];
  }
  if (!account) {
    account = {
      id: 1,
      name: "Guest",
      phone: "",
      pinHash: "",
      salt: "",
      failedAttempts: 0,
      lockedUntil: 0,
      referralCode: "",
      referredBy: "",
      coins: 0,
      currentAreaId: "sec62",
      createdAt: new Date
    };
  }
  const sessionToken = state?.currentSessionToken ?? "";
  return { account, isGuest: sessionToken === "", sessionToken };
}
async function findAccountByPhone(ctx, local10) {
  const db = ctx.db();
  const all = await db.select().from(accounts);
  return all.find((a) => normalizePhone(a.phone) === local10);
}
async function startCustomerSession(ctx, accountId) {
  const db = ctx.db();
  const token = randomHex(24);
  const now = Date.now();
  await db.batch([
    db.insert(customerSessions).values({
      token,
      accountId,
      createdAt: new Date(now),
      expiresAt: new Date(now + CUSTOMER_SESSION_MS)
    }),
    db.update(appState).set({ currentAccountId: accountId, currentSessionToken: token }).where(eq(appState.id, 1))
  ]);
  return token;
}
function effectiveStep(order) {
  if (order.status === "cancelled")
    return order.statusStep;
  const elapsed = (Date.now() - order.createdAt.getTime()) / 1000;
  let step = order.statusStep;
  for (let i = 0;i < STEP_SECONDS.length; i++) {
    const t = STEP_SECONDS[i] ?? 0;
    if (elapsed >= t)
      step = Math.max(step, i);
  }
  return Math.min(step, 3);
}
var productShape = object({
  id: number2(),
  name: string2(),
  hi: string2(),
  weight: string2(),
  price: number2(),
  mrp: number2(),
  category: string2(),
  brand: string2(),
  stock: number2(),
  source: string2(),
  vendor: string2(),
  rating: number2(),
  review_count: number2(),
  off: number2(),
  description: string2(),
  bg: string2(),
  icon: string2()
});
function reviewAgg(rows) {
  const sums = new Map;
  for (const r of rows) {
    const e = sums.get(r.productId) ?? { sum: 0, count: 0 };
    e.sum += r.rating;
    e.count += 1;
    sums.set(r.productId, e);
  }
  const out = new Map;
  for (const [k, v] of sums)
    out.set(k, { avg: Math.round(v.sum / v.count * 10) / 10, count: v.count });
  return out;
}
function toProduct(p, agg) {
  const a = agg.get(p.id);
  return {
    id: p.id,
    name: p.name,
    hi: p.hi,
    weight: p.weight,
    price: p.price,
    mrp: p.mrp,
    category: p.category,
    brand: p.brand,
    stock: p.stock,
    source: p.source,
    vendor: p.vendor,
    rating: a ? a.avg : p.rating,
    review_count: a?.count ?? 0,
    off: p.offPct,
    description: p.description,
    bg: p.bg,
    icon: p.icon
  };
}
var orderShape = object({
  id: string2(),
  customer_name: string2(),
  phone: string2(),
  address_label: string2(),
  address_text: string2(),
  area_name: string2(),
  items: array(object({
    product_id: number2(),
    name: string2(),
    weight: string2(),
    price: number2(),
    qty: number2()
  })),
  items_count: number2(),
  subtotal: number2(),
  discount: number2(),
  delivery_fee: number2(),
  grand_total: number2(),
  coupon_code: string2(),
  coins_redeemed: number2(),
  coins_earned: number2(),
  payment_method: string2(),
  payment_detail: string2(),
  instructions: string2(),
  delivery_slot: string2(),
  is_gift: boolean2(),
  gift_name: string2(),
  gift_phone: string2(),
  gift_note: string2(),
  status: string2(),
  status_label: string2(),
  status_step: number2(),
  eta_minutes: number2(),
  rating: number2().nullable(),
  created_at: string2()
});
function toOrder(o) {
  const step = effectiveStep(o);
  const status = o.status === "cancelled" ? "cancelled" : STATUS_STEPS[step] ?? "placed";
  const elapsedMin = (Date.now() - o.createdAt.getTime()) / 60000;
  const eta = status === "delivered" || status === "cancelled" ? 0 : Math.max(1, Math.ceil(8 - elapsedMin));
  let items = [];
  try {
    const parsed = JSON.parse(o.items);
    if (Array.isArray(parsed))
      items = parsed;
  } catch {
    items = [];
  }
  return {
    id: o.id,
    customer_name: o.customerName,
    phone: o.phone,
    address_label: o.addressLabel,
    address_text: o.addressText,
    area_name: o.areaName,
    items,
    items_count: o.itemsCount,
    subtotal: o.subtotal,
    discount: o.discount,
    delivery_fee: o.deliveryFee,
    grand_total: o.grandTotal,
    coupon_code: o.couponCode,
    coins_redeemed: o.coinsRedeemed,
    coins_earned: o.coinsEarned,
    payment_method: o.paymentMethod,
    payment_detail: o.paymentDetail,
    instructions: o.instructions,
    delivery_slot: o.deliverySlot,
    is_gift: o.isGift === 1,
    gift_name: o.giftName,
    gift_phone: o.giftPhone,
    gift_note: o.giftNote,
    status,
    status_label: STATUS_LABELS[status] ?? status,
    status_step: step,
    eta_minutes: eta,
    rating: o.rating ?? null,
    created_at: o.createdAt.toISOString()
  };
}
var notifShape = object({
  id: number2(),
  audience: string2(),
  type: string2(),
  title: string2(),
  message: string2(),
  is_read: boolean2(),
  order_id: string2().nullable(),
  product_id: number2().nullable(),
  created_at: string2()
});
var Actions = {
  seedCatalog: defineAction({
    description: "Seeds the Fatafat catalog, areas, profile and addresses into the database if they are not there yet (idempotent).",
    request: object({}),
    response: object({ seeded: boolean2(), products: number2() }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select({ id: products.id }).from(products);
      return { seeded: true, products: rows.length };
    }
  }),
  getBootstrap: defineAction({
    description: "Returns everything the storefront needs on load: products with live stock, areas, profile, addresses, wishlist and unread notification count \u2014 all from the database.",
    request: object({}),
    response: object({
      products: array(productShape),
      areas: array(object({
        id: string2(),
        name: string2(),
        dist_km: number2(),
        serviceable: boolean2(),
        store_name: string2(),
        store_type: string2(),
        eta: string2(),
        unavailable_ids: array(number2())
      })),
      profile: object({ name: string2(), phone: string2(), current_area_id: string2(), referral_code: string2(), referred_by: string2(), coins: number2(), is_guest: boolean2() }),
      subscriptions: array(object({
        id: number2(),
        product_id: number2(),
        product_name: string2(),
        weight: string2(),
        price: number2(),
        frequency: string2(),
        qty: number2(),
        status: string2(),
        created_at: string2()
      })),
      coin_history: array(object({
        id: number2(),
        kind: string2(),
        amount: number2(),
        note: string2(),
        order_id: string2().nullable(),
        created_at: string2()
      })),
      addresses: array(object({ id: number2(), label: string2(), text: string2(), is_active: boolean2() })),
      wishlist_ids: array(number2()),
      notify_ids: array(number2()),
      unread_notifications: number2(),
      active_order_id: string2().nullable(),
      settings: object({ delivery_charge: number2(), free_threshold: number2(), geofence_km: number2() })
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      await ensureLoyalty(ctx);
      const settings = await getSettings(ctx);
      const { account, isGuest } = await currentContext(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).orderBy(asc(products.sortOrder));
      const areaRows = await db.select().from(areas);
      const subRows = await db.select().from(subscriptions).where(eq(subscriptions.accountId, account.id)).orderBy(desc(subscriptions.id));
      const ledgerRows = await db.select().from(coinLedger).where(eq(coinLedger.accountId, account.id)).orderBy(desc(coinLedger.id)).limit(20);
      const addrs = await db.select().from(addresses).where(eq(addresses.accountId, account.id)).orderBy(asc(addresses.id));
      const wish = await db.select().from(wishlist).where(eq(wishlist.accountId, account.id));
      const notifyRows = await db.select().from(notifyMe).where(eq(notifyMe.accountId, account.id));
      const agg = reviewAgg(await db.select().from(reviews));
      const unread = await db.select({ id: notifications.id }).from(notifications).where(sql`${notifications.isRead} = 0 AND ${notifications.audience} = 'customer'`);
      const orderRows = await db.select().from(orders).where(eq(orders.accountId, account.id)).orderBy(desc(orders.createdAt)).limit(10);
      const active = orderRows.map(toOrder).find((o) => o.status !== "delivered" && o.status !== "cancelled");
      return {
        products: prods.map((p) => toProduct(p, agg)),
        areas: areaRows.map((a) => {
          let ids = [];
          try {
            const v = JSON.parse(a.unavailableIds);
            if (Array.isArray(v))
              ids = v;
          } catch {
            ids = [];
          }
          return {
            id: a.id,
            name: a.name,
            dist_km: a.distKm,
            serviceable: a.distKm <= settings.geofenceKm,
            store_name: a.storeName,
            store_type: a.storeType,
            eta: a.eta,
            unavailable_ids: ids
          };
        }),
        profile: {
          name: account.name,
          phone: account.phone,
          current_area_id: account.currentAreaId,
          referral_code: account.referralCode,
          referred_by: account.referredBy,
          coins: account.coins,
          is_guest: isGuest
        },
        subscriptions: subRows.map((s) => {
          const prod = prods.find((x) => x.id === s.productId);
          return {
            id: s.id,
            product_id: s.productId,
            product_name: prod?.name ?? "Product",
            weight: prod?.weight ?? "",
            price: prod?.price ?? 0,
            frequency: s.frequency,
            qty: s.qty,
            status: s.status,
            created_at: s.createdAt.toISOString()
          };
        }),
        coin_history: ledgerRows.map((l) => ({
          id: l.id,
          kind: l.kind,
          amount: l.amount,
          note: l.note,
          order_id: l.orderId ?? null,
          created_at: l.createdAt.toISOString()
        })),
        addresses: addrs.map((a) => ({ id: a.id, label: a.label, text: a.text, is_active: a.isActive === 1 })),
        wishlist_ids: wish.map((w) => w.productId),
        notify_ids: notifyRows.map((n) => n.productId),
        unread_notifications: unread.length,
        active_order_id: active?.id ?? null,
        settings: {
          delivery_charge: settings.deliveryCharge,
          free_threshold: settings.freeThreshold,
          geofence_km: settings.geofenceKm
        }
      };
    }
  }),
  getSearchSuggestions: defineAction({
    description: "Server-side search suggestions: matching brands and top products for a query (Hindi + English names).",
    request: object({ query: string2().max(60) }),
    response: object({
      brands: array(string2()),
      products: array(productShape)
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).orderBy(asc(products.sortOrder));
      const agg = reviewAgg(await db.select().from(reviews));
      const q = args.query.trim().toLowerCase();
      const matches = (p) => q === "" || p.name.toLowerCase().includes(q) || p.hi.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
      const matched = prods.filter(matches);
      let brands = [...new Set(matched.map((p) => p.brand))].slice(0, 5);
      if (q === "milk" || q === "doodh")
        brands = ["Amul", "Britannia", "Farm Fresh"];
      return {
        brands,
        products: matched.slice(0, 5).map((p) => toProduct(p, agg))
      };
    }
  }),
  validateCoupon: defineAction({
    description: "Validates a coupon code against a subtotal on the server and returns the discount.",
    request: object({ code: string2().trim().min(1).max(20), subtotal: number2().int().min(0) }),
    response: object({
      ok: boolean2(),
      code: string2(),
      discount: number2(),
      label: string2(),
      message: string2()
    }),
    async handler(ctx, args) {
      const code = args.code.toUpperCase();
      const r = await findCoupon(ctx, code);
      if (!r.found) {
        return {
          ok: false,
          code,
          discount: 0,
          label: "",
          message: r.reason === "disabled" ? `Coupon ${code} abhi admin ne band kiya hua hai.` : "Ye coupon code sahi nahi hai."
        };
      }
      if (args.subtotal < r.min) {
        return { ok: false, code, discount: 0, label: r.label, message: `${code} ke liye kam se kam \u20B9${r.min} ka order chahiye (abhi \u20B9${args.subtotal}).` };
      }
      return { ok: true, code, discount: r.off, label: r.label, message: `${r.label} lag gaya \u2014 \u20B9${r.off} ki bachat!` };
    }
  }),
  placeOrder: defineAction({
    description: "Places an order: validates area geofence and live stock on the server, decrements stock, saves the order, and creates customer, staff and vendor notifications.",
    request: object({
      items: array(object({ product_id: number2().int().positive(), qty: number2().int().min(1).max(50) })).min(1).max(50),
      customer_name: string2().trim().min(2).max(60),
      phone: string2().trim().min(10).max(20),
      address_label: string2().max(40),
      address_text: string2().trim().min(8).max(300),
      area_id: string2().min(1).max(40),
      coupon_code: string2().max(20).default(""),
      use_coins: boolean2().default(false),
      payment_method: _enum(["cod", "upi", "card", "wallet"]),
      payment_detail: string2().max(80).default(""),
      instructions: string2().max(300).default(""),
      delivery_slot: string2().max(60).default("Abhi \u2014 8 minutes me"),
      is_gift: boolean2().default(false),
      gift_name: string2().max(60).default(""),
      gift_phone: string2().max(20).default(""),
      gift_note: string2().max(200).default("")
    }),
    response: object({
      ok: boolean2(),
      order: orderShape.nullable(),
      error: string2()
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const settings = await getSettings(ctx);
      const db = ctx.db();
      const fail = (error) => ({ ok: false, order: null, error });
      const digits = args.phone.replace(/\D/g, "");
      const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
      if (!/^[6-9]\d{9}$/.test(local))
        return fail("Sahi 10-digit mobile number likho (6\u20139 se shuru). +91 wala bhi chalega.");
      const areaRows = await db.select().from(areas).where(eq(areas.id, args.area_id)).limit(1);
      const area = areaRows[0];
      if (!area)
        return fail("Ye area nahi mila \u2014 doosra area chuno.");
      if (area.distKm > settings.geofenceKm)
        return fail(`\u26A0 ${area.name} ${settings.geofenceKm} km delivery radius ke bahar hai (${area.distKm} km) \u2014 yaha order nahi ho sakta.`);
      let unavailable = [];
      try {
        const v = JSON.parse(area.unavailableIds);
        if (Array.isArray(v))
          unavailable = v;
      } catch {
        unavailable = [];
      }
      const prods = await db.select().from(products);
      const byId = new Map(prods.map((p) => [p.id, p]));
      const lines = [];
      let subtotal = 0;
      let itemsCount = 0;
      for (const it of args.items) {
        const p = byId.get(it.product_id);
        if (!p)
          return fail("Ek item catalog me nahi mila \u2014 cart refresh karo.");
        if (unavailable.includes(p.id))
          return fail(`"${p.name}" is area ke store me available nahi hai.`);
        if (p.stock < it.qty)
          return fail(`"${p.name}" ka stock sirf ${p.stock} bacha hai \u2014 quantity kam karo.`);
        lines.push({ product_id: p.id, name: p.name, weight: p.weight, price: p.price, qty: it.qty });
        subtotal += p.price * it.qty;
        itemsCount += it.qty;
      }
      let discount = 0;
      const code = args.coupon_code.trim().toUpperCase();
      if (code) {
        const r = await findCoupon(ctx, code);
        if (!r.found)
          return fail(r.reason === "disabled" ? `Coupon ${code} abhi band hai.` : "Coupon code galat hai.");
        if (subtotal < r.min)
          return fail(`${code} ke liye kam se kam \u20B9${r.min} ka order chahiye.`);
        discount = r.off;
      }
      const deliveryFee = subtotal >= settings.freeThreshold ? 0 : settings.deliveryCharge;
      const payableBeforeCoins = Math.max(0, subtotal - discount) + deliveryFee;
      const { account } = await currentContext(ctx);
      const walletCoins = account.coins;
      const coinsRedeemed = args.use_coins ? Math.min(walletCoins, payableBeforeCoins) : 0;
      const grand = payableBeforeCoins - coinsRedeemed;
      const coinsEarned = Math.floor(grand * 0.05);
      const now = new Date;
      const orderId = `FF${now.getTime().toString().slice(-8)}`;
      const payLabels = { cod: "Cash on Delivery", upi: "UPI", card: "Card", wallet: "Wallet" };
      const stmts = [];
      stmts.push(db.insert(orders).values({
        id: orderId,
        accountId: account.id,
        customerName: args.customer_name,
        phone: args.phone,
        addressLabel: args.address_label,
        addressText: args.address_text,
        areaId: area.id,
        areaName: area.name,
        items: JSON.stringify(lines),
        itemsCount,
        subtotal,
        discount,
        deliveryFee,
        grandTotal: grand,
        couponCode: code,
        coinsRedeemed,
        coinsEarned,
        paymentMethod: args.payment_method,
        paymentDetail: args.payment_detail || payLabels[args.payment_method] || "",
        instructions: args.instructions,
        deliverySlot: args.delivery_slot || "Abhi \u2014 8 minutes me",
        isGift: args.is_gift ? 1 : 0,
        giftName: args.is_gift ? args.gift_name : "",
        giftPhone: args.is_gift ? args.gift_phone : "",
        giftNote: args.is_gift ? args.gift_note : "",
        status: "placed",
        statusStep: 0,
        rating: null,
        createdAt: now
      }));
      for (const line of lines) {
        stmts.push(db.update(products).set({ stock: sql`${products.stock} - ${line.qty}` }).where(eq(products.id, line.product_id)));
      }
      const itemSummary = lines.map((l) => `${l.name} \xD7${l.qty}`).join(", ");
      stmts.push(db.insert(notifications).values({
        audience: "customer",
        type: "order",
        orderId,
        title: `\u2705 Order ${orderId} Place Ho Gaya!`,
        message: `${itemsCount} items \xB7 \u20B9${grand} \xB7 ${area.storeName} se packing shuru hogi.`,
        isRead: 0,
        createdAt: now
      }));
      if (coinsRedeemed > 0 || coinsEarned > 0) {
        stmts.push(db.update(accounts).set({ coins: walletCoins - coinsRedeemed + coinsEarned }).where(eq(accounts.id, account.id)));
      }
      if (coinsRedeemed > 0) {
        stmts.push(db.insert(coinLedger).values({
          accountId: account.id,
          kind: "redeem",
          amount: -coinsRedeemed,
          orderId,
          note: `Order ${orderId} ke bill me coins use hue`,
          createdAt: now
        }));
      }
      if (coinsEarned > 0) {
        stmts.push(db.insert(coinLedger).values({
          accountId: account.id,
          kind: "earn",
          amount: coinsEarned,
          orderId,
          note: `Order ${orderId} par 5% cashback coins mile`,
          createdAt: now
        }));
      }
      stmts.push(db.insert(notifications).values({
        audience: "staff",
        type: "staff",
        orderId,
        title: `\uD83C\uDFEA Order Aaya Hai \u2014 Jaldi Pack Karo! (${orderId})`,
        message: `${area.storeName}: ${itemSummary}. Customer: ${args.customer_name}. Slot: ${args.delivery_slot || "Abhi"}.${args.is_gift ? ` \uD83C\uDF81 GIFT \u2014 ${args.gift_name} (${args.gift_phone})${args.gift_note ? ": " + args.gift_note : ""}` : ""} ${args.instructions ? "Note: " + args.instructions : ""}`,
        isRead: 0,
        createdAt: now
      }));
      for (const line of lines) {
        const p = byId.get(line.product_id);
        if (!p)
          continue;
        const left = p.stock - line.qty;
        if (left <= 5) {
          const who = p.source === "vendor" ? p.vendor : "Fatafat Dark Store";
          stmts.push(db.insert(notifications).values({
            audience: "vendor",
            type: "vendor",
            orderId,
            productId: p.id,
            title: `\u26A0\uFE0F Low Stock Alert \u2014 ${p.name}`,
            message: `${who}: sirf ${left} bache hain. Jaldi restock karo${left === 0 ? " \u2014 item ab Out of Stock hai!" : "!"}`,
            isRead: 0,
            createdAt: now
          }));
        }
      }
      const [first, ...rest] = stmts;
      if (first)
        await db.batch([first, ...rest]);
      ctx.invalidateQueries();
      const saved = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      const row = saved[0];
      return { ok: true, order: row ? toOrder(row) : null, error: "" };
    }
  }),
  listOrders: defineAction({
    description: "Lists all orders from the database, newest first, with live tracking status computed from elapsed time and staff advances.",
    request: object({ limit: number2().int().positive().max(50).default(20) }),
    response: object({ orders: array(orderShape) }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const rows = await db.select().from(orders).where(eq(orders.accountId, account.id)).orderBy(desc(orders.createdAt)).limit(args.limit);
      return { orders: rows.map(toOrder) };
    }
  }),
  getOrder: defineAction({
    description: "Returns one order with its current live tracking status.",
    request: object({ order_id: string2().min(1).max(40) }),
    response: object({ order: orderShape.nullable() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db.select().from(orders).where(eq(orders.id, args.order_id)).limit(1);
      const row = rows[0];
      return { order: row ? toOrder(row) : null };
    }
  }),
  advanceOrder: defineAction({
    description: "Store-staff action: advances an order one tracking step (packing \u2192 on the way \u2192 delivered) and notifies the customer.",
    request: object({ order_id: string2().min(1).max(40) }),
    response: object({ ok: boolean2(), order: orderShape.nullable(), error: string2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db.select().from(orders).where(eq(orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row)
        return { ok: false, order: null, error: "Order nahi mila." };
      if (row.status === "cancelled")
        return { ok: false, order: toOrder(row), error: "Cancelled order aage nahi badh sakta." };
      const cur = effectiveStep(row);
      const next = Math.min(3, cur + 1);
      const status = STATUS_STEPS[next] ?? "delivered";
      await db.batch([
        db.update(orders).set({ statusStep: next, status }).where(eq(orders.id, row.id)),
        db.insert(notifications).values({
          audience: "customer",
          type: "order",
          orderId: row.id,
          title: status === "delivered" ? `\uD83C\uDF89 Order ${row.id} Delivered!` : `\uD83D\uDEF5 Order ${row.id} \u2014 ${STATUS_LABELS[status]}`,
          message: status === "delivered" ? "Tumhara samaan pahunch gaya. Rating dena mat bhoolna!" : `Status update: ${STATUS_LABELS[status]}.`,
          isRead: 0,
          createdAt: new Date
        })
      ]);
      ctx.invalidateQueries();
      const saved = await db.select().from(orders).where(eq(orders.id, row.id)).limit(1);
      const s = saved[0];
      return { ok: true, order: s ? toOrder(s) : null, error: "" };
    }
  }),
  cancelOrder: defineAction({
    description: "Cancels an order that is not delivered yet and restores its stock to the inventory.",
    request: object({ order_id: string2().min(1).max(40) }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db.select().from(orders).where(eq(orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row)
        return { ok: false, error: "Order nahi mila." };
      const live = toOrder(row);
      if (live.status === "delivered")
        return { ok: false, error: "Delivered order cancel nahi ho sakta." };
      if (row.status === "cancelled")
        return { ok: false, error: "Ye order pehle se cancelled hai." };
      const stmts = [
        db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, row.id))
      ];
      for (const line of live.items) {
        stmts.push(db.update(products).set({ stock: sql`${products.stock} + ${line.qty}` }).where(eq(products.id, line.product_id)));
      }
      if (row.coinsRedeemed > 0 || row.coinsEarned > 0) {
        stmts.push(db.update(accounts).set({ coins: sql`MAX(0, ${accounts.coins} + ${row.coinsRedeemed} - ${row.coinsEarned})` }).where(eq(accounts.id, row.accountId)));
        if (row.coinsRedeemed > 0) {
          stmts.push(db.insert(coinLedger).values({
            accountId: row.accountId,
            kind: "refund",
            amount: row.coinsRedeemed,
            orderId: row.id,
            note: `Order ${row.id} cancel \u2014 redeemed coins wapas mile`,
            createdAt: new Date
          }));
        }
        if (row.coinsEarned > 0) {
          stmts.push(db.insert(coinLedger).values({
            accountId: row.accountId,
            kind: "refund",
            amount: -row.coinsEarned,
            orderId: row.id,
            note: `Order ${row.id} cancel \u2014 earned coins wapas liye gaye`,
            createdAt: new Date
          }));
        }
      }
      stmts.push(db.insert(notifications).values({
        audience: "customer",
        type: "order",
        orderId: row.id,
        title: `\u274C Order ${row.id} Cancel Ho Gaya`,
        message: "Stock wapas inventory me add ho gaya hai. Kuch aur chahiye to phir order karo!",
        isRead: 0,
        createdAt: new Date
      }));
      stmts.push(db.insert(notifications).values({
        audience: "staff",
        type: "staff",
        orderId: row.id,
        title: `\uD83D\uDEAB Order Cancel \u2014 ${row.id}`,
        message: "Customer ne order cancel kar diya. Packing rok do, stock wapas lag gaya hai.",
        isRead: 0,
        createdAt: new Date
      }));
      const [first, ...rest] = stmts;
      if (first)
        await db.batch([first, ...rest]);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  rateOrder: defineAction({
    description: "Saves a 1\u20135 star rating on a delivered order.",
    request: object({ order_id: string2().min(1).max(40), rating: number2().int().min(1).max(5) }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.update(orders).set({ rating: args.rating }).where(eq(orders.id, args.order_id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  listNotifications: defineAction({
    description: "Lists notifications from the database, optionally filtered by audience (customer, staff, vendor), newest first.",
    request: object({ audience: _enum(["customer", "staff", "vendor", "all"]).default("all"), limit: number2().int().positive().max(100).default(50) }),
    response: object({ notifications: array(notifShape) }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const base = db.select().from(notifications);
      const rows = args.audience === "all" ? await base.orderBy(desc(notifications.id)).limit(args.limit) : await base.where(eq(notifications.audience, args.audience)).orderBy(desc(notifications.id)).limit(args.limit);
      return {
        notifications: rows.map((n) => ({
          id: n.id,
          audience: n.audience,
          type: n.type,
          title: n.title,
          message: n.message,
          is_read: n.isRead === 1,
          order_id: n.orderId ?? null,
          product_id: n.productId ?? null,
          created_at: n.createdAt.toISOString()
        }))
      };
    }
  }),
  markNotificationsRead: defineAction({
    description: "Marks all customer notifications as read.",
    request: object({}),
    response: object({ ok: boolean2() }),
    async handler(ctx) {
      const db = ctx.db();
      await db.update(notifications).set({ isRead: 1 }).where(eq(notifications.audience, "customer"));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  toggleWishlist: defineAction({
    description: "Adds or removes a product from the logged-in account's saved wishlist in the database.",
    request: object({ product_id: number2().int().positive() }),
    response: object({ wishlisted: boolean2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const existing = await db.select().from(wishlist).where(sql`${wishlist.accountId} = ${account.id} AND ${wishlist.productId} = ${args.product_id}`).limit(1);
      if (existing.length > 0) {
        await db.delete(wishlist).where(sql`${wishlist.accountId} = ${account.id} AND ${wishlist.productId} = ${args.product_id}`);
        ctx.invalidateQueries();
        return { wishlisted: false };
      }
      await db.insert(wishlist).values({ accountId: account.id, productId: args.product_id });
      ctx.invalidateQueries();
      return { wishlisted: true };
    }
  }),
  updateProfile: defineAction({
    description: "Saves the logged-in account's name and phone number to the database.",
    request: object({ name: string2().trim().min(2).max(60), phone: string2().trim().min(10).max(20) }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const local = normalizePhone(args.phone);
      if (!local)
        return { ok: false, error: "Sahi 10-digit mobile number likho." };
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const clash = await findAccountByPhone(ctx, local);
      if (clash && clash.id !== account.id)
        return { ok: false, error: "Ye mobile number kisi aur account par registered hai." };
      await db.update(accounts).set({ name: args.name, phone: args.phone, referralCode: referralCodeFor(args.name, args.phone) }).where(eq(accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  applyReferralCode: defineAction({
    description: "Applies a friend's referral code: the user gets \u20B950 in Fatafat Coins (tracked in the wallet ledger) and the code owner is credited too; each profile can use a referral code only once.",
    request: object({ code: string2().trim().min(3).max(30) }),
    response: object({ ok: boolean2(), coins: number2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account: p } = await currentContext(ctx);
      const db = ctx.db();
      const code = args.code.trim().toUpperCase();
      if (p.referredBy)
        return { ok: false, coins: p.coins, error: "Tum pehle hi ek referral code use kar chuke ho \u2014 har user ko bonus sirf ek baar milta hai." };
      if (code === p.referralCode.toUpperCase())
        return { ok: false, coins: p.coins, error: "Apna khud ka code use nahi kar sakte \u2014 dost ka code daalo." };
      const now = new Date;
      const newCoins = p.coins + 50;
      await db.batch([
        db.update(accounts).set({ referredBy: code, coins: newCoins }).where(eq(accounts.id, p.id)),
        db.insert(coinLedger).values({
          accountId: p.id,
          kind: "referral",
          amount: 50,
          note: `Referral bonus \u2014 dost ke code ${code} se \u20B950 ke coins mile (code wale dost ko bhi \u20B950 credit ho gaya)`,
          createdAt: now
        }),
        db.insert(notifications).values({
          audience: "customer",
          type: "offer",
          title: "\uD83C\uDF81 Referral Bonus Mil Gaya!",
          message: `Code ${code} lagane par tumhe 50 Fatafat Coins (\u20B950) mile aur code wale dost ko bhi \u20B950 credit ho gaya. Coins checkout par bill me use kar sakte ho.`,
          isRead: 0,
          createdAt: now
        })
      ]);
      ctx.invalidateQueries();
      return { ok: true, coins: newCoins, error: "" };
    }
  }),
  createSubscription: defineAction({
    description: "Creates a product subscription (daily or weekly delivery schedule) stored in the database.",
    request: object({
      product_id: number2().int().positive(),
      frequency: _enum(["daily", "weekly"]),
      qty: number2().int().min(1).max(10)
    }),
    response: object({ ok: boolean2(), id: number2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      const prod = prods[0];
      if (!prod)
        return { ok: false, id: 0, error: "Product nahi mila." };
      const existing = await db.select().from(subscriptions).where(sql`${subscriptions.accountId} = ${account.id} AND ${subscriptions.productId} = ${args.product_id} AND ${subscriptions.status} != 'cancelled'`);
      if (existing.length > 0)
        return { ok: false, id: 0, error: `"${prod.name}" ki subscription pehle se hai \u2014 My Subscriptions me dekho.` };
      const now = new Date;
      const inserted = await db.insert(subscriptions).values({
        accountId: account.id,
        productId: args.product_id,
        frequency: args.frequency,
        qty: args.qty,
        status: "active",
        createdAt: now
      }).returning({ id: subscriptions.id });
      await db.insert(notifications).values({
        audience: "customer",
        type: "offer",
        title: `\uD83D\uDD04 Subscription Shuru \u2014 ${prod.name}`,
        message: `${args.frequency === "daily" ? "Roz" : "Har hafte"} ${args.qty} \xD7 ${prod.name} (${prod.weight}) tumhare subscription plan me add ho gaya. Profile \u2192 My Subscriptions se pause/cancel kar sakte ho.`,
        isRead: 0,
        createdAt: now
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    }
  }),
  setSubscriptionStatus: defineAction({
    description: "Pauses, resumes or cancels a product subscription.",
    request: object({ subscription_id: number2().int().positive(), status: _enum(["active", "paused", "cancelled"]) }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const rows = await db.select().from(subscriptions).where(eq(subscriptions.id, args.subscription_id)).limit(1);
      const sub = rows[0];
      if (!sub)
        return { ok: false, error: "Subscription nahi mili." };
      if (sub.accountId !== account.id)
        return { ok: false, error: "Ye subscription tumhare account ki nahi hai." };
      if (sub.status === "cancelled")
        return { ok: false, error: "Cancelled subscription dobara change nahi hoti." };
      await db.update(subscriptions).set({ status: args.status }).where(eq(subscriptions.id, sub.id));
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  setCurrentArea: defineAction({
    description: "Saves the customer's selected delivery area (used for geofencing and store assignment).",
    request: object({ area_id: string2().min(1).max(40) }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      await db.update(accounts).set({ currentAreaId: args.area_id }).where(eq(accounts.id, account.id));
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  addAddress: defineAction({
    description: "Adds a new saved delivery address to the logged-in account and makes it the active one.",
    request: object({ label: string2().trim().min(2).max(40), text: string2().trim().min(8).max(300) }),
    response: object({ ok: boolean2(), id: number2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      await db.update(addresses).set({ isActive: 0 }).where(eq(addresses.accountId, account.id));
      const inserted = await db.insert(addresses).values({ accountId: account.id, label: args.label, text: args.text, isActive: 1 }).returning({ id: addresses.id });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0 };
    }
  }),
  selectAddress: defineAction({
    description: "Makes one of the logged-in account's saved addresses the active delivery address.",
    request: object({ address_id: number2().int().positive() }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      await db.batch([
        db.update(addresses).set({ isActive: 0 }).where(eq(addresses.accountId, account.id)),
        db.update(addresses).set({ isActive: 1 }).where(sql`${addresses.id} = ${args.address_id} AND ${addresses.accountId} = ${account.id}`)
      ]);
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  restockProduct: defineAction({
    description: "Store-staff action: adds stock back to a product (inventory management), clears its out-of-stock state, and notifies customers who tapped Notify Me for it.",
    request: object({ product_id: number2().int().positive(), add_qty: number2().int().min(1).max(500) }),
    response: object({ ok: boolean2(), new_stock: number2(), notified: boolean2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      const before = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      const prod = before[0];
      await db.update(products).set({ stock: sql`${products.stock} + ${args.add_qty}` }).where(eq(products.id, args.product_id));
      const rows = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      const newStock = rows[0]?.stock ?? 0;
      let notified = false;
      if (prod && prod.stock <= 0 && newStock > 0) {
        const subs = await db.select().from(notifyMe).where(eq(notifyMe.productId, args.product_id));
        if (subs.length > 0) {
          await db.batch([
            db.insert(notifications).values({
              audience: "customer",
              type: "offer",
              productId: args.product_id,
              title: `\uD83D\uDD14 Wapas Aa Gaya \u2014 ${prod.name}!`,
              message: `Tumne Notify Me dabya tha \u2014 ${prod.name} (${prod.weight}) phir se stock me hai (${newStock} units). Jaldi order karo, phir khatm ho jayega!`,
              isRead: 0,
              createdAt: new Date
            }),
            db.delete(notifyMe).where(eq(notifyMe.productId, args.product_id))
          ]);
          notified = true;
        }
      }
      ctx.invalidateQueries();
      return { ok: true, new_stock: newStock, notified };
    }
  }),
  getStaffSummary: defineAction({
    description: "Store-staff dashboard data from the database: pending orders to pack, low-stock products, and total order count.",
    request: object({}),
    response: object({
      pending_orders: array(orderShape),
      low_stock: array(object({ id: number2(), name: string2(), stock: number2(), source: string2(), vendor: string2() })),
      total_orders: number2(),
      total_revenue: number2()
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(50);
      const live = rows.map(toOrder);
      const prods = await db.select().from(products).orderBy(asc(products.stock));
      return {
        pending_orders: live.filter((o) => o.status === "placed" || o.status === "packing"),
        low_stock: prods.filter((p) => p.stock <= 5).map((p) => ({ id: p.id, name: p.name, stock: p.stock, source: p.source, vendor: p.vendor })),
        total_orders: rows.length,
        total_revenue: rows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.grandTotal, 0)
      };
    }
  }),
  getProductReviews: defineAction({
    description: "Returns all customer reviews for one product plus the average rating and count.",
    request: object({ product_id: number2().int().positive() }),
    response: object({
      reviews: array(object({
        id: number2(),
        author: string2(),
        rating: number2(),
        text: string2(),
        created_at: string2()
      })),
      average: number2(),
      count: number2()
    }),
    async handler(ctx, args) {
      const db = ctx.db();
      const rows = await db.select().from(reviews).where(eq(reviews.productId, args.product_id)).orderBy(desc(reviews.id)).limit(50);
      const count = rows.length;
      const average = count ? Math.round(rows.reduce((s, r) => s + r.rating, 0) / count * 10) / 10 : 0;
      return {
        reviews: rows.map((r) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          text: r.text,
          created_at: r.createdAt.toISOString()
        })),
        average,
        count
      };
    }
  }),
  addReview: defineAction({
    description: "Saves a customer's star rating and written review for a product; the product card then shows the real average.",
    request: object({
      product_id: number2().int().positive(),
      author: string2().trim().min(2).max(40),
      rating: number2().int().min(1).max(5),
      text: string2().trim().min(3).max(400)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      if (!prods[0])
        return { ok: false, error: "Product nahi mila." };
      await db.insert(reviews).values({
        productId: args.product_id,
        author: args.author,
        rating: args.rating,
        text: args.text,
        createdAt: new Date
      });
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  toggleNotifyMe: defineAction({
    description: "Subscribes or unsubscribes the customer to a back-in-stock alert for an out-of-stock product; staff restock then sends them a notification.",
    request: object({ product_id: number2().int().positive() }),
    response: object({ subscribed: boolean2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const { account } = await currentContext(ctx);
      const db = ctx.db();
      const existing = await db.select().from(notifyMe).where(sql`${notifyMe.accountId} = ${account.id} AND ${notifyMe.productId} = ${args.product_id}`).limit(1);
      if (existing.length > 0) {
        await db.delete(notifyMe).where(sql`${notifyMe.accountId} = ${account.id} AND ${notifyMe.productId} = ${args.product_id}`);
        ctx.invalidateQueries();
        return { subscribed: false };
      }
      await db.insert(notifyMe).values({ accountId: account.id, productId: args.product_id });
      ctx.invalidateQueries();
      return { subscribed: true };
    }
  }),
  aiAssistant: defineAction({
    description: "AI order assistant: reads a free-text request (Hindi/English, e.g. 'chai ka samaan bhej do' or '2 doodh aur bread') and matches real catalog products with quantities to build a cart.",
    request: object({ message: string2().trim().min(2).max(300) }),
    response: object({
      reply: string2(),
      items: array(object({
        product_id: number2(),
        name: string2(),
        weight: string2(),
        price: number2(),
        qty: number2(),
        stock: number2()
      }))
    }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).orderBy(asc(products.sortOrder));
      const inStock = prods.filter((p) => p.stock > 0);
      const catalog = inStock.map((p) => `${p.id}: ${p.name} (${p.hi}) \u2014 ${p.brand}, ${p.weight}, \u20B9${p.price}, stock ${p.stock}`).join(`
`);
      const result = await ctx.inference.complete(`You are Fatafat's order assistant for an Indian grocery app. The customer wrote (Hindi/Hinglish/English): "${args.message}". Pick the catalog products that fulfil the request. Understand bundles: "chai ka samaan" = milk + tea + sugar-like staples available; "nashta" = bread/eggs/milk type items; quantities may be written as digits or words (do=2, teen=3, ek=1, aadha kilo style still = 1 pack). Only use product ids from the catalog. Reply in Hinglish, one short friendly sentence.

Catalog:
${catalog}`, {
        schema: object({
          reply: string2(),
          items: array(object({ product_id: number2(), qty: number2() }))
        })
      });
      const byId = new Map(prods.map((p) => [p.id, p]));
      const seen = new Set;
      const items = [];
      for (const it of result.items) {
        const p = byId.get(it.product_id);
        if (!p || seen.has(p.id))
          continue;
        seen.add(p.id);
        const qty = Math.max(1, Math.min(10, Math.floor(it.qty) || 1, p.stock));
        if (p.stock <= 0)
          continue;
        items.push({ product_id: p.id, name: p.name, weight: p.weight, price: p.price, qty, stock: p.stock });
      }
      return {
        reply: items.length ? result.reply : "Iske liye catalog me kuch match nahi mila \u2014 kuch aur likho, jaise '2 doodh aur bread' ya 'chai ka samaan'.",
        items
      };
    }
  }),
  getSalesDashboard: defineAction({
    description: "Sales dashboard computed from real orders in the database: today's revenue and order count, totals, top-selling products and a 7-day revenue series for the chart.",
    request: object({}),
    response: object({
      today_revenue: number2(),
      today_orders: number2(),
      total_revenue: number2(),
      total_orders: number2(),
      top_products: array(object({ name: string2(), qty: number2(), revenue: number2() })),
      daily: array(object({ label: string2(), revenue: number2(), orders: number2() }))
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
      const live = rows.filter((r) => r.status !== "cancelled");
      const now = new Date;
      const sameDay = (d, ref) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth() && d.getDate() === ref.getDate();
      const today = live.filter((r) => sameDay(r.createdAt, now));
      const byProduct = new Map;
      for (const o of live) {
        const ord = toOrder(o);
        for (const line of ord.items) {
          const e = byProduct.get(line.name) ?? { name: line.name, qty: 0, revenue: 0 };
          e.qty += line.qty;
          e.revenue += line.price * line.qty;
          byProduct.set(line.name, e);
        }
      }
      const daily = [];
      for (let i = 6;i >= 0; i--) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayRows = live.filter((r) => sameDay(r.createdAt, d));
        daily.push({
          label: d.toLocaleDateString("en-IN", { weekday: "short" }),
          revenue: dayRows.reduce((s, r) => s + r.grandTotal, 0),
          orders: dayRows.length
        });
      }
      return {
        today_revenue: today.reduce((s, r) => s + r.grandTotal, 0),
        today_orders: today.length,
        total_revenue: live.reduce((s, r) => s + r.grandTotal, 0),
        total_orders: live.length,
        top_products: [...byProduct.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5),
        daily
      };
    }
  }),
  registerVendor: defineAction({
    description: "Vendor self-onboarding: a shopkeeper registers their store as a Fatafat partner vendor, saved in the database.",
    request: object({
      shop_name: string2().trim().min(3).max(60),
      owner_name: string2().trim().min(2).max(60),
      phone: string2().trim().min(10).max(20),
      area: string2().trim().min(2).max(60)
    }),
    response: object({ ok: boolean2(), id: number2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const digits = args.phone.replace(/\D/g, "");
      const local = digits.length === 12 && digits.startsWith("91") ? digits.slice(2) : digits.length === 11 && digits.startsWith("0") ? digits.slice(1) : digits;
      if (!/^[6-9]\d{9}$/.test(local))
        return { ok: false, id: 0, error: "Sahi 10-digit mobile number likho." };
      const dup = await db.select().from(vendors).where(eq(vendors.shopName, args.shop_name)).limit(1);
      if (dup[0])
        return { ok: false, id: 0, error: "Is naam ki dukaan pehle se registered hai." };
      const now = new Date;
      const inserted = await db.insert(vendors).values({
        shopName: args.shop_name,
        ownerName: args.owner_name,
        phone: args.phone,
        area: args.area,
        createdAt: now
      }).returning({ id: vendors.id });
      await db.insert(notifications).values({
        audience: "staff",
        type: "staff",
        title: `\uD83C\uDFEA Naya Vendor Juda \u2014 ${args.shop_name}`,
        message: `${args.owner_name} (${args.area}) ne apni dukaan Fatafat partner ke roop me register ki. Ab wo apne products aur coupons khud add kar sakte hain.`,
        isRead: 0,
        createdAt: now
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    }
  }),
  listVendors: defineAction({
    description: "Lists all registered partner vendors plus the built-in partner stores, newest first.",
    request: object({}),
    response: object({
      vendors: array(object({
        id: number2(),
        shop_name: string2(),
        owner_name: string2(),
        phone: string2(),
        area: string2(),
        created_at: string2()
      }))
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(vendors).orderBy(desc(vendors.id));
      return {
        vendors: rows.map((v) => ({
          id: v.id,
          shop_name: v.shopName,
          owner_name: v.ownerName,
          phone: v.phone,
          area: v.area,
          created_at: v.createdAt.toISOString()
        }))
      };
    }
  }),
  vendorAddProduct: defineAction({
    description: "A registered vendor adds their own product to the live catalog (source = vendor), with price, MRP and starting stock.",
    request: object({
      vendor_name: string2().trim().min(3).max(60),
      name: string2().trim().min(3).max(80),
      weight: string2().trim().min(2).max(30),
      price: number2().int().min(1).max(1e5),
      mrp: number2().int().min(1).max(1e5),
      category: _enum(["fruits", "dairy", "snacks", "chocolates", "drinks", "bakery", "grocery", "care", "babypet", "frozen"]),
      stock: number2().int().min(1).max(1000)
    }),
    response: object({ ok: boolean2(), id: number2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      if (args.mrp < args.price)
        return { ok: false, id: 0, error: "MRP price se kam nahi ho sakti." };
      const maxRow = await db.select({ m: sql`MAX(${products.id})` }).from(products);
      const newId = (maxRow[0]?.m ?? 0) + 1;
      const off = args.mrp > args.price ? Math.round((args.mrp - args.price) / args.mrp * 100) : 0;
      await db.insert(products).values({
        id: newId,
        name: args.name,
        hi: args.name,
        weight: args.weight,
        price: args.price,
        mrp: args.mrp,
        category: args.category,
        brand: args.vendor_name,
        stock: args.stock,
        source: "vendor",
        vendor: args.vendor_name,
        rating: 4.5,
        offPct: off,
        description: `${args.vendor_name} ke dwara add kiya gaya product \u2014 fresh aur quality-checked.`,
        bg: "#FFF1E6",
        icon: "\uD83D\uDECD\uFE0F",
        sortOrder: 1000 + newId
      });
      await db.insert(notifications).values({
        audience: "staff",
        type: "staff",
        title: `\uD83D\uDECD\uFE0F Vendor Ne Product Add Kiya \u2014 ${args.name}`,
        message: `${args.vendor_name} ne "${args.name}" (${args.weight}) \u20B9${args.price} par catalog me add kiya, stock ${args.stock}.`,
        isRead: 0,
        createdAt: new Date
      });
      ctx.invalidateQueries();
      return { ok: true, id: newId, error: "" };
    }
  }),
  createVendorCoupon: defineAction({
    description: "A vendor creates their own coupon code (flat \u20B9 off above a minimum order); it works in the customer cart immediately.",
    request: object({
      vendor_name: string2().trim().min(3).max(60),
      code: string2().trim().min(4).max(20),
      off: number2().int().min(5).max(2000),
      min_order: number2().int().min(0).max(1e5)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const code = args.code.toUpperCase().replace(/[^A-Z0-9]/g, "");
      if (code.length < 4)
        return { ok: false, error: "Coupon code kam se kam 4 akshar/number ka rakho." };
      if (COUPONS[code])
        return { ok: false, error: "Ye code Fatafat ka official coupon hai \u2014 doosra code chuno." };
      const dup = await db.select().from(vendorCoupons).where(eq(vendorCoupons.code, code)).limit(1);
      if (dup[0])
        return { ok: false, error: "Ye coupon code pehle se bana hua hai \u2014 doosra code chuno." };
      await db.insert(vendorCoupons).values({
        code,
        off: args.off,
        minOrder: args.min_order,
        vendorName: args.vendor_name,
        createdAt: new Date
      });
      await db.insert(notifications).values({
        audience: "customer",
        type: "offer",
        title: `\uD83C\uDF9F\uFE0F Naya Coupon \u2014 ${code}`,
        message: `${args.vendor_name} ka naya coupon: \u20B9${args.min_order}+ ke order par \u20B9${args.off} OFF. Cart me code ${code} lagao!`,
        isRead: 0,
        createdAt: new Date
      });
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  listVendorCoupons: defineAction({
    description: "Lists all vendor-created coupons that customers can use in the cart.",
    request: object({}),
    response: object({
      coupons: array(object({
        id: number2(),
        code: string2(),
        off: number2(),
        min_order: number2(),
        vendor_name: string2()
      }))
    }),
    async handler(ctx) {
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(vendorCoupons).orderBy(desc(vendorCoupons.id));
      return {
        coupons: rows.map((c) => ({ id: c.id, code: c.code, off: c.off, min_order: c.minOrder, vendor_name: c.vendorName }))
      };
    }
  }),
  adminLogin: defineAction({
    description: "Admin login: verifies the PIN against the salted hash stored on the server (never in client code). After 5 wrong tries the login locks for 5 minutes and the attempt is written to the activity log. On success returns a session token that auto-expires after 30 minutes of inactivity.",
    request: object({ pin: string2().min(4).max(8) }),
    response: object({ ok: boolean2(), token: string2(), error: string2(), locked_seconds: number2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAdminSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(adminConfig).limit(1);
      const cfg = rows[0];
      if (!cfg)
        return { ok: false, token: "", error: "Admin setup nahi hua \u2014 page refresh karo.", locked_seconds: 0 };
      const now = Date.now();
      if (cfg.lockedUntil > now) {
        const secs = Math.ceil((cfg.lockedUntil - now) / 1000);
        await logActivity(ctx, "login_blocked", `Lock ke dauran login ki koshish hui \u2014 lock khulne me ${secs} second bache the.`);
        return { ok: false, token: "", error: `Login LOCKED hai \u2014 bahut zyada galat koshishen ho gayi. ${Math.ceil(secs / 60)} minute baad phir try karo.`, locked_seconds: secs };
      }
      const hash = await hashPin(args.pin, cfg.salt);
      if (hash !== cfg.pinHash) {
        const attempts = cfg.failedAttempts + 1;
        if (attempts >= ADMIN_MAX_ATTEMPTS) {
          await db.update(adminConfig).set({ failedAttempts: 0, lockedUntil: now + ADMIN_LOCK_MS }).where(eq(adminConfig.id, cfg.id));
          await logActivity(ctx, "login_locked", `\uD83D\uDEA8 ${ADMIN_MAX_ATTEMPTS} baar lagatar galat admin PIN \u2014 login ${ADMIN_LOCK_MS / 60000} minute ke liye LOCK ho gaya. Koi PIN guess karne ki koshish kar raha tha.`);
          return { ok: false, token: "", error: "5 baar galat PIN! Security ke liye admin login 5 minute ke liye lock ho gaya hai.", locked_seconds: ADMIN_LOCK_MS / 1000 };
        }
        await db.update(adminConfig).set({ failedAttempts: attempts }).where(eq(adminConfig.id, cfg.id));
        await logActivity(ctx, "login_failed", `\u274C Galat admin PIN ki koshish #${attempts} \u2014 lock hone tak ${ADMIN_MAX_ATTEMPTS - attempts} galti aur chalegi.`);
        return { ok: false, token: "", error: `Galat PIN \u2014 ${ADMIN_MAX_ATTEMPTS - attempts} koshish aur bachi hain, phir login lock ho jayega.`, locked_seconds: 0 };
      }
      await db.update(adminConfig).set({ failedAttempts: 0, lockedUntil: 0 }).where(eq(adminConfig.id, cfg.id));
      const token = randomHex(24);
      await db.insert(adminSessions).values({ token, createdAt: new Date(now), expiresAt: new Date(now + ADMIN_SESSION_MS) });
      await logActivity(ctx, "login_success", "\u2705 Admin PIN se login hua \u2014 naya session bana (30 minute bina activity ke apne aap expire hoga).");
      return { ok: true, token, error: "", locked_seconds: 0 };
    }
  }),
  adminCheckSession: defineAction({
    description: "Checks whether an admin session token is still valid (used when the panel reopens); a valid check counts as activity and slides the 30-minute inactivity expiry.",
    request: object({ token: string2().max(100) }),
    response: object({ valid: boolean2() }),
    async handler(ctx, args) {
      await ensureAdminSeeded(ctx);
      return { valid: await requireAdmin(ctx, args.token) };
    }
  }),
  adminLogout: defineAction({
    description: "Admin logout: deletes the server-side session so the token stops working immediately, and logs the logout.",
    request: object({ token: string2().min(1).max(100) }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      const db = ctx.db();
      await db.delete(adminSessions).where(eq(adminSessions.token, args.token));
      await logActivity(ctx, "logout", "\uD83D\uDEAA Admin logout hua \u2014 session server se delete ho gaya.");
      return { ok: true };
    }
  }),
  adminDashboard: defineAction({
    description: "Admin dashboard overview computed live from the database: total revenue, orders, products, vendors, low-stock and out-of-stock counts, pending orders and outstanding Fatafat Coins.",
    request: object({ token: string2().min(1).max(100) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      total_revenue: number2(),
      total_orders: number2(),
      total_products: number2(),
      total_vendors: number2(),
      low_stock_count: number2(),
      out_of_stock_count: number2(),
      pending_orders: number2(),
      coins_outstanding: number2()
    }),
    async handler(ctx, args) {
      const empty = { ok: false, error: SESSION_EXPIRED, total_revenue: 0, total_orders: 0, total_products: 0, total_vendors: 0, low_stock_count: 0, out_of_stock_count: 0, pending_orders: 0, coins_outstanding: 0 };
      if (!await requireAdmin(ctx, args.token))
        return empty;
      await ensureSeeded(ctx);
      const db = ctx.db();
      const orderRows = await db.select().from(orders);
      const live = orderRows.map(toOrder);
      const prods = await db.select().from(products);
      const vendorRows = await db.select().from(vendors).where(sql`${vendors.status} != 'removed'`);
      const accRows = await db.select().from(accounts);
      return {
        ok: true,
        error: "",
        total_revenue: orderRows.filter((r) => r.status !== "cancelled").reduce((s, r) => s + r.grandTotal, 0),
        total_orders: orderRows.length,
        total_products: prods.length,
        total_vendors: vendorRows.length,
        low_stock_count: prods.filter((p) => p.stock > 0 && p.stock <= 5).length,
        out_of_stock_count: prods.filter((p) => p.stock <= 0).length,
        pending_orders: live.filter((o) => o.status === "placed" || o.status === "packing").length,
        coins_outstanding: accRows.reduce((s, a) => s + a.coins, 0)
      };
    }
  }),
  adminListProducts: defineAction({
    description: "Admin product management list: every catalog product with live stock, price and MRP (admin session required).",
    request: object({ token: string2().min(1).max(100), query: string2().max(60).default("") }),
    response: object({ ok: boolean2(), error: string2(), products: array(productShape) }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, products: [] };
      await ensureSeeded(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).orderBy(asc(products.sortOrder));
      const agg = reviewAgg(await db.select().from(reviews));
      const q = args.query.trim().toLowerCase();
      const filtered = q === "" ? prods : prods.filter((p) => p.name.toLowerCase().includes(q) || p.hi.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
      return { ok: true, error: "", products: filtered.map((p) => toProduct(p, agg)) };
    }
  }),
  adminUpdateProduct: defineAction({
    description: "Admin edits a product's name, price, MRP and stock; the change is written to the database and recorded in the activity log (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      product_id: number2().int().positive(),
      name: string2().trim().min(3).max(80),
      price: number2().int().min(1).max(1e5),
      mrp: number2().int().min(1).max(1e5),
      stock: number2().int().min(0).max(1e5)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      if (args.mrp < args.price)
        return { ok: false, error: "MRP price se kam nahi ho sakti." };
      const db = ctx.db();
      const rows = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      const old = rows[0];
      if (!old)
        return { ok: false, error: "Product nahi mila." };
      const off = args.mrp > args.price ? Math.round((args.mrp - args.price) / args.mrp * 100) : 0;
      await db.update(products).set({ name: args.name, price: args.price, mrp: args.mrp, stock: args.stock, offPct: off }).where(eq(products.id, args.product_id));
      await logActivity(ctx, "product_edit", `\u270F\uFE0F Product edit: "${old.name}" \u2192 naam "${args.name}", price \u20B9${old.price} \u2192 \u20B9${args.price}, MRP \u20B9${old.mrp} \u2192 \u20B9${args.mrp}, stock ${old.stock} \u2192 ${args.stock}.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminAddProduct: defineAction({
    description: "Admin adds a brand-new product directly to the live catalog (dark-store source) and logs it (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      name: string2().trim().min(3).max(80),
      weight: string2().trim().min(2).max(30),
      price: number2().int().min(1).max(1e5),
      mrp: number2().int().min(1).max(1e5),
      category: _enum(["fruits", "dairy", "snacks", "chocolates", "drinks", "bakery", "grocery", "care", "babypet", "frozen"]),
      brand: string2().trim().min(2).max(40),
      stock: number2().int().min(0).max(1e5)
    }),
    response: object({ ok: boolean2(), id: number2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, id: 0, error: SESSION_EXPIRED };
      if (args.mrp < args.price)
        return { ok: false, id: 0, error: "MRP price se kam nahi ho sakti." };
      await ensureSeeded(ctx);
      const db = ctx.db();
      const maxRow = await db.select({ m: sql`MAX(${products.id})` }).from(products);
      const newId = (maxRow[0]?.m ?? 0) + 1;
      const off = args.mrp > args.price ? Math.round((args.mrp - args.price) / args.mrp * 100) : 0;
      await db.insert(products).values({
        id: newId,
        name: args.name,
        hi: args.name,
        weight: args.weight,
        price: args.price,
        mrp: args.mrp,
        category: args.category,
        brand: args.brand,
        stock: args.stock,
        source: "dark",
        vendor: "",
        rating: 4.5,
        offPct: off,
        description: `${args.brand} ka ${args.name} \u2014 admin dwara catalog me add kiya gaya, quality-checked.`,
        bg: "#FFF1E6",
        icon: "\uD83D\uDED2",
        sortOrder: 2000 + newId
      });
      await logActivity(ctx, "product_add", `\u2795 Admin ne naya product add kiya: "${args.name}" (${args.weight}) \u20B9${args.price}, stock ${args.stock}.`);
      ctx.invalidateQueries();
      return { ok: true, id: newId, error: "" };
    }
  }),
  adminDeleteProduct: defineAction({
    description: "Admin deletes a product from the catalog (also clears its wishlist/notify-me rows) and logs the deletion (admin session required).",
    request: object({ token: string2().min(1).max(100), product_id: number2().int().positive() }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      const rows = await db.select().from(products).where(eq(products.id, args.product_id)).limit(1);
      const p = rows[0];
      if (!p)
        return { ok: false, error: "Product nahi mila." };
      await db.batch([
        db.delete(products).where(eq(products.id, p.id)),
        db.delete(wishlist).where(eq(wishlist.productId, p.id)),
        db.delete(notifyMe).where(eq(notifyMe.productId, p.id))
      ]);
      await logActivity(ctx, "product_delete", `\uD83D\uDDD1\uFE0F Admin ne product DELETE kiya: "${p.name}" (${p.weight}, \u20B9${p.price}, stock ${p.stock} tha).`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminListOrders: defineAction({
    description: "Admin orders list: all orders across all customers with items, totals and live status (admin session required).",
    request: object({ token: string2().min(1).max(100), limit: number2().int().positive().max(200).default(100) }),
    response: object({ ok: boolean2(), error: string2(), orders: array(orderShape) }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, orders: [] };
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(args.limit);
      return { ok: true, error: "", orders: rows.map(toOrder) };
    }
  }),
  adminSetOrderStatus: defineAction({
    description: "Admin changes any order's status directly (placed/packing/on the way/delivered/cancelled). Cancelling restores stock and refunds coins exactly like a customer cancel; every change is logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      order_id: string2().min(1).max(40),
      status: _enum(["placed", "packing", "on_the_way", "delivered", "cancelled"])
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      const rows = await db.select().from(orders).where(eq(orders.id, args.order_id)).limit(1);
      const row = rows[0];
      if (!row)
        return { ok: false, error: "Order nahi mila." };
      const live = toOrder(row);
      if (args.status === "cancelled") {
        if (row.status === "cancelled")
          return { ok: false, error: "Ye order pehle se cancelled hai." };
        if (live.status === "delivered")
          return { ok: false, error: "Delivered order cancel nahi ho sakta." };
        const stmts = [
          db.update(orders).set({ status: "cancelled" }).where(eq(orders.id, row.id))
        ];
        for (const line of live.items) {
          stmts.push(db.update(products).set({ stock: sql`${products.stock} + ${line.qty}` }).where(eq(products.id, line.product_id)));
        }
        if (row.coinsRedeemed > 0 || row.coinsEarned > 0) {
          stmts.push(db.update(accounts).set({ coins: sql`MAX(0, ${accounts.coins} + ${row.coinsRedeemed} - ${row.coinsEarned})` }).where(eq(accounts.id, row.accountId)));
        }
        stmts.push(db.insert(notifications).values({
          audience: "customer",
          type: "order",
          orderId: row.id,
          title: `\u274C Order ${row.id} Admin Ne Cancel Kiya`,
          message: "Store admin ne ye order cancel kar diya \u2014 stock aur coins (agar lage the) wapas ho gaye hain.",
          isRead: 0,
          createdAt: new Date
        }));
        const [first, ...rest] = stmts;
        if (first)
          await db.batch([first, ...rest]);
        await logActivity(ctx, "order_status", `\uD83D\uDEAB Admin ne order ${row.id} ka status "${live.status_label}" \u2192 "Cancelled" kiya (stock/coins wapas).`);
        ctx.invalidateQueries();
        return { ok: true, error: "" };
      }
      const stepMap = { placed: 0, packing: 1, on_the_way: 2, delivered: 3 };
      const step = stepMap[args.status] ?? 0;
      await db.batch([
        db.update(orders).set({ status: args.status, statusStep: step }).where(eq(orders.id, row.id)),
        db.insert(notifications).values({
          audience: "customer",
          type: "order",
          orderId: row.id,
          title: `\uD83D\uDEF5 Order ${row.id} \u2014 ${STATUS_LABELS[args.status]}`,
          message: `Admin ne order ka status badla: ${STATUS_LABELS[args.status]}.`,
          isRead: 0,
          createdAt: new Date
        })
      ]);
      await logActivity(ctx, "order_status", `\uD83D\uDD04 Admin ne order ${row.id} ka status "${live.status_label}" \u2192 "${STATUS_LABELS[args.status]}" kiya.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminListVendors: defineAction({
    description: "Admin vendors list: registered partner vendors with approval status and how many live catalog products each one sells (admin session required).",
    request: object({ token: string2().min(1).max(100) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      vendors: array(object({
        id: number2(),
        shop_name: string2(),
        owner_name: string2(),
        phone: string2(),
        area: string2(),
        status: string2(),
        created_at: string2(),
        product_count: number2()
      }))
    }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, vendors: [] };
      await ensureSeeded(ctx);
      const db = ctx.db();
      const rows = await db.select().from(vendors).orderBy(desc(vendors.id));
      const prods = await db.select().from(products);
      return {
        ok: true,
        error: "",
        vendors: rows.map((v) => ({
          id: v.id,
          shop_name: v.shopName,
          owner_name: v.ownerName,
          phone: v.phone,
          area: v.area,
          status: v.status,
          created_at: v.createdAt.toISOString(),
          product_count: prods.filter((p) => p.source === "vendor" && p.vendor === v.shopName).length
        }))
      };
    }
  }),
  adminSetVendorStatus: defineAction({
    description: "Admin approves a vendor or removes one. Removing a vendor deletes their registration and their live catalog products; both actions are logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      vendor_id: number2().int().positive(),
      status: _enum(["approved", "removed"])
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      const rows = await db.select().from(vendors).where(eq(vendors.id, args.vendor_id)).limit(1);
      const v = rows[0];
      if (!v)
        return { ok: false, error: "Vendor nahi mila." };
      if (args.status === "approved") {
        await db.update(vendors).set({ status: "approved" }).where(eq(vendors.id, v.id));
        await logActivity(ctx, "vendor_status", `\u2705 Admin ne vendor "${v.shopName}" ko APPROVE kiya.`);
        ctx.invalidateQueries();
        return { ok: true, error: "" };
      }
      const theirProducts = await db.select().from(products).where(sql`${products.source} = 'vendor' AND ${products.vendor} = ${v.shopName}`);
      const stmts = [
        db.delete(vendors).where(eq(vendors.id, v.id))
      ];
      for (const p of theirProducts) {
        stmts.push(db.delete(products).where(eq(products.id, p.id)));
        stmts.push(db.delete(wishlist).where(eq(wishlist.productId, p.id)));
        stmts.push(db.delete(notifyMe).where(eq(notifyMe.productId, p.id)));
      }
      const [first, ...rest] = stmts;
      if (first)
        await db.batch([first, ...rest]);
      await logActivity(ctx, "vendor_status", `\uD83D\uDDD1\uFE0F Admin ne vendor "${v.shopName}" ko REMOVE kiya \u2014 registration aur unke ${theirProducts.length} catalog products delete ho gaye.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminListCoupons: defineAction({
    description: "Admin coupons list: platform coupons (FATA75/FIRST50) and vendor coupons, each with its live enabled state (admin session required).",
    request: object({ token: string2().min(1).max(100) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      platform: array(object({ code: string2(), off: number2(), min_order: number2(), label: string2(), enabled: boolean2() })),
      vendor: array(object({ id: number2(), code: string2(), off: number2(), min_order: number2(), vendor_name: string2(), enabled: boolean2() }))
    }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, platform: [], vendor: [] };
      await ensureAdminSeeded(ctx);
      const db = ctx.db();
      const pc = await db.select().from(platformCoupons);
      const vc = await db.select().from(vendorCoupons).orderBy(desc(vendorCoupons.id));
      return {
        ok: true,
        error: "",
        platform: pc.map((c) => ({ code: c.code, off: c.off, min_order: c.minOrder, label: c.label, enabled: c.enabled === 1 })),
        vendor: vc.map((c) => ({ id: c.id, code: c.code, off: c.off, min_order: c.minOrder, vendor_name: c.vendorName, enabled: c.enabled === 1 }))
      };
    }
  }),
  adminToggleCoupon: defineAction({
    description: "Admin enables or disables a platform or vendor coupon; checkout stops honouring a disabled coupon immediately. Logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      kind: _enum(["platform", "vendor"]),
      code: string2().max(20).default(""),
      coupon_id: number2().int().default(0),
      enabled: boolean2()
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      if (args.kind === "platform") {
        const code = args.code.toUpperCase();
        const rows = await db.select().from(platformCoupons).where(eq(platformCoupons.code, code)).limit(1);
        if (!rows[0])
          return { ok: false, error: "Platform coupon nahi mila." };
        await db.update(platformCoupons).set({ enabled: args.enabled ? 1 : 0 }).where(eq(platformCoupons.code, code));
        await logActivity(ctx, "coupon_toggle", `\uD83C\uDF9F\uFE0F Admin ne platform coupon ${code} ko ${args.enabled ? "ON (live)" : "OFF (band)"} kiya.`);
      } else {
        const rows = await db.select().from(vendorCoupons).where(eq(vendorCoupons.id, args.coupon_id)).limit(1);
        const c = rows[0];
        if (!c)
          return { ok: false, error: "Vendor coupon nahi mila." };
        await db.update(vendorCoupons).set({ enabled: args.enabled ? 1 : 0 }).where(eq(vendorCoupons.id, c.id));
        await logActivity(ctx, "coupon_toggle", `\uD83C\uDF9F\uFE0F Admin ne vendor coupon ${c.code} (${c.vendorName}) ko ${args.enabled ? "ON (live)" : "OFF (band)"} kiya.`);
      }
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminDeleteCoupon: defineAction({
    description: "Admin permanently deletes a platform or vendor coupon; the code stops working in carts immediately. Logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      kind: _enum(["platform", "vendor"]),
      code: string2().max(20).default(""),
      coupon_id: number2().int().default(0)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      if (args.kind === "platform") {
        const code = args.code.toUpperCase();
        const rows = await db.select().from(platformCoupons).where(eq(platformCoupons.code, code)).limit(1);
        if (!rows[0])
          return { ok: false, error: "Platform coupon nahi mila." };
        await db.delete(platformCoupons).where(eq(platformCoupons.code, code));
        await logActivity(ctx, "coupon_delete", `\uD83D\uDDD1\uFE0F Admin ne platform coupon ${code} DELETE kar diya \u2014 ab ye code kisi cart me nahi chalega.`);
      } else {
        const rows = await db.select().from(vendorCoupons).where(eq(vendorCoupons.id, args.coupon_id)).limit(1);
        const c = rows[0];
        if (!c)
          return { ok: false, error: "Vendor coupon nahi mila." };
        await db.delete(vendorCoupons).where(eq(vendorCoupons.id, c.id));
        await logActivity(ctx, "coupon_delete", `\uD83D\uDDD1\uFE0F Admin ne vendor coupon ${c.code} (${c.vendorName}) DELETE kar diya.`);
      }
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminCustomers: defineAction({
    description: "Admin customers view: the saved customer profile with coin balance and referral state, per-customer order/spend summaries grouped from real orders, and the latest orders (admin session required).",
    request: object({ token: string2().min(1).max(100) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      profile: object({ name: string2(), phone: string2(), coins: number2(), referral_code: string2(), referred_by: string2() }),
      customers: array(object({ name: string2(), phone: string2(), orders: number2(), spent: number2(), last_order_at: string2() })),
      recent_orders: array(orderShape)
    }),
    async handler(ctx, args) {
      const emptyProfile = { name: "", phone: "", coins: 0, referral_code: "", referred_by: "" };
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, profile: emptyProfile, customers: [], recent_orders: [] };
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const db = ctx.db();
      const accRows = await db.select().from(accounts).orderBy(asc(accounts.id));
      const guest = accRows[0];
      const rows = await db.select().from(orders).orderBy(desc(orders.createdAt)).limit(500);
      const customers = accRows.map((a) => {
        const mine = rows.filter((o) => o.accountId === a.id);
        const last = mine[0];
        return {
          name: a.name,
          phone: a.phone,
          orders: mine.length,
          spent: mine.filter((o) => o.status !== "cancelled").reduce((s, o) => s + o.grandTotal, 0),
          last_order_at: last ? last.createdAt.toISOString() : a.createdAt.toISOString()
        };
      });
      return {
        ok: true,
        error: "",
        profile: {
          name: guest?.name ?? "",
          phone: guest?.phone ?? "",
          coins: guest?.coins ?? 0,
          referral_code: guest?.referralCode ?? "",
          referred_by: guest?.referredBy ?? ""
        },
        customers,
        recent_orders: rows.slice(0, 20).map(toOrder)
      };
    }
  }),
  adminGetSettings: defineAction({
    description: "Admin reads the live store settings: delivery charge, free-delivery threshold and geofence radius in km (admin session required).",
    request: object({ token: string2().min(1).max(100) }),
    response: object({ ok: boolean2(), error: string2(), delivery_charge: number2(), free_threshold: number2(), geofence_km: number2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, delivery_charge: 0, free_threshold: 0, geofence_km: 0 };
      const s = await getSettings(ctx);
      return { ok: true, error: "", delivery_charge: s.deliveryCharge, free_threshold: s.freeThreshold, geofence_km: s.geofenceKm };
    }
  }),
  adminUpdateSettings: defineAction({
    description: "Admin saves store settings (delivery charge \u20B9, free-delivery threshold \u20B9, geofence radius km). Checkout pricing and area serviceability use the new values immediately; the change is logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      delivery_charge: number2().int().min(0).max(500),
      free_threshold: number2().int().min(0).max(1e4),
      geofence_km: number2().min(0.5).max(20)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const old = await getSettings(ctx);
      const db = ctx.db();
      const stmts = [
        db.update(appSettings).set({ deliveryCharge: args.delivery_charge, freeThreshold: args.free_threshold, geofenceKm: args.geofence_km }).where(eq(appSettings.id, 1))
      ];
      const areaRows = await db.select().from(areas);
      for (const a of areaRows) {
        stmts.push(db.update(areas).set({ serviceable: a.distKm <= args.geofence_km ? 1 : 0 }).where(eq(areas.id, a.id)));
      }
      const [first, ...rest] = stmts;
      if (first)
        await db.batch([first, ...rest]);
      await logActivity(ctx, "settings_change", `\u2699\uFE0F Admin ne settings badli: delivery charge \u20B9${old.deliveryCharge} \u2192 \u20B9${args.delivery_charge}, free-delivery threshold \u20B9${old.freeThreshold} \u2192 \u20B9${args.free_threshold}, geofence radius ${old.geofenceKm} km \u2192 ${args.geofence_km} km.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  }),
  adminChangePin: defineAction({
    description: "Admin changes the admin PIN (current PIN required). The new PIN is stored as a fresh salted hash and ALL admin sessions are killed, forcing a fresh login everywhere. Logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      current_pin: string2().min(4).max(8),
      new_pin: string2().min(4).max(8)
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      if (!/^\d+$/.test(args.new_pin))
        return { ok: false, error: "Naya PIN sirf numbers ka rakho (4\u20138 digit)." };
      if (args.new_pin === args.current_pin)
        return { ok: false, error: "Naya PIN purane se alag rakho." };
      const db = ctx.db();
      const rows = await db.select().from(adminConfig).limit(1);
      const cfg = rows[0];
      if (!cfg)
        return { ok: false, error: "Admin config nahi mila." };
      const hash = await hashPin(args.current_pin, cfg.salt);
      if (hash !== cfg.pinHash) {
        await logActivity(ctx, "pin_change_failed", "\u26A0\uFE0F PIN badalne ki koshish me galat current PIN daala gaya \u2014 PIN change nahi hua.");
        return { ok: false, error: "Current PIN galat hai \u2014 PIN change nahi hua." };
      }
      const salt = randomHex(16);
      const pinHash = await hashPin(args.new_pin, salt);
      await db.batch([
        db.update(adminConfig).set({ pinHash, salt, failedAttempts: 0, lockedUntil: 0 }).where(eq(adminConfig.id, cfg.id)),
        db.delete(adminSessions)
      ]);
      await logActivity(ctx, "pin_change", "\uD83D\uDD11 Admin PIN badal gaya \u2014 suraksha ke liye saare admin sessions khatam kar diye gaye, naye PIN se phir login karna hoga.");
      return { ok: true, error: "" };
    }
  }),
  adminActivityLog: defineAction({
    description: "Admin activity/security log: logins, failed login attempts with timestamps, lockouts, product edits/deletes, order status changes, coupon and settings changes \u2014 newest first (admin session required).",
    request: object({ token: string2().min(1).max(100), limit: number2().int().positive().max(200).default(80) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      entries: array(object({ id: number2(), kind: string2(), detail: string2(), created_at: string2() }))
    }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, entries: [] };
      const db = ctx.db();
      const rows = await db.select().from(adminActivity).orderBy(desc(adminActivity.id)).limit(args.limit);
      return {
        ok: true,
        error: "",
        entries: rows.map((r) => ({ id: r.id, kind: r.kind, detail: r.detail, created_at: r.createdAt.toISOString() }))
      };
    }
  }),
  adminBackup: defineAction({
    description: "Admin data backup: exports products, orders, vendors, all coupons and settings as one JSON document the owner can download and keep for recovery (admin session required).",
    request: object({ token: string2().min(1).max(100) }),
    response: object({ ok: boolean2(), error: string2(), filename: string2(), json: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, filename: "", json: "" };
      await ensureSeeded(ctx);
      const settings = await getSettings(ctx);
      const db = ctx.db();
      const prods = await db.select().from(products).orderBy(asc(products.sortOrder));
      const orderRows = await db.select().from(orders).orderBy(desc(orders.createdAt));
      const vendorRows = await db.select().from(vendors);
      const pc = await db.select().from(platformCoupons);
      const vc = await db.select().from(vendorCoupons);
      const accRows = await db.select().from(accounts);
      const ticketRows = await db.select().from(supportTickets);
      const now = new Date;
      const backup = {
        app: "Fatafat Full App",
        exported_at: now.toISOString(),
        settings: {
          delivery_charge: settings.deliveryCharge,
          free_threshold: settings.freeThreshold,
          geofence_km: settings.geofenceKm
        },
        products: prods,
        orders: orderRows.map((o) => ({ ...o, createdAt: o.createdAt.toISOString() })),
        vendors: vendorRows.map((v) => ({ ...v, createdAt: v.createdAt.toISOString() })),
        platform_coupons: pc,
        vendor_coupons: vc.map((c) => ({ ...c, createdAt: c.createdAt.toISOString() })),
        accounts: accRows.map((a) => ({
          id: a.id,
          name: a.name,
          phone: a.phone,
          coins: a.coins,
          referral_code: a.referralCode,
          referred_by: a.referredBy,
          current_area_id: a.currentAreaId,
          has_pin: a.pinHash !== "",
          created_at: a.createdAt.toISOString()
        })),
        support_tickets: ticketRows.map((t) => ({ ...t, createdAt: t.createdAt.toISOString() }))
      };
      await logActivity(ctx, "backup", `\uD83D\uDCBE Admin ne data backup download kiya \u2014 ${prods.length} products, ${orderRows.length} orders, ${vendorRows.length} vendors, ${pc.length + vc.length} coupons, settings.`);
      const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, "-");
      return { ok: true, error: "", filename: `fatafat-backup-${stamp}.json`, json: JSON.stringify(backup, null, 2) };
    }
  }),
  customerSignup: defineAction({
    description: "Customer sign-up: creates an account with name, mobile number and a 4\u20136 digit login PIN (stored only as a salted hash on the server) and logs the app into the new account. The same mobile number cannot register twice; signing up with the guest/demo number claims that account by setting its PIN.",
    request: object({
      name: string2().trim().min(2).max(60),
      phone: string2().trim().min(10).max(20),
      pin: string2().min(4).max(6)
    }),
    response: object({ ok: boolean2(), token: string2(), name: string2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const fail = (error) => ({ ok: false, token: "", name: "", error });
      if (!/^\d{4,6}$/.test(args.pin))
        return fail("Login PIN 4\u20136 digit ka number rakho (sirf digits).");
      const local = normalizePhone(args.phone);
      if (!local)
        return fail("Sahi 10-digit mobile number likho (6\u20139 se shuru). +91 / 0 wala bhi chalega.");
      const existing = await findAccountByPhone(ctx, local);
      const db = ctx.db();
      const salt = randomHex(16);
      const pinHash = await hashPin(args.pin, salt);
      if (existing) {
        if (existing.pinHash)
          return fail("Is mobile number se pehle hi account bana hua hai \u2014 Login tab se apne PIN ke saath login karo.");
        await db.update(accounts).set({ pinHash, salt, name: args.name.trim(), failedAttempts: 0, lockedUntil: 0 }).where(eq(accounts.id, existing.id));
        const token = await startCustomerSession(ctx, existing.id);
        await db.insert(notifications).values({
          audience: "customer",
          type: "offer",
          title: `\uD83D\uDD10 Welcome back, ${args.name.trim()}!`,
          message: "Tumhara PIN set ho gaya \u2014 ab tum is account ke malik ho. Tumhare purane orders, coins aur subscriptions sab isi account me hain.",
          isRead: 0,
          createdAt: new Date
        });
        ctx.invalidateQueries();
        return { ok: true, token, name: args.name.trim(), error: "" };
      }
      const inserted = await db.insert(accounts).values({
        name: args.name.trim(),
        phone: args.phone.trim(),
        pinHash,
        salt,
        referralCode: referralCodeFor(args.name, args.phone),
        referredBy: "",
        coins: 0,
        currentAreaId: "sec62",
        createdAt: new Date
      }).returning({ id: accounts.id });
      const newId = inserted[0]?.id ?? 0;
      const token = await startCustomerSession(ctx, newId);
      await db.insert(notifications).values({
        audience: "customer",
        type: "offer",
        title: `\uD83C\uDF89 Welcome to Fatafat, ${args.name.trim()}!`,
        message: "Tumhara account ban gaya hai. Pehle order par 5% coins cashback milega \u2014 aur dost ka referral code lagane par 50 coins free!",
        isRead: 0,
        createdAt: new Date
      });
      ctx.invalidateQueries();
      return { ok: true, token, name: args.name.trim(), error: "" };
    }
  }),
  customerLogin: defineAction({
    description: "Customer login with mobile number + PIN, verified on the server against the stored hash. Wrong PINs are counted per account and the account locks for 5 minutes after 5 failures (attempts are also written to the admin activity log). On success the whole app switches to that customer's account.",
    request: object({
      phone: string2().trim().min(10).max(20),
      pin: string2().min(4).max(6)
    }),
    response: object({ ok: boolean2(), token: string2(), name: string2(), error: string2(), locked_seconds: number2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      await ensureAccounts(ctx);
      const fail = (error, locked_seconds = 0) => ({ ok: false, token: "", name: "", error, locked_seconds });
      const local = normalizePhone(args.phone);
      if (!local)
        return fail("Sahi 10-digit mobile number likho.");
      const acc = await findAccountByPhone(ctx, local);
      if (!acc || !acc.pinHash)
        return fail("Is number par koi PIN account nahi mila \u2014 pehle Sign Up karke account banao.");
      const db = ctx.db();
      const now = Date.now();
      if (acc.lockedUntil > now) {
        const secs = Math.ceil((acc.lockedUntil - now) / 1000);
        return fail(`Ye account LOCKED hai \u2014 bahut zyada galat PIN koshishen. ${Math.ceil(secs / 60)} minute baad phir try karo.`, secs);
      }
      const hash = await hashPin(args.pin, acc.salt);
      if (hash !== acc.pinHash) {
        const attempts = acc.failedAttempts + 1;
        if (attempts >= ADMIN_MAX_ATTEMPTS) {
          await db.update(accounts).set({ failedAttempts: 0, lockedUntil: now + ADMIN_LOCK_MS }).where(eq(accounts.id, acc.id));
          await logActivity(ctx, "customer_login_locked", `\uD83D\uDEA8 Customer account ${acc.phone} par ${ADMIN_MAX_ATTEMPTS} baar galat PIN \u2014 account ${ADMIN_LOCK_MS / 60000} minute ke liye lock.`);
          return fail("5 baar galat PIN! Security ke liye ye account 5 minute ke liye lock ho gaya hai.", ADMIN_LOCK_MS / 1000);
        }
        await db.update(accounts).set({ failedAttempts: attempts }).where(eq(accounts.id, acc.id));
        await logActivity(ctx, "customer_login_failed", `\u274C Customer account ${acc.phone} par galat PIN ki koshish #${attempts}.`);
        return fail(`Galat PIN \u2014 ${ADMIN_MAX_ATTEMPTS - attempts} koshish aur bachi hain, phir account lock ho jayega.`);
      }
      await db.update(accounts).set({ failedAttempts: 0, lockedUntil: 0 }).where(eq(accounts.id, acc.id));
      const token = await startCustomerSession(ctx, acc.id);
      ctx.invalidateQueries();
      return { ok: true, token, name: acc.name, error: "", locked_seconds: 0 };
    }
  }),
  customerLogout: defineAction({
    description: "Customer logout: deletes the server session and switches the app back to the default guest/demo account.",
    request: object({ token: string2().max(100) }),
    response: object({ ok: boolean2() }),
    async handler(ctx, args) {
      await ensureAccounts(ctx);
      const db = ctx.db();
      const st = await db.select().from(appState).limit(1);
      const state = st[0];
      const token = args.token || (state?.currentSessionToken ?? "");
      if (token) {
        await db.delete(customerSessions).where(eq(customerSessions.token, token));
      }
      if (state && (args.token === "" || state.currentSessionToken === token)) {
        await db.update(appState).set({ currentAccountId: 1, currentSessionToken: "" }).where(eq(appState.id, 1));
      }
      ctx.invalidateQueries();
      return { ok: true };
    }
  }),
  customerSessionCheck: defineAction({
    description: "Checks whether a stored customer session token is still the app's active session (used on app start to clear stale tokens).",
    request: object({ token: string2().max(100) }),
    response: object({ valid: boolean2(), name: string2() }),
    async handler(ctx, args) {
      await ensureAccounts(ctx);
      if (!args.token)
        return { valid: false, name: "" };
      const db = ctx.db();
      const rows = await db.select().from(customerSessions).where(eq(customerSessions.token, args.token)).limit(1);
      const s = rows[0];
      if (!s || s.expiresAt.getTime() <= Date.now())
        return { valid: false, name: "" };
      const st = await db.select().from(appState).limit(1);
      if ((st[0]?.currentSessionToken ?? "") !== args.token)
        return { valid: false, name: "" };
      const acc = await db.select().from(accounts).where(eq(accounts.id, s.accountId)).limit(1);
      return { valid: true, name: acc[0]?.name ?? "" };
    }
  }),
  submitSupportTicket: defineAction({
    description: "Saves a Help-page 'Problem batao' support request (name, mobile, message) to the database; it appears in the admin panel's Support section and alerts store staff.",
    request: object({
      name: string2().trim().min(2).max(60),
      mobile: string2().trim().min(10).max(20),
      message: string2().trim().min(5).max(1000)
    }),
    response: object({ ok: boolean2(), id: number2(), error: string2() }),
    async handler(ctx, args) {
      await ensureSeeded(ctx);
      if (!normalizePhone(args.mobile))
        return { ok: false, id: 0, error: "Sahi 10-digit mobile number likho \u2014 team tumhe usi par contact karegi." };
      const db = ctx.db();
      const now = new Date;
      const inserted = await db.insert(supportTickets).values({
        name: args.name,
        mobile: args.mobile,
        message: args.message,
        status: "open",
        createdAt: now
      }).returning({ id: supportTickets.id });
      await db.insert(notifications).values({
        audience: "staff",
        type: "staff",
        title: `\uD83C\uDD98 Naya Support Request \u2014 ${args.name}`,
        message: `${args.mobile}: ${args.message.slice(0, 140)}`,
        isRead: 0,
        createdAt: now
      });
      ctx.invalidateQueries();
      return { ok: true, id: inserted[0]?.id ?? 0, error: "" };
    }
  }),
  adminListTickets: defineAction({
    description: "Admin support inbox: all Help-page problem reports, newest first, with open/resolved status (admin session required).",
    request: object({ token: string2().min(1).max(100), limit: number2().int().positive().max(200).default(100) }),
    response: object({
      ok: boolean2(),
      error: string2(),
      tickets: array(object({
        id: number2(),
        name: string2(),
        mobile: string2(),
        message: string2(),
        status: string2(),
        created_at: string2()
      }))
    }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED, tickets: [] };
      const db = ctx.db();
      const rows = await db.select().from(supportTickets).orderBy(desc(supportTickets.id)).limit(args.limit);
      return {
        ok: true,
        error: "",
        tickets: rows.map((t) => ({
          id: t.id,
          name: t.name,
          mobile: t.mobile,
          message: t.message,
          status: t.status,
          created_at: t.createdAt.toISOString()
        }))
      };
    }
  }),
  adminSetTicketStatus: defineAction({
    description: "Admin marks a support request resolved or reopens it; the change is logged (admin session required).",
    request: object({
      token: string2().min(1).max(100),
      ticket_id: number2().int().positive(),
      status: _enum(["open", "resolved"])
    }),
    response: object({ ok: boolean2(), error: string2() }),
    async handler(ctx, args) {
      if (!await requireAdmin(ctx, args.token))
        return { ok: false, error: SESSION_EXPIRED };
      const db = ctx.db();
      const rows = await db.select().from(supportTickets).where(eq(supportTickets.id, args.ticket_id)).limit(1);
      const t = rows[0];
      if (!t)
        return { ok: false, error: "Support request nahi mili." };
      await db.update(supportTickets).set({ status: args.status }).where(eq(supportTickets.id, t.id));
      await logActivity(ctx, "support_status", `\uD83C\uDD98 Admin ne support request #${t.id} (${t.name}) ko ${args.status === "resolved" ? "RESOLVED \u2713" : "phir se OPEN"} kiya.`);
      ctx.invalidateQueries();
      return { ok: true, error: "" };
    }
  })
};
export {
  Actions
};
