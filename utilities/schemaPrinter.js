'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

exports.printSchema = printSchema;
exports.printIntrospectionSchema = printIntrospectionSchema;

var _invariant = require('../jsutils/invariant');

var _invariant2 = _interopRequireDefault(_invariant);

var _isNullish = require('../jsutils/isNullish');

var _isNullish2 = _interopRequireDefault(_isNullish);

var _astFromValue = require('../utilities/astFromValue');

var _printer = require('../language/printer');

var _definition = require('../type/definition');

var _scalars = require('../type/scalars');

var _directives = require('../type/directives');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }
/**
 *  Copyright (c) 2015, Facebook, Inc.
 *  All rights reserved.
 *
 *  This source code is licensed under the BSD-style license found in the
 *  LICENSE file in the root directory of this source tree. An additional grant
 *  of patent rights can be found in the PATENTS file in the same directory.
 */

function printSchema(schema) {
  var style = arguments.length <= 1 || arguments[1] === undefined ? 'alphabet' : arguments[1];

  switch (style) {
    case 'hierarchy':
      return printFineSchema(schema, function (n) {
        return !isSpecDirective(n);
      });
    case 'alphabet':
    default:
      return printFilteredSchema(schema, function (n) {
        return !isSpecDirective(n);
      }, isDefinedType);
  }
}

function printIntrospectionSchema(schema) {
  return printFilteredSchema(schema, isSpecDirective, isIntrospectionType);
}

function isSpecDirective(directiveName) {
  return directiveName === 'skip' || directiveName === 'include' || directiveName === 'deprecated';
}

function isDefinedType(typename) {
  return !isIntrospectionType(typename) && !isBuiltInScalar(typename);
}

function isIntrospectionType(typename) {
  return typename.indexOf('__') === 0;
}

function isBuiltInScalar(typename) {
  return typename === 'String' || typename === 'Boolean' || typename === 'Int' || typename === 'Float' || typename === 'ID';
}

function printFilteredSchema(schema, directiveFilter, typeFilter) {
  var directives = schema.getDirectives().filter(function (directive) {
    return directiveFilter(directive.name);
  });
  var typeMap = schema.getTypeMap();
  var types = Object.keys(typeMap).filter(typeFilter).sort(function (name1, name2) {
    return name1.localeCompare(name2);
  }).map(function (typeName) {
    return typeMap[typeName];
  });
  return [printSchemaDefinition(schema)].concat(directives.map(printDirective), types.map(printType)).join('\n\n') + '\n';
}

function printSchemaDefinition(schema) {
  var operationTypes = [];

  var queryType = schema.getQueryType();
  if (queryType) {
    operationTypes.push('  query: ' + queryType.name);
  }

  var mutationType = schema.getMutationType();
  if (mutationType) {
    operationTypes.push('  mutation: ' + mutationType.name);
  }

  var subscriptionType = schema.getSubscriptionType();
  if (subscriptionType) {
    operationTypes.push('  subscription: ' + subscriptionType.name);
  }

  return 'schema {\n' + operationTypes.join('\n') + '\n}';
}

function printType(type) {
  if (type instanceof _definition.GraphQLScalarType) {
    return printScalar(type);
  } else if (type instanceof _definition.GraphQLObjectType) {
    return printObject(type);
  } else if (type instanceof _definition.GraphQLInterfaceType) {
    return printInterface(type);
  } else if (type instanceof _definition.GraphQLUnionType) {
    return printUnion(type);
  } else if (type instanceof _definition.GraphQLEnumType) {
    return printEnum(type);
  }
  (0, _invariant2.default)(type instanceof _definition.GraphQLInputObjectType);
  return printInputObject(type);
}

function printScalar(type) {
  return 'scalar ' + type.name;
}

function printObject(type) {
  var interfaces = type.getInterfaces();
  var implementedInterfaces = interfaces.length ? ' implements ' + interfaces.map(function (i) {
    return i.name;
  }).join(', ') : '';
  return 'type ' + type.name + implementedInterfaces + ' {\n' + printFields(type) + '\n' + '}';
}

function printInterface(type) {
  return 'interface ' + type.name + ' {\n' + printFields(type) + '\n' + '}';
}

function printUnion(type) {
  return 'union ' + type.name + ' = ' + type.getTypes().join(' | ');
}

function printEnum(type) {
  var values = type.getValues();
  return 'enum ' + type.name + ' {\n' + values.map(function (v) {
    return '  ' + v.name + printDeprecated(v);
  }).join('\n') + '\n' + '}';
}

function printInputObject(type) {
  var fieldMap = type.getFields();
  var fields = Object.keys(fieldMap).map(function (fieldName) {
    return fieldMap[fieldName];
  });
  return 'input ' + type.name + ' {\n' + fields.map(function (f) {
    return '  ' + printInputValue(f);
  }).join('\n') + '\n' + '}';
}

function printFields(type) {
  var fieldMap = type.getFields();
  var fields = Object.keys(fieldMap).map(function (fieldName) {
    return fieldMap[fieldName];
  });
  return fields.map(function (f) {
    return '  ' + f.name + printArgs(f) + ': ' + String(f.type) + printDeprecated(f);
  }).join('\n');
}

function printDeprecated(fieldOrEnumVal) {
  var reason = fieldOrEnumVal.deprecationReason;
  if ((0, _isNullish2.default)(reason)) {
    return '';
  }
  if (reason === '' || reason === _directives.DEFAULT_DEPRECATION_REASON) {
    return ' @deprecated';
  }
  return ' @deprecated(reason: ' + (0, _printer.print)((0, _astFromValue.astFromValue)(reason, _scalars.GraphQLString)) + ')';
}

function printArgs(fieldOrDirectives) {
  if (fieldOrDirectives.args.length === 0) {
    return '';
  }
  return '(' + fieldOrDirectives.args.map(printInputValue).join(', ') + ')';
}

function printInputValue(arg) {
  var argDecl = arg.name + ': ' + String(arg.type);
  if (!(0, _isNullish2.default)(arg.defaultValue)) {
    argDecl += ' = ' + (0, _printer.print)((0, _astFromValue.astFromValue)(arg.defaultValue, arg.type));
  }
  return argDecl;
}

function printDirective(directive) {
  return 'directive @' + directive.name + printArgs(directive) + ' on ' + directive.locations.join(' | ');
}

function printFineSchema(schema) {
  var directiveFilter = arguments.length <= 1 || arguments[1] === undefined ? function (n) {
    return !isSpecDirective(n);
  } : arguments[1];

  var directives = schema.getDirectives().filter(function (directive) {
    return directiveFilter(directive.name);
  });
  var typeMap = schema.getTypeMap();
  var orderedNames = getOrderedNamesBySchema(schema);
  var types = orderedNames.map(function (orderedName) {
    return typeMap[orderedName];
  });
  return [directives.map(printDirective)].concat(types.map(printType), printSchemaDefinition(schema)).join('\n\n') + '\n';
}

function getOrderedNamesBySchema(schema) {
  var typeMap = schema.getTypeMap();
  var rootQuery = schema.getQueryType();
  var definedTypeNames = Object.keys(typeMap).filter(isDefinedType);

  // use a big number 999999 to save some condition operator ~_~
  // todo should modify the magic 999999
  var typeNamesMap = arrayToMap(definedTypeNames, 99999);
  // give each type used by 'Query' a level number
  var queryMaps = levelTypeNames(rootQuery.name, typeNamesMap, schema);
  var unLeveledNamesMap = queryMaps.unLeveledNamesMap;
  var leveledNamesMap = queryMaps.leveledNamesMap;
  var orderedNames = flatNamesMapToArray(leveledNamesMap);

  var rootMutation = schema.getMutationType();
  if (rootMutation) {
    // give level number to the rest unLeveled type
    // which used by Mutations
    var restNamesMap = levelTypeNames(rootMutation.name, unLeveledNamesMap, schema);
    var orderedMutations = flatNamesMapToArray(restNamesMap.leveledNamesMap);

    orderedNames = [].concat(_toConsumableArray(orderedNames), orderedMutations);
    unLeveledNamesMap = restNamesMap.unLeveledNamesMap;
  }

  // todo throw a error .. should have none unknown type
  var theNamesIDontKnown = flatNamesMapToArray(unLeveledNamesMap);
  if (theNamesIDontKnown.length > 0) {
    orderedNames = [].concat(theNamesIDontKnown, _toConsumableArray(orderedNames));
  }
  return orderedNames;
}

function flatNamesMapToArray(leveledNamesMap) {
  var levelToNamesMap = flipMap(leveledNamesMap);
  var nameLevels = Array.from(levelToNamesMap.keys());
  nameLevels.sort(function (pre, next) {
    return next - pre;
  });
  var orderedNames = [];
  var _iteratorNormalCompletion = true;
  var _didIteratorError = false;
  var _iteratorError = undefined;

  try {
    for (var _iterator = nameLevels[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
      var level = _step.value;

      var levelNames = levelToNamesMap.get(level);
      if (levelNames) {
        // sort the same level names . to get a certainly order.
        levelNames.sort(function (name1, name2) {
          return name1.localeCompare(name2);
        });
        orderedNames = orderedNames.concat(levelNames);
      } else {
        throw new Error('printFineSchema.getOrderedNamesFromMap:\n      level[' + level + '] have no names,it should have');
      }
    }
  } catch (err) {
    _didIteratorError = true;
    _iteratorError = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion && _iterator.return) {
        _iterator.return();
      }
    } finally {
      if (_didIteratorError) {
        throw _iteratorError;
      }
    }
  }

  return orderedNames;
}

// calculate level values for each type names by their reference to each other
function levelTypeNames(rootName, namesMapToBeLeveled, schema) {
  var typeMap = schema.getTypeMap();
  var unLeveledNamesMap = new Map(namesMapToBeLeveled);
  var leveledNamesMap = new Map();
  // use a map to watch circle ref,Depth-first search
  var circleRef = new Map();

  unLeveledNamesMap.delete(rootName);
  leveledNamesMap.set(rootName, 0);
  _levelTypeNames(rootName, 1);
  function _levelTypeNames(thisName, childLevel) {
    var childrenNames = getRefedTypes(typeMap[thisName]);
    var _iteratorNormalCompletion2 = true;
    var _didIteratorError2 = false;
    var _iteratorError2 = undefined;

    try {
      for (var _iterator2 = childrenNames[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
        var childName = _step2.value;

        var currentLevel = leveledNamesMap.get(childName);
        if ( // meet a circle ref,skip
        circleRef.get(childName) ||
        // this type is not belong to current process,skip
        namesMapToBeLeveled.get(childName) === undefined ||
        //  if [the level of leveled Name] >= [current level]
        // must skip,level is always up~ no downgrade
        currentLevel && currentLevel >= childLevel) {
          continue;
        }
        circleRef.set(childName, childLevel);

        leveledNamesMap.set(childName, childLevel);
        unLeveledNamesMap.delete(childName);
        _levelTypeNames(childName, childLevel + 1);

        circleRef.delete(childName);
      }
    } catch (err) {
      _didIteratorError2 = true;
      _iteratorError2 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return();
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2;
        }
      }
    }
  }

  return { unLeveledNamesMap: unLeveledNamesMap, leveledNamesMap: leveledNamesMap };
}

// always return an array ,if get none,just return []
// three sources of reference from a type.
// field itself, args of a fields,interface
function getRefedTypes(type) {
  var refedTypeNames = [];
  if (!isDefinedType(type.name) ||
  // as i known ~_~,if there is no Fields
  // this type can not ref other types inside
  !(type.getFields instanceof Function)) {
    return refedTypeNames;
  }

  var fields = type.getFields();
  // 1/2 get refed type name from fields
  Object.keys(fields).map(function (fieldKey) {
    return fields[fieldKey];
  }).filter(function (field) {
    return isDefinedType(getTypeName(field.type));
  }).map(function (field) {
    refedTypeNames = refedTypeNames.concat(
    // 1. get type name from args of a field
    // in javascript, can not use instanceof to check a String type!
    // must use typeof!
    field.args.map(function (arg) {
      return getDefinedTypeNameByType(arg.type);
    }).filter(function (value) {
      return typeof value === 'string';
    }),
    // 2. get type name from field itself
    getDefinedTypeNameByType(field.type) || []);
  });

  // 3. get type name from interfaces
  if (type.getInterfaces instanceof Function) {
    var _iteratorNormalCompletion3 = true;
    var _didIteratorError3 = false;
    var _iteratorError3 = undefined;

    try {
      for (var _iterator3 = type.getInterfaces()[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
        var interfaceType = _step3.value;

        refedTypeNames.push(interfaceType.name);
      }
    } catch (err) {
      _didIteratorError3 = true;
      _iteratorError3 = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return();
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3;
        }
      }
    }
  }
  return refedTypeNames;
}

function arrayToMap(_array, defaultValue) {
  var _map = new Map();
  var _iteratorNormalCompletion4 = true;
  var _didIteratorError4 = false;
  var _iteratorError4 = undefined;

  try {
    for (var _iterator4 = _array[Symbol.iterator](), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
      var v = _step4.value;

      _map.set(v, defaultValue);
    }
  } catch (err) {
    _didIteratorError4 = true;
    _iteratorError4 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion4 && _iterator4.return) {
        _iterator4.return();
      }
    } finally {
      if (_didIteratorError4) {
        throw _iteratorError4;
      }
    }
  }

  return _map;
}

function flipMap(_srcMap) {
  var _outMap = new Map();
  var _iteratorNormalCompletion5 = true;
  var _didIteratorError5 = false;
  var _iteratorError5 = undefined;

  try {
    for (var _iterator5 = _srcMap[Symbol.iterator](), _step5; !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done); _iteratorNormalCompletion5 = true) {
      var _step5$value = _slicedToArray(_step5.value, 2);

      var oldKey = _step5$value[0];
      var vToKey = _step5$value[1];

      var subArray = _outMap.get(vToKey);
      if (subArray) {
        subArray.push(oldKey);
      } else {
        _outMap.set(vToKey, [oldKey]);
      }
    }
  } catch (err) {
    _didIteratorError5 = true;
    _iteratorError5 = err;
  } finally {
    try {
      if (!_iteratorNormalCompletion5 && _iterator5.return) {
        _iterator5.return();
      }
    } finally {
      if (_didIteratorError5) {
        throw _iteratorError5;
      }
    }
  }

  return _outMap;
}

function getTypeName(type) {
  var typeString = type.constructor.name;
  var name = type.name;
  if (typeString === 'GraphQLNonNull' || typeString === 'GraphQLList') {
    name = getTypeName(type.ofType);
  }
  if (name === undefined && isDefinedType(type)) {
    // if still can not get name,
    // this type must be something i dont known ,throw to learn
    throw new Error('Unknown type its javascript class is\n      [ [' + type.constructor.name + '] ' + type.ofType.constructor.name + ']');
  }
  return name;
}

function getDefinedTypeNameByType(TypeObj) {
  var typeName = getTypeName(TypeObj);
  if (isDefinedType(typeName)) {
    return typeName;
  }
  return null;
}
//# sourceMappingURL=schemaPrinter.js.map
