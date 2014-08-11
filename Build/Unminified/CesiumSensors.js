/**
 * Cesium Sensors - https://github.com/AnalyticalGraphicsInc/cesium-sensors
 *
 * Copyright 2011-2014 Analytical Graphics Inc. and Cesium Contributors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * Portions licensed separately.
 * See https://github.com/AnalyticalGraphicsInc/cesium-sensors/blob/master/LICENSE.md for full licensing details.
 */
(function() {/**
 * @license almond 0.2.9 Copyright (c) 2011-2014, The Dojo Foundation All Rights Reserved.
 * Available via the MIT or new BSD license.
 * see: http://github.com/jrburke/almond for details
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*jslint sloppy: true */
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name && name.charAt(0) === ".") {
            //If have a base name, try to normalize against it,
            //otherwise, assume it is a top-level require that will
            //be relative to baseUrl in the end.
            if (baseName) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that "directory" and not name of the baseName's
                //module. For instance, baseName of "one/two/three", maps to
                //"one/two/three.js", but we want the directory, "one/two" for
                //this normalization.
                baseParts = baseParts.slice(0, baseParts.length - 1);
                name = name.split('/');
                lastIndex = name.length - 1;

                // Node .js allowance:
                if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                    name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
                }

                name = baseParts.concat(name);

                //start trimDots
                for (i = 0; i < name.length; i += 1) {
                    part = name[i];
                    if (part === ".") {
                        name.splice(i, 1);
                        i -= 1;
                    } else if (part === "..") {
                        if (i === 1 && (name[2] === '..' || name[0] === '..')) {
                            //End of the line. Keep at least one non-dot
                            //path segment at the front so it can be mapped
                            //correctly to disk. Otherwise, there is likely
                            //no path mapping for a path starting with '..'.
                            //This can still fail, but catches the most reasonable
                            //uses of ..
                            break;
                        } else if (i > 0) {
                            name.splice(i - 1, 2);
                            i -= 2;
                        }
                    }
                }
                //end trimDots

                name = name.join("/");
            } else if (name.indexOf('./') === 0) {
                // No baseName, so this is ID is resolved relative
                // to baseUrl, pull off the leading dot.
                name = name.substring(2);
            }
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            return req.apply(undef, aps.call(arguments, 0).concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relName) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relName));
            } else {
                name = normalize(name, relName);
            }
        } else {
            name = normalize(name, relName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relName);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, callback).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

/*global define*/
define('ConicSensorGraphics',[
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Event',
        'Cesium/DataSources/createPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic cone.
     *
     * @alias ConicSensorGraphics
     * @constructor
     */
    var ConicSensorGraphics = function() {
        this._minimumClockAngle = undefined;
        this._minimumClockAngleSubscription = undefined;
        this._maximumClockAngle = undefined;
        this._maximumClockAngleSubscription = undefined;
        this._innerHalfAngle = undefined;
        this._innerHalfAngleSubscription = undefined;
        this._outerHalfAngle = undefined;
        this._outerHalfAngleSubscription = undefined;
        this._lateralSurfaceMaterial = undefined;
        this._lateralSurfaceMaterialSubscription = undefined;
        this._intersectionColor = undefined;
        this._intersectionColorSubscription = undefined;
        this._intersectionWidth = undefined;
        this._intersectionWidthSubscription = undefined;
        this._showIntersection = undefined;
        this._showIntersectionSubscription = undefined;
        this._radius = undefined;
        this._radiusSubscription = undefined;
        this._show = undefined;
        this._showSubscription = undefined;
        this._definitionChanged = new Event();
    };

    defineProperties(ConicSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof ConicSensorGraphics.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's minimum clock angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        minimumClockAngle : createPropertyDescriptor('minimumClockAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's maximum clock angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        maximumClockAngle : createPropertyDescriptor('maximumClockAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's inner half-angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        innerHalfAngle : createPropertyDescriptor('innerHalfAngle'),

        /**
         * Gets or sets the numeric {@link Property} specifying the the cone's outer half-angle.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        outerHalfAngle : createPropertyDescriptor('outerHalfAngle'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the cone's appearance.
         * @memberof ConicSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the cone and other central bodies.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the cone's projection.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the cone.
         * @memberof ConicSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a ConicSensorGraphics instance.
     *
     * @param {ConicSensorGraphics} [result] The object onto which to store the result.
     * @returns {ConicSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    ConicSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new ConicSensorGraphics();
        }
        result.show = this.show;
        result.innerHalfAngle = this.innerHalfAngle;
        result.outerHalfAngle = this.outerHalfAngle;
        result.minimumClockAngle = this.minimumClockAngle;
        result.maximumClockAngle = this.maximumClockAngle;
        result.radius = this.radius;
        result.showIntersection = this.showIntersection;
        result.intersectionColor = this.intersectionColor;
        result.intersectionWidth = this.intersectionWidth;
        result.lateralSurfaceMaterial = this.lateralSurfaceMaterial;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     *
     * @param {ConicSensorGraphics} source The object to be merged into this object.
     */
    ConicSensorGraphics.prototype.merge = function(source) {
        
        this.show = defaultValue(this.show, source.show);
        this.innerHalfAngle = defaultValue(this.innerHalfAngle, source.innerHalfAngle);
        this.outerHalfAngle = defaultValue(this.outerHalfAngle, source.outerHalfAngle);
        this.minimumClockAngle = defaultValue(this.minimumClockAngle, source.minimumClockAngle);
        this.maximumClockAngle = defaultValue(this.maximumClockAngle, source.maximumClockAngle);
        this.radius = defaultValue(this.radius, source.radius);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return ConicSensorGraphics;
});
define('text',{load: function(id){throw new Error("Dynamic load not allowed: " + id);}});

define('text!CustomSensorVolumeFS.glsl',[],function () { return '#ifdef GL_OES_standard_derivatives\r\n    #extension GL_OES_standard_derivatives : enable\r\n#endif  \r\n\r\nuniform bool u_showIntersection;\r\nuniform bool u_showThroughEllipsoid;\r\n\r\nuniform float u_sensorRadius;\r\nuniform float u_normalDirection;\r\n\r\nvarying vec3 v_positionWC;\r\nvarying vec3 v_positionEC;\r\nvarying vec3 v_normalEC;\r\n\r\nvec4 getColor(float sensorRadius, vec3 pointEC)\r\n{\r\n    czm_materialInput materialInput;\r\n    \r\n    vec3 pointMC = (czm_inverseModelView * vec4(pointEC, 1.0)).xyz;                                \r\n    materialInput.st = sensor2dTextureCoordinates(sensorRadius, pointMC);   \r\n    materialInput.str = pointMC / sensorRadius;\r\n    \r\n    vec3 positionToEyeEC = -v_positionEC;\r\n    materialInput.positionToEyeEC = positionToEyeEC;\r\n    \r\n    vec3 normalEC = normalize(v_normalEC);\r\n    materialInput.normalEC = u_normalDirection * normalEC;\r\n    \r\n    czm_material material = czm_getMaterial(materialInput);\r\n    return mix(czm_phong(normalize(positionToEyeEC), material), vec4(material.diffuse, material.alpha), 0.4);\r\n}\r\n\r\nbool isOnBoundary(float value, float epsilon)\r\n{\r\n    float width = getIntersectionWidth();\r\n    float tolerance = width * epsilon;\r\n\r\n#ifdef GL_OES_standard_derivatives\r\n    float delta = max(abs(dFdx(value)), abs(dFdy(value)));\r\n    float pixels = width * delta;\r\n    float temp = abs(value);\r\n    // There are a couple things going on here.\r\n    // First we test the value at the current fragment to see if it is within the tolerance.\r\n    // We also want to check if the value of an adjacent pixel is within the tolerance,\r\n    // but we don\'t want to admit points that are obviously not on the surface.\r\n    // For example, if we are looking for "value" to be close to 0, but value is 1 and the adjacent value is 2,\r\n    // then the delta would be 1 and "temp - delta" would be "1 - 1" which is zero even though neither of\r\n    // the points is close to zero.\r\n    return temp < tolerance && temp < pixels || (delta < 10.0 * tolerance && temp - delta < tolerance && temp < pixels);\r\n#else\r\n    return abs(value) < tolerance;\r\n#endif\r\n}\r\n\r\nvec4 shade(bool isOnBoundary)\r\n{\r\n    if (u_showIntersection && isOnBoundary)\r\n    {\r\n        return getIntersectionColor();\r\n    }\r\n    return getColor(u_sensorRadius, v_positionEC);\r\n}\r\n\r\nfloat ellipsoidSurfaceFunction(czm_ellipsoid ellipsoid, vec3 point)\r\n{\r\n    vec3 scaled = ellipsoid.inverseRadii * point;\r\n    return dot(scaled, scaled) - 1.0;\r\n}\r\n\r\nvoid main()\r\n{\r\n    vec3 sensorVertexWC = czm_model[3].xyz;      // (0.0, 0.0, 0.0) in model coordinates\r\n    vec3 sensorVertexEC = czm_modelView[3].xyz;  // (0.0, 0.0, 0.0) in model coordinates\r\n\r\n    czm_ellipsoid ellipsoid = czm_getWgs84EllipsoidEC();\r\n    float ellipsoidValue = ellipsoidSurfaceFunction(ellipsoid, v_positionWC);\r\n\r\n    // Occluded by the ellipsoid?\r\n\tif (!u_showThroughEllipsoid)\r\n\t{\r\n\t    // Discard if in the ellipsoid    \r\n\t    // PERFORMANCE_IDEA: A coarse check for ellipsoid intersection could be done on the CPU first.\r\n\t    if (ellipsoidValue < 0.0)\r\n\t    {\r\n            discard;\r\n\t    }\r\n\r\n\t    // Discard if in the sensor\'s shadow\r\n\t    if (inSensorShadow(sensorVertexWC, ellipsoid, v_positionWC))\r\n\t    {\r\n\t        discard;\r\n\t    }\r\n    }\r\n\r\n    // Discard if not in the sensor\'s sphere\r\n    // PERFORMANCE_IDEA: We can omit this check if the radius is Number.POSITIVE_INFINITY.\r\n    if (distance(v_positionEC, sensorVertexEC) > u_sensorRadius)\r\n    {\r\n        discard;\r\n    }\r\n    \r\n    // Notes: Each surface functions should have an associated tolerance based on the floating point error.\r\n    bool isOnEllipsoid = isOnBoundary(ellipsoidValue, czm_epsilon3);\r\n    gl_FragColor = shade(isOnEllipsoid);\r\n}\r\n';});


define('text!CustomSensorVolumeVS.glsl',[],function () { return 'attribute vec4 position;\r\nattribute vec3 normal;\r\n\r\nvarying vec3 v_positionWC;\r\nvarying vec3 v_positionEC;\r\nvarying vec3 v_normalEC;\r\n\r\nvoid main()\r\n{\r\n    gl_Position = czm_modelViewProjection * position;\r\n    v_positionWC = (czm_model * position).xyz;\r\n    v_positionEC = (czm_modelView * position).xyz;\r\n    v_normalEC = czm_normal * normal;\r\n}';});


define('text!SensorVolume.glsl',[],function () { return 'uniform vec4 u_intersectionColor;\r\nuniform float u_intersectionWidth;\r\n\r\nbool inSensorShadow(vec3 coneVertexWC, czm_ellipsoid ellipsoidEC, vec3 pointWC)\r\n{\r\n    // Diagonal matrix from the unscaled ellipsoid space to the scaled space.    \r\n    vec3 D = ellipsoidEC.inverseRadii;\r\n\r\n    // Sensor vertex in the scaled ellipsoid space\r\n    vec3 q = D * coneVertexWC;\r\n    float qMagnitudeSquared = dot(q, q);\r\n    float test = qMagnitudeSquared - 1.0;\r\n    \r\n    // Sensor vertex to fragment vector in the ellipsoid\'s scaled space\r\n    vec3 temp = D * pointWC - q;\r\n    float d = dot(temp, q);\r\n    \r\n    // Behind silhouette plane and inside silhouette cone\r\n    return (d < -test) && (d / length(temp) < -sqrt(test));\r\n}\r\n\r\n///////////////////////////////////////////////////////////////////////////////\r\n\r\nvec4 getIntersectionColor()\r\n{\r\n    return u_intersectionColor;\r\n}\r\n\r\nfloat getIntersectionWidth()\r\n{\r\n    return u_intersectionWidth;\r\n}\r\n\r\nvec2 sensor2dTextureCoordinates(float sensorRadius, vec3 pointMC)\r\n{\r\n    // (s, t) both in the range [0, 1]\r\n    float t = pointMC.z / sensorRadius;\r\n    float s = 1.0 + (atan(pointMC.y, pointMC.x) / czm_twoPi);\r\n    s = s - floor(s);\r\n    \r\n    return vec2(s, t);\r\n}\r\n';});

/*global define*/
define('CustomSensorVolume',[
        'Cesium/Core/BoundingSphere',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/combine',
        'Cesium/Core/ComponentDatatype',
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Matrix4',
        'Cesium/Core/PrimitiveType',
        'Cesium/Renderer/BufferUsage',
        'Cesium/Renderer/createShaderSource',
        'Cesium/Renderer/DrawCommand',
        'text!./CustomSensorVolumeFS.glsl',
        'text!./CustomSensorVolumeVS.glsl',
        'text!./SensorVolume.glsl',
        'Cesium/Scene/BlendingState',
        'Cesium/Scene/CullFace',
        'Cesium/Scene/Material',
        'Cesium/Scene/Pass',
        'Cesium/Scene/SceneMode'
    ], function(
        BoundingSphere,
        Cartesian3,
        Color,
        combine,
        ComponentDatatype,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        Matrix4,
        PrimitiveType,
        BufferUsage,
        createShaderSource,
        DrawCommand,
        CustomSensorVolumeFS,
        CustomSensorVolumeVS,
        ShadersSensorVolume,
        BlendingState,
        CullFace,
        Material,
        Pass,
        SceneMode) {
    "use strict";

    var attributeLocations = {
        position : 0,
        normal : 1
    };

    var FAR = 5906376272000.0;  // distance from the Sun to Pluto in meters.

    /**
     * DOC_TBA
     *
     * @alias CustomSensorVolume
     * @constructor
     */
    var CustomSensorVolume = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        this._pickId = undefined;
        this._pickPrimitive = defaultValue(options._pickPrimitive, this);

        this._frontFaceColorCommand = new DrawCommand();
        this._backFaceColorCommand = new DrawCommand();
        this._pickCommand = new DrawCommand();

        this._boundingSphere = new BoundingSphere();
        this._boundingSphereWC = new BoundingSphere();

        this._frontFaceColorCommand.primitiveType = PrimitiveType.TRIANGLES;
        this._frontFaceColorCommand.boundingVolume = this._boundingSphereWC;
        this._frontFaceColorCommand.owner = this;

        this._backFaceColorCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
        this._backFaceColorCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
        this._backFaceColorCommand.owner = this;

        this._pickCommand.primitiveType = this._frontFaceColorCommand.primitiveType;
        this._pickCommand.boundingVolume = this._frontFaceColorCommand.boundingVolume;
        this._pickCommand.owner = this;

        /**
         * <code>true</code> if this sensor will be shown; otherwise, <code>false</code>
         *
         * @type {Boolean}
         * @default true
         */
        this.show = defaultValue(options.show, true);

        /**
         * When <code>true</code>, a polyline is shown where the sensor outline intersections the globe.
         *
         * @type {Boolean}
         *
         * @default true
         *
         * @see CustomSensorVolume#intersectionColor
         */
        this.showIntersection = defaultValue(options.showIntersection, true);

        /**
         * <p>
         * Determines if a sensor intersecting the ellipsoid is drawn through the ellipsoid and potentially out
         * to the other side, or if the part of the sensor intersecting the ellipsoid stops at the ellipsoid.
         * </p>
         *
         * @type {Boolean}
         * @default false
         */
        this.showThroughEllipsoid = defaultValue(options.showThroughEllipsoid, false);
        this._showThroughEllipsoid = this.showThroughEllipsoid;

        /**
         * The 4x4 transformation matrix that transforms this sensor from model to world coordinates.  In it's model
         * coordinates, the sensor's principal direction is along the positive z-axis.  The clock angle, sometimes
         * called azimuth, is the angle in the sensor's X-Y plane measured from the positive X-axis toward the positive
         * Y-axis.  The cone angle, sometimes called elevation, is the angle out of the X-Y plane along the positive Z-axis.
         * <br /><br />
         * <div align='center'>
         * <img src='images/CustomSensorVolume.setModelMatrix.png' /><br />
         * Model coordinate system for a custom sensor
         * </div>
         *
         * @type {Matrix4}
         * @default {@link Matrix4.IDENTITY}
         *
         * @example
         * // The sensor's vertex is located on the surface at -75.59777 degrees longitude and 40.03883 degrees latitude.
         * // The sensor's opens upward, along the surface normal.
         * var center = Cesium.Cartesian3.fromDegrees(-75.59777, 40.03883);
         * sensor.modelMatrix = Cesium.Transforms.eastNorthUpToFixedFrame(center);
         */
        this.modelMatrix = Matrix4.clone(defaultValue(options.modelMatrix, Matrix4.IDENTITY));
        this._modelMatrix = new Matrix4();

        /**
         * DOC_TBA
         *
         * @type {Number}
         * @default {@link Number.POSITIVE_INFINITY}
         */
        this.radius = defaultValue(options.radius, Number.POSITIVE_INFINITY);

        this._directions = undefined;
        this._directionsDirty = false;
        this.directions = defined(options.directions) ? options.directions : [];

        /**
         * The surface appearance of the sensor.  This can be one of several built-in {@link Material} objects or a custom material, scripted with
         * {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}.
         * <p>
         * The default material is <code>Material.ColorType</code>.
         * </p>
         *
         * @type {Material}
         * @default Material.fromType(Material.ColorType)
         *
         * @see {@link https://github.com/AnalyticalGraphicsInc/cesium/wiki/Fabric|Fabric}
         *
         * @example
         * // 1. Change the color of the default material to yellow
         * sensor.lateralSurfaceMaterial.uniforms.color = new Cesium.Color(1.0, 1.0, 0.0, 1.0);
         *
         * // 2. Change material to horizontal stripes
         * sensor.lateralSurfaceMaterial = Cesium.Material.fromType(Material.StripeType);
         */
        this.lateralSurfaceMaterial = defined(options.lateralSurfaceMaterial) ? options.lateralSurfaceMaterial : Material.fromType(Material.ColorType);
        this._lateralSurfaceMaterial = undefined;
        this._translucent = undefined;

        /**
         * The color of the polyline where the sensor outline intersects the globe.  The default is {@link Color.WHITE}.
         *
         * @type {Color}
         * @default {@link Color.WHITE}
         *
         * @see CustomSensorVolume#showIntersection
         */
        this.intersectionColor = Color.clone(defaultValue(options.intersectionColor, Color.WHITE));

        /**
         * The approximate pixel width of the polyline where the sensor outline intersects the globe.  The default is 5.0.
         *
         * @type {Number}
         * @default 5.0
         *
         * @see CustomSensorVolume#showIntersection
         */
        this.intersectionWidth = defaultValue(options.intersectionWidth, 5.0);

        /**
         * User-defined object returned when the sensors is picked.
         *
         * @type Object
         *
         * @default undefined
         *
         * @see Scene#pick
         */
        this.id = options.id;
        this._id = undefined;

        var that = this;
        this._uniforms = {
            u_showThroughEllipsoid : function() {
                return that.showThroughEllipsoid;
            },
            u_showIntersection : function() {
                return that.showIntersection;
            },
            u_sensorRadius : function() {
                return isFinite(that.radius) ? that.radius : FAR;
            },
            u_intersectionColor : function() {
                return that.intersectionColor;
            },
            u_intersectionWidth : function() {
                return that.intersectionWidth;
            },
            u_normalDirection : function() {
                return 1.0;
            }
        };

        this._mode = SceneMode.SCENE3D;
    };

    defineProperties(CustomSensorVolume.prototype, {
        directions : {
            get : function() {
                return this._directions;
            },
            set : function(value) {
                this._directions = value;
                this._directionsDirty = true;
            }
        }
    });

    var n0Scratch = new Cartesian3();
    var n1Scratch = new Cartesian3();
    var n2Scratch = new Cartesian3();
    function computePositions(customSensorVolume) {
        var directions = customSensorVolume._directions;
        var length = directions.length;
        var positions = new Float32Array(3 * length);
        var r = isFinite(customSensorVolume.radius) ? customSensorVolume.radius : FAR;

        var boundingVolumePositions = [Cartesian3.ZERO];

        for ( var i = length - 2, j = length - 1, k = 0; k < length; i = j++, j = k++) {
            // PERFORMANCE_IDEA:  We can avoid redundant operations for adjacent edges.
            var n0 = Cartesian3.fromSpherical(directions[i], n0Scratch);
            var n1 = Cartesian3.fromSpherical(directions[j], n1Scratch);
            var n2 = Cartesian3.fromSpherical(directions[k], n2Scratch);

            // Extend position so the volume encompasses the sensor's radius.
            var theta = Math.max(Cartesian3.angleBetween(n0, n1), Cartesian3.angleBetween(n1, n2));
            var distance = r / Math.cos(theta * 0.5);
            var p = Cartesian3.multiplyByScalar(n1, distance, new Cartesian3());

            positions[(j * 3)] = p.x;
            positions[(j * 3) + 1] = p.y;
            positions[(j * 3) + 2] = p.z;

            boundingVolumePositions.push(p);
        }

        BoundingSphere.fromPoints(boundingVolumePositions, customSensorVolume._boundingSphere);

        return positions;
    }

    var nScratch = new Cartesian3();
    function createVertexArray(customSensorVolume, context) {
        var positions = computePositions(customSensorVolume);

        var length = customSensorVolume._directions.length;
        var vertices = new Float32Array(2 * 3 * 3 * length);

        var k = 0;
        for ( var i = length - 1, j = 0; j < length; i = j++) {
            var p0 = new Cartesian3(positions[(i * 3)], positions[(i * 3) + 1], positions[(i * 3) + 2]);
            var p1 = new Cartesian3(positions[(j * 3)], positions[(j * 3) + 1], positions[(j * 3) + 2]);
            var n = Cartesian3.normalize(Cartesian3.cross(p1, p0, nScratch), nScratch); // Per-face normals

            vertices[k++] = 0.0; // Sensor vertex
            vertices[k++] = 0.0;
            vertices[k++] = 0.0;
            vertices[k++] = n.x;
            vertices[k++] = n.y;
            vertices[k++] = n.z;

            vertices[k++] = p1.x;
            vertices[k++] = p1.y;
            vertices[k++] = p1.z;
            vertices[k++] = n.x;
            vertices[k++] = n.y;
            vertices[k++] = n.z;

            vertices[k++] = p0.x;
            vertices[k++] = p0.y;
            vertices[k++] = p0.z;
            vertices[k++] = n.x;
            vertices[k++] = n.y;
            vertices[k++] = n.z;
        }

        var vertexBuffer = context.createVertexBuffer(new Float32Array(vertices), BufferUsage.STATIC_DRAW);
        var stride = 2 * 3 * Float32Array.BYTES_PER_ELEMENT;

        var attributes = [{
            index : attributeLocations.position,
            vertexBuffer : vertexBuffer,
            componentsPerAttribute : 3,
            componentDatatype : ComponentDatatype.FLOAT,
            offsetInBytes : 0,
            strideInBytes : stride
        }, {
            index : attributeLocations.normal,
            vertexBuffer : vertexBuffer,
            componentsPerAttribute : 3,
            componentDatatype : ComponentDatatype.FLOAT,
            offsetInBytes : 3 * Float32Array.BYTES_PER_ELEMENT,
            strideInBytes : stride
        }];

        return context.createVertexArray(attributes);
    }

    /**
     * Called when {@link Viewer} or {@link CesiumWidget} render the scene to
     * get the draw commands needed to render this primitive.
     * <p>
     * Do not call this function directly.  This is documented just to
     * list the exceptions that may be propagated when the scene is rendered:
     * </p>
     *
     * @exception {DeveloperError} this.radius must be greater than or equal to zero.
     * @exception {DeveloperError} this.lateralSurfaceMaterial must be defined.
     */
    CustomSensorVolume.prototype.update = function(context, frameState, commandList) {
        this._mode = frameState.mode;
        if (!this.show || this._mode !== SceneMode.SCENE3D) {
            return;
        }

        
        var translucent = this.lateralSurfaceMaterial.isTranslucent();

        // Initial render state creation
        if ((this._showThroughEllipsoid !== this.showThroughEllipsoid) ||
                (!defined(this._frontFaceColorCommand.renderState)) ||
                (this._translucent !== translucent)) {

            this._showThroughEllipsoid = this.showThroughEllipsoid;
            this._translucent = translucent;

            var rs;

            if (translucent) {
                rs = context.createRenderState({
                    depthTest : {
                        // This would be better served by depth testing with a depth buffer that does not
                        // include the ellipsoid depth - or a g-buffer containing an ellipsoid mask
                        // so we can selectively depth test.
                        enabled : !this.showThroughEllipsoid
                    },
                    depthMask : false,
                    blending : BlendingState.ALPHA_BLEND,
                    cull : {
                        enabled : true,
                        face : CullFace.BACK
                    }
                });

                this._frontFaceColorCommand.renderState = rs;
                this._frontFaceColorCommand.pass = Pass.TRANSLUCENT;

                rs = context.createRenderState({
                    depthTest : {
                        enabled : !this.showThroughEllipsoid
                    },
                    depthMask : false,
                    blending : BlendingState.ALPHA_BLEND,
                    cull : {
                        enabled : true,
                        face : CullFace.FRONT
                    }
                });

                this._backFaceColorCommand.renderState = rs;
                this._backFaceColorCommand.pass = Pass.TRANSLUCENT;

                rs = context.createRenderState({
                    depthTest : {
                        enabled : !this.showThroughEllipsoid
                    },
                    depthMask : false,
                    blending : BlendingState.ALPHA_BLEND
                });
                this._pickCommand.renderState = rs;
            } else {
                rs = context.createRenderState({
                    depthTest : {
                        enabled : true
                    },
                    depthMask : true
                });
                this._frontFaceColorCommand.renderState = rs;
                this._frontFaceColorCommand.pass = Pass.OPAQUE;

                rs = context.createRenderState({
                    depthTest : {
                        enabled : true
                    },
                    depthMask : true
                });
                this._pickCommand.renderState = rs;
            }
        }

        // Recreate vertex buffer when directions change
        var directionsChanged = this._directionsDirty;
        if (directionsChanged) {
            this._directionsDirty = false;
            this._va = this._va && this._va.destroy();

            var directions = this._directions;
            if (directions && (directions.length >= 3)) {
                this._frontFaceColorCommand.vertexArray = createVertexArray(this, context);
                this._backFaceColorCommand.vertexArray = this._frontFaceColorCommand.vertexArray;
                this._pickCommand.vertexArray = this._frontFaceColorCommand.vertexArray;
            }
        }

        if (!defined(this._frontFaceColorCommand.vertexArray)) {
            return;
        }

        var pass = frameState.passes;

        var modelMatrixChanged = !Matrix4.equals(this.modelMatrix, this._modelMatrix);
        if (modelMatrixChanged) {
            Matrix4.clone(this.modelMatrix, this._modelMatrix);
        }

        if (directionsChanged || modelMatrixChanged) {
            BoundingSphere.transform(this._boundingSphere, this.modelMatrix, this._boundingSphereWC);
        }

        this._frontFaceColorCommand.modelMatrix = this.modelMatrix;
        this._backFaceColorCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;
        this._pickCommand.modelMatrix = this._frontFaceColorCommand.modelMatrix;

        var materialChanged = this._lateralSurfaceMaterial !== this.lateralSurfaceMaterial;
        this._lateralSurfaceMaterial = this.lateralSurfaceMaterial;
        this._lateralSurfaceMaterial.update(context);

        if (pass.render) {
            var frontFaceColorCommand = this._frontFaceColorCommand;
            var backFaceColorCommand = this._backFaceColorCommand;

            // Recompile shader when material changes
            if (materialChanged || !defined(frontFaceColorCommand.shaderProgram)) {
                var fsSource = createShaderSource({
                    sources : [ShadersSensorVolume, this._lateralSurfaceMaterial.shaderSource, CustomSensorVolumeFS]
                });

                frontFaceColorCommand.shaderProgram = context.replaceShaderProgram(
                        frontFaceColorCommand.shaderProgram, CustomSensorVolumeVS, fsSource, attributeLocations);
                frontFaceColorCommand.uniformMap = combine(this._uniforms, this._lateralSurfaceMaterial._uniforms);

                backFaceColorCommand.shaderProgram = frontFaceColorCommand.shaderProgram;
                backFaceColorCommand.uniformMap = combine(this._uniforms, this._lateralSurfaceMaterial._uniforms);
                backFaceColorCommand.uniformMap.u_normalDirection = function() {
                    return -1.0;
                };
            }

            if (translucent) {
                commandList.push(this._backFaceColorCommand, this._frontFaceColorCommand);
            } else {
                commandList.push(this._frontFaceColorCommand);
            }
        }

        if (pass.pick) {
            var pickCommand = this._pickCommand;

            if (!defined(this._pickId) || (this._id !== this.id)) {
                this._id = this.id;
                this._pickId = this._pickId && this._pickId.destroy();
                this._pickId = context.createPickId({
                    primitive : this._pickPrimitive,
                    id : this.id
                });
            }

            // Recompile shader when material changes
            if (materialChanged || !defined(pickCommand.shaderProgram)) {
                var pickFS = createShaderSource({
                    sources : [ShadersSensorVolume, this._lateralSurfaceMaterial.shaderSource, CustomSensorVolumeFS],
                    pickColorQualifier : 'uniform'
                });

                pickCommand.shaderProgram = context.replaceShaderProgram(
                    pickCommand.shaderProgram, CustomSensorVolumeVS, pickFS, attributeLocations);

                var that = this;
                var uniforms = {
                    czm_pickColor : function() {
                        return that._pickId.color;
                    }
                };
                pickCommand.uniformMap = combine(combine(this._uniforms, this._lateralSurfaceMaterial._uniforms), uniforms);
            }

            pickCommand.pass = translucent ? Pass.TRANSLUCENT : Pass.OPAQUE;
            commandList.push(pickCommand);
        }
    };

    /**
     * DOC_TBA
     */
    CustomSensorVolume.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * DOC_TBA
     */
    CustomSensorVolume.prototype.destroy = function() {
        this._frontFaceColorCommand.vertexArray = this._frontFaceColorCommand.vertexArray && this._frontFaceColorCommand.vertexArray.destroy();
        this._frontFaceColorCommand.shaderProgram = this._frontFaceColorCommand.shaderProgram && this._frontFaceColorCommand.shaderProgram.destroy();
        this._pickCommand.shaderProgram = this._pickCommand.shaderProgram && this._pickCommand.shaderProgram.destroy();
        this._pickId = this._pickId && this._pickId.destroy();
        return destroyObject(this);
    };

    return CustomSensorVolume;
});

/*global define*/
define('ConicSensorVisualizer',[
        'Cesium/Core/AssociativeArray',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Math',
        'Cesium/Core/Matrix3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/Quaternion',
        'Cesium/Core/Spherical',
        './CustomSensorVolume',
        'Cesium/DataSources/MaterialProperty',
        'Cesium/DataSources/Property'
    ], function(
        AssociativeArray,
        Cartesian3,
        Color,
        defined,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Matrix3,
        Matrix4,
        Quaternion,
        Spherical,
        CustomSensorVolume,
        MaterialProperty,
        Property) {
    "use strict";

    var defaultIntersectionColor = Color.WHITE;
    var defaultIntersectionWidth = 1.0;
    var defaultRadius = Number.POSITIVE_INFINITY;

    var matrix3Scratch = new Matrix3();
    var cachedPosition = new Cartesian3();
    var cachedOrientation = new Quaternion();

    function assignSpherical(index, array, clock, cone) {
        var spherical = array[index];
        if (!defined(spherical)) {
            array[index] = spherical = new Spherical();
        }
        spherical.clock = clock;
        spherical.cone = cone;
        spherical.magnitude = 1.0;
    }

    function computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle) {
        var directions = primitive.directions;
        var angle;
        var i = 0;
        var angleStep = CesiumMath.toRadians(2.0);
        if (minimumClockAngle === 0.0 && maximumClockAngle === CesiumMath.TWO_PI) {
            // No clock angle limits, so this is just a circle.
            // There might be a hole but we're ignoring it for now.
            for (angle = 0.0; angle < CesiumMath.TWO_PI; angle += angleStep) {
                assignSpherical(i++, directions, angle, outerHalfAngle);
            }
        } else {
            // There are clock angle limits.
            for (angle = minimumClockAngle; angle < maximumClockAngle; angle += angleStep) {
                assignSpherical(i++, directions, angle, outerHalfAngle);
            }
            assignSpherical(i++, directions, maximumClockAngle, outerHalfAngle);
            if (innerHalfAngle) {
                for (angle = maximumClockAngle; angle > minimumClockAngle; angle -= angleStep) {
                    assignSpherical(i++, directions, angle, innerHalfAngle);
                }
                assignSpherical(i++, directions, minimumClockAngle, innerHalfAngle);
            } else {
                assignSpherical(i++, directions, maximumClockAngle, 0.0);
            }
        }
        directions.length = i;
        primitive.directions = directions;
    }

    /**
     * A {@link Visualizer} which maps {@link Entity#conicSensor} to a {@link ConicSensor}.
     * @alias ConicSensorVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {EntityCollection} entityCollection The entityCollection to visualize.
     */
    var ConicSensorVisualizer = function(scene, entityCollection) {
        
        entityCollection.collectionChanged.addEventListener(ConicSensorVisualizer.prototype._onCollectionChanged, this);

        this._scene = scene;
        this._primitives = scene.primitives;
        this._entityCollection = entityCollection;
        this._hash = {};
        this._entitiesToVisualize = new AssociativeArray();

        this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
    };

    /**
     * Updates the primitives created by this visualizer to match their
     * Entity counterpart at the given time.
     *
     * @param {JulianDate} time The time to update to.
     * @returns {Boolean} This function always returns true.
     */
    ConicSensorVisualizer.prototype.update = function(time) {
        
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;

        for (var i = 0, len = entities.length; i < len; i++) {
            var entity = entities[i];
            var conicSensorGraphics = entity._conicSensor;

            var position;
            var orientation;
            var data = hash[entity.id];
            var show = entity.isAvailable(time) && Property.getValueOrDefault(conicSensorGraphics._show, time, true);

            if (show) {
                position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
                orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
                show = defined(position) && defined(orientation);
            }

            if (!show) {
                //don't bother creating or updating anything else
                if (defined(data)) {
                    data.primitive.show = false;
                }
                continue;
            }

            var primitive = defined(data) ? data.primitive : undefined;
            if (!defined(primitive)) {
                primitive = new CustomSensorVolume();
                primitive.id = entity;
                primitives.add(primitive);

                data = {
                    primitive : primitive,
                    position : undefined,
                    orientation : undefined,
                    minimumClockAngle : undefined,
                    maximumClockAngle : undefined,
                    innerHalfAngle : undefined,
                    outerHalfAngle : undefined
                };
                hash[entity.id] = data;
            }

            if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
                Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
                data.position = Cartesian3.clone(position, data.position);
                data.orientation = Quaternion.clone(orientation, data.orientation);
            }

            primitive.show = true;
            var minimumClockAngle = Property.getValueOrDefault(conicSensorGraphics._minimumClockAngle, time, 0);
            var maximumClockAngle = Property.getValueOrDefault(conicSensorGraphics._maximumClockAngle, time, CesiumMath.TWO_PI);
            var innerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._innerHalfAngle, time, 0);
            var outerHalfAngle = Property.getValueOrDefault(conicSensorGraphics._outerHalfAngle, time, Math.PI);

            if (minimumClockAngle !== data.minimumClockAngle ||
                maximumClockAngle !== data.maximumClockAngle ||
                innerHalfAngle !== data.innerHalfAngle ||
                outerHalfAngle !== data.outerHalfAngle) {

                computeDirections(primitive, minimumClockAngle, maximumClockAngle, innerHalfAngle, outerHalfAngle);
                data.innerHalfAngle = innerHalfAngle;
                data.maximumClockAngle = maximumClockAngle;
                data.outerHalfAngle = outerHalfAngle;
                data.minimumClockAngle = minimumClockAngle;
            }

            primitive.radius = Property.getValueOrDefault(conicSensorGraphics._radius, time, defaultRadius);
            primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, conicSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
            primitive.intersectionColor = Property.getValueOrClonedDefault(conicSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
            primitive.intersectionWidth = Property.getValueOrDefault(conicSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    ConicSensorVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    ConicSensorVisualizer.prototype.destroy = function() {
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;
        for (var i = entities.length - 1; i > -1; i--) {
            removePrimitive(entities[i], hash, primitives);
        }
        return destroyObject(this);
    };

    /**
     * @private
     */
    ConicSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
        var i;
        var entity;
        var entities = this._entitiesToVisualize;
        var hash = this._hash;
        var primitives = this._primitives;

        for (i = added.length - 1; i > -1; i--) {
            entity = added[i];
            if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            }
        }

        for (i = changed.length - 1; i > -1; i--) {
            entity = changed[i];
            if (defined(entity._conicSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            } else {
                removePrimitive(entity, hash, primitives);
                entities.remove(entity.id);
            }
        }

        for (i = removed.length - 1; i > -1; i--) {
            entity = removed[i];
            removePrimitive(entity, hash, primitives);
            entities.remove(entity.id);
        }
    };

    function removePrimitive(entity, hash, primitives) {
        var data = hash[entity.id];
        if (defined(data)) {
            var primitive = data.primitive;
            primitives.remove(primitive);
            if (!primitive.isDestroyed()) {
                primitive.destroy();
            }
            delete hash[entity.id];
        }
    }

    return ConicSensorVisualizer;
});

/*global define*/
define('CustomPatternSensorGraphics',[
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Event',
        'Cesium/DataSources/createPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic custom patterned sensor.
     *
     * @alias CustomPatternSensorGraphics
     * @constructor
     */
    var CustomPatternSensorGraphics = function() {
        this._directions = undefined;
        this._directionsSubscription = undefined;

        this._lateralSurfaceMaterial = undefined;
        this._lateralSurfaceMaterialSubscription = undefined;

        this._intersectionColor = undefined;
        this._intersectionColorSubscription = undefined;
        this._intersectionWidth = undefined;
        this._intersectionWidthSubscription = undefined;
        this._showIntersection = undefined;
        this._showIntersectionSubscription = undefined;
        this._radius = undefined;
        this._radiusSubscription = undefined;
        this._show = undefined;
        this._showSubscription = undefined;
        this._definitionChanged = new Event();
    };

    defineProperties(CustomPatternSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof CustomPatternSensorGraphics.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },

        /**
         * A {@link Property} which returns an array of {@link Spherical} instances representing the sensor's projection.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        directions : createPropertyDescriptor('directions'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the sensor's appearance.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the sensor and other central bodies.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the sensor's projection.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the sensor.
         * @memberof CustomPatternSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a CustomPatternSensorGraphics instance.
     *
     * @param {CustomPatternSensorGraphics} [result] The object onto which to store the result.
     * @returns {CustomPatternSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    CustomPatternSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new CustomPatternSensorGraphics();
        }
        result.directions = this.directions;
        result.radius = this.radius;
        result.show = this.show;
        result.showIntersection = this.showIntersection;
        result.intersectionColor = this.intersectionColor;
        result.intersectionWidth = this.intersectionWidth;
        result.lateralSurfaceMaterial = this.lateralSurfaceMaterial;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     *
     * @param {CustomPatternSensorGraphics} source The object to be merged into this object.
     */
    CustomPatternSensorGraphics.prototype.merge = function(source) {
        
        this.directions = defaultValue(this.directions, source.directions);
        this.radius = defaultValue(this.radius, source.radius);
        this.show = defaultValue(this.show, source.show);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return CustomPatternSensorGraphics;
});
/*global define*/
define('CustomPatternSensorVisualizer',[
        'Cesium/Core/AssociativeArray',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Matrix3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/Quaternion',
        './CustomSensorVolume',
        'Cesium/DataSources/MaterialProperty',
        'Cesium/DataSources/Property'
    ], function(
        AssociativeArray,
        Cartesian3,
        Color,
        defined,
        destroyObject,
        DeveloperError,
        Matrix3,
        Matrix4,
        Quaternion,
        CustomSensorVolume,
        MaterialProperty,
        Property) {
    "use strict";

    var defaultIntersectionColor = Color.WHITE;
    var defaultIntersectionWidth = 1.0;
    var defaultRadius = Number.POSITIVE_INFINITY;

    var matrix3Scratch = new Matrix3();
    var cachedPosition = new Cartesian3();
    var cachedOrientation = new Quaternion();

    /**
     * A {@link Visualizer} which maps {@link Entity#customPatternSensor} to a {@link CustomPatternSensor}.
     * @alias CustomPatternSensorVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {EntityCollection} entityCollection The entityCollection to visualize.
     */
    var CustomPatternSensorVisualizer = function(scene, entityCollection) {
        
        entityCollection.collectionChanged.addEventListener(CustomPatternSensorVisualizer.prototype._onCollectionChanged, this);

        this._scene = scene;
        this._primitives = scene.primitives;
        this._entityCollection = entityCollection;
        this._hash = {};
        this._entitiesToVisualize = new AssociativeArray();

        this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
    };

    /**
     * Updates the primitives created by this visualizer to match their
     * Entity counterpart at the given time.
     *
     * @param {JulianDate} time The time to update to.
     * @returns {Boolean} This function always returns true.
     */
    CustomPatternSensorVisualizer.prototype.update = function(time) {
        
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;

        for (var i = 0, len = entities.length; i < len; i++) {
            var entity = entities[i];
            var customPatternSensorGraphics = entity._customPatternSensor;

            var position;
            var orientation;
            var directions;
            var data = hash[entity.id];
            var show = entity.isAvailable(time) && Property.getValueOrDefault(customPatternSensorGraphics._show, time, true);

            if (show) {
                position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
                orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
                directions = Property.getValueOrUndefined(customPatternSensorGraphics._directions, time);
                show = defined(position) && defined(orientation) && defined(directions);
            }

            if (!show) {
                //don't bother creating or updating anything else
                if (defined(data)) {
                    data.primitive.show = false;
                }
                continue;
            }

            var primitive = defined(data) ? data.primitive : undefined;
            if (!defined(primitive)) {
                primitive = new CustomSensorVolume();
                primitive.id = entity;
                primitives.add(primitive);

                data = {
                    primitive : primitive,
                    position : undefined,
                    orientation : undefined
                };
                hash[entity.id] = data;
            }

            if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
                Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
                data.position = Cartesian3.clone(position, data.position);
                data.orientation = Quaternion.clone(orientation, data.orientation);
            }

            primitive.show = true;
            primitive.directions = directions;
            primitive.radius = Property.getValueOrDefault(customPatternSensorGraphics._radius, time, defaultRadius);
            primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, customPatternSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
            primitive.intersectionColor = Property.getValueOrClonedDefault(customPatternSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
            primitive.intersectionWidth = Property.getValueOrDefault(customPatternSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    CustomPatternSensorVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    CustomPatternSensorVisualizer.prototype.destroy = function() {
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;
        for (var i = entities.length - 1; i > -1; i--) {
            removePrimitive(entities[i], hash, primitives);
        }
        return destroyObject(this);
    };

    /**
     * @private
     */
    CustomPatternSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
        var i;
        var entity;
        var entities = this._entitiesToVisualize;
        var hash = this._hash;
        var primitives = this._primitives;

        for (i = added.length - 1; i > -1; i--) {
            entity = added[i];
            if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            }
        }

        for (i = changed.length - 1; i > -1; i--) {
            entity = changed[i];
            if (defined(entity._customPatternSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            } else {
                removePrimitive(entity, hash, primitives);
                entities.remove(entity.id);
            }
        }

        for (i = removed.length - 1; i > -1; i--) {
            entity = removed[i];
            removePrimitive(entity, hash, primitives);
            entities.remove(entity.id);
        }
    };

    function removePrimitive(entity, hash, primitives) {
        var data = hash[entity.id];
        if (defined(data)) {
            var primitive = data.primitive;
            primitives.remove(primitive);
            if (!primitive.isDestroyed()) {
                primitive.destroy();
            }
            delete hash[entity.id];
        }
    }

    return CustomPatternSensorVisualizer;
});
/*global define*/
define('RectangularSensorGraphics',[
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Event',
        'Cesium/DataSources/createPropertyDescriptor'
    ], function(
        defaultValue,
        defined,
        defineProperties,
        DeveloperError,
        Event,
        createPropertyDescriptor) {
    "use strict";

    /**
     * An optionally time-dynamic pyramid.
     *
     * @alias RectangularSensorGraphics
     * @constructor
     */
    var RectangularSensorGraphics = function() {
        this._xHalfAngle = undefined;
        this._xHalfAngleSubscription = undefined;
        this._yHalfAngle = undefined;
        this._yHalfAngleSubscription = undefined;

        this._lateralSurfaceMaterial = undefined;
        this._lateralSurfaceMaterialSubscription = undefined;

        this._intersectionColor = undefined;
        this._intersectionColorSubscription = undefined;
        this._intersectionWidth = undefined;
        this._intersectionWidthSubscription = undefined;
        this._showIntersection = undefined;
        this._showIntersectionSubscription = undefined;
        this._radius = undefined;
        this._radiusSubscription = undefined;
        this._show = undefined;
        this._showSubscription = undefined;
        this._definitionChanged = new Event();
    };

    defineProperties(RectangularSensorGraphics.prototype, {
        /**
         * Gets the event that is raised whenever a new property is assigned.
         * @memberof RectangularSensorGraphics.prototype
         *
         * @type {Event}
         * @readonly
         */
        definitionChanged : {
            get : function() {
                return this._definitionChanged;
            }
        },

        /**
         * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        xHalfAngle : createPropertyDescriptor('xHalfAngle'),

        /**
         * A {@link Property} which returns an array of {@link Spherical} instances representing the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        yHalfAngle : createPropertyDescriptor('yHalfAngle'),

        /**
         * Gets or sets the {@link MaterialProperty} specifying the the pyramid's appearance.
         * @memberof RectangularSensorGraphics.prototype
         * @type {MaterialProperty}
         */
        lateralSurfaceMaterial : createPropertyDescriptor('lateralSurfaceMaterial'),

        /**
         * Gets or sets the {@link Color} {@link Property} specifying the color of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        intersectionColor : createPropertyDescriptor('intersectionColor'),

        /**
         * Gets or sets the numeric {@link Property} specifying the width of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        intersectionWidth : createPropertyDescriptor('intersectionWidth'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the line formed by the intersection of the pyramid and other central bodies.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        showIntersection : createPropertyDescriptor('showIntersection'),

        /**
         * Gets or sets the numeric {@link Property} specifying the radius of the pyramid's projection.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        radius : createPropertyDescriptor('radius'),

        /**
         * Gets or sets the boolean {@link Property} specifying the visibility of the pyramid.
         * @memberof RectangularSensorGraphics.prototype
         * @type {Property}
         */
        show : createPropertyDescriptor('show')
    });

    /**
     * Duplicates a RectangularSensorGraphics instance.
     *
     * @param {RectangularSensorGraphics} [result] The object onto which to store the result.
     * @returns {RectangularSensorGraphics} The modified result parameter or a new instance if one was not provided.
     */
    RectangularSensorGraphics.prototype.clone = function(result) {
        if (!defined(result)) {
            result = new RectangularSensorGraphics();
        }
        result.xHalfAngle = this.xHalfAngle;
        result.yHalfAngle = this.yHalfAngle;
        result.radius = this.radius;
        result.show = this.show;
        result.showIntersection = this.showIntersection;
        result.intersectionColor = this.intersectionColor;
        result.intersectionWidth = this.intersectionWidth;
        result.lateralSurfaceMaterial = this.lateralSurfaceMaterial;
        return result;
    };

    /**
     * Assigns each unassigned property on this object to the value
     * of the same property on the provided source object.
     *
     * @param {RectangularSensorGraphics} source The object to be merged into this object.
     */
    RectangularSensorGraphics.prototype.merge = function(source) {
        
        this.xHalfAngle = defaultValue(this.xHalfAngle, source.xHalfAngle);
        this.yHalfAngle = defaultValue(this.yHalfAngle, source.yHalfAngle);
        this.radius = defaultValue(this.radius, source.radius);
        this.show = defaultValue(this.show, source.show);
        this.showIntersection = defaultValue(this.showIntersection, source.showIntersection);
        this.intersectionColor = defaultValue(this.intersectionColor, source.intersectionColor);
        this.intersectionWidth = defaultValue(this.intersectionWidth, source.intersectionWidth);
        this.lateralSurfaceMaterial = defaultValue(this.lateralSurfaceMaterial, source.lateralSurfaceMaterial);
    };

    return RectangularSensorGraphics;
});

/*global define*/
define('RectangularPyramidSensorVolume',[
        'Cesium/Core/clone',
        'Cesium/Core/defaultValue',
        'Cesium/Core/defined',
        'Cesium/Core/defineProperties',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Math',
        'Cesium/Core/Spherical',
        './CustomSensorVolume'
    ], function(
        clone,
        defaultValue,
        defined,
        defineProperties,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Spherical,
        CustomSensorVolume) {
    "use strict";

    function assignSpherical(index, array, clock, cone) {
        var spherical = array[index];
        if (!defined(spherical)) {
            array[index] = spherical = new Spherical();
        }
        spherical.clock = clock;
        spherical.cone = cone;
        spherical.magnitude = 1.0;
    }

    function updateDirections(rectangularSensor) {
        var directions = rectangularSensor._customSensor.directions;

        // At 90 degrees the sensor is completely open, and tan() goes to infinity.
        var tanX = Math.tan(Math.min(rectangularSensor._xHalfAngle, CesiumMath.toRadians(89.0)));
        var tanY = Math.tan(Math.min(rectangularSensor._yHalfAngle, CesiumMath.toRadians(89.0)));
        var theta = Math.atan(tanX / tanY);
        var cone = Math.atan(Math.sqrt(tanX * tanX + tanY * tanY));

        assignSpherical(0, directions, theta, cone);
        assignSpherical(1, directions, CesiumMath.toRadians(180.0) - theta, cone);
        assignSpherical(2, directions, CesiumMath.toRadians(180.0) + theta, cone);
        assignSpherical(3, directions, -theta, cone);

        directions.length = 4;
        rectangularSensor._customSensor.directions = directions;
    }

    var RectangularPyramidSensorVolume = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var customSensorOptions = clone(options);
        customSensorOptions._pickPrimitive = defaultValue(options._pickPrimitive, this);
        customSensorOptions.directions = undefined;
        this._customSensor = new CustomSensorVolume(customSensorOptions);

        this._xHalfAngle = defaultValue(options.xHalfAngle, CesiumMath.PI_OVER_TWO);
        this._yHalfAngle = defaultValue(options.yHalfAngle, CesiumMath.PI_OVER_TWO);

        updateDirections(this);
    };

    defineProperties(RectangularPyramidSensorVolume.prototype, {
        xHalfAngle : {
            get : function() {
                return this._xHalfAngle;
            },
            set : function(value) {
                
                if (this._xHalfAngle !== value) {
                    this._xHalfAngle = value;
                    updateDirections(this);
                }
            }
        },
        yHalfAngle : {
            get : function() {
                return this._yHalfAngle;
            },
            set : function(value) {
                
                if (this._yHalfAngle !== value) {
                    this._yHalfAngle = value;
                    updateDirections(this);
                }
            }
        },
        show : {
            get : function() {
                return this._customSensor.show;
            },
            set : function(value) {
                this._customSensor.show = value;
            }
        },
        showIntersection : {
            get : function() {
                return this._customSensor.showIntersection;
            },
            set : function(value) {
                this._customSensor.showIntersection = value;
            }
        },
        showThroughEllipsoid : {
            get : function() {
                return this._customSensor.showThroughEllipsoid;
            },
            set : function(value) {
                this._customSensor.showThroughEllipsoid = value;
            }
        },
        modelMatrix : {
            get : function() {
                return this._customSensor.modelMatrix;
            },
            set : function(value) {
                this._customSensor.modelMatrix = value;
            }
        },
        radius : {
            get : function() {
                return this._customSensor.radius;
            },
            set : function(value) {
                this._customSensor.radius = value;
            }
        },
        lateralSurfaceMaterial : {
            get : function() {
                return this._customSensor.lateralSurfaceMaterial;
            },
            set : function(value) {
                this._customSensor.lateralSurfaceMaterial = value;
            }
        },
        intersectionColor : {
            get : function() {
                return this._customSensor.intersectionColor;
            },
            set : function(value) {
                this._customSensor.intersectionColor = value;
            }
        },
        intersectionWidth : {
            get : function() {
                return this._customSensor.intersectionWidth;
            },
            set : function(value) {
                this._customSensor.intersectionWidth = value;
            }
        },
        id : {
            get : function() {
                return this._customSensor.id;
            },
            set : function(value) {
                this._customSensor.id = value;
            }
        }
    });

    RectangularPyramidSensorVolume.prototype.update = function(context, frameState, commandList) {
        this._customSensor.update(context, frameState, commandList);
    };

    RectangularPyramidSensorVolume.prototype.isDestroyed = function() {
        return false;
    };

    RectangularPyramidSensorVolume.prototype.destroy = function() {
        this._customSensor = this._customSensor && this._customSensor.destroy();
        return destroyObject(this);
    };

    return RectangularPyramidSensorVolume;
});
/*global define*/
define('RectangularSensorVisualizer',[
        'Cesium/Core/AssociativeArray',
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/destroyObject',
        'Cesium/Core/DeveloperError',
        'Cesium/Core/Math',
        'Cesium/Core/Matrix3',
        'Cesium/Core/Matrix4',
        'Cesium/Core/Quaternion',
        './RectangularPyramidSensorVolume',
        'Cesium/DataSources/MaterialProperty',
        'Cesium/DataSources/Property'
    ], function(
        AssociativeArray,
        Cartesian3,
        Color,
        defined,
        destroyObject,
        DeveloperError,
        CesiumMath,
        Matrix3,
        Matrix4,
        Quaternion,
        RectangularPyramidSensorVolume,
        MaterialProperty,
        Property) {
    "use strict";

    var defaultIntersectionColor = Color.WHITE;
    var defaultIntersectionWidth = 1.0;
    var defaultRadius = Number.POSITIVE_INFINITY;

    var matrix3Scratch = new Matrix3();
    var cachedPosition = new Cartesian3();
    var cachedOrientation = new Quaternion();

    /**
     * A {@link Visualizer} which maps {@link Entity#rectangularSensor} to a {@link RectangularSensor}.
     * @alias RectangularSensorVisualizer
     * @constructor
     *
     * @param {Scene} scene The scene the primitives will be rendered in.
     * @param {EntityCollection} entityCollection The entityCollection to visualize.
     */
    var RectangularSensorVisualizer = function(scene, entityCollection) {
        
        entityCollection.collectionChanged.addEventListener(RectangularSensorVisualizer.prototype._onCollectionChanged, this);

        this._scene = scene;
        this._primitives = scene.primitives;
        this._entityCollection = entityCollection;
        this._hash = {};
        this._entitiesToVisualize = new AssociativeArray();

        this._onCollectionChanged(entityCollection, entityCollection.entities, [], []);
    };

    /**
     * Updates the primitives created by this visualizer to match their
     * Entity counterpart at the given time.
     *
     * @param {JulianDate} time The time to update to.
     * @returns {Boolean} This function always returns true.
     */
    RectangularSensorVisualizer.prototype.update = function(time) {
        
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;

        for (var i = 0, len = entities.length; i < len; i++) {
            var entity = entities[i];
            var rectangularSensorGraphics = entity._rectangularSensor;

            var position;
            var orientation;
            var data = hash[entity.id];
            var show = entity.isAvailable(time) && Property.getValueOrDefault(rectangularSensorGraphics._show, time, true);

            if (show) {
                position = Property.getValueOrUndefined(entity._position, time, cachedPosition);
                orientation = Property.getValueOrUndefined(entity._orientation, time, cachedOrientation);
                show = defined(position) && defined(orientation);
            }

            if (!show) {
                //don't bother creating or updating anything else
                if (defined(data)) {
                    data.primitive.show = false;
                }
                continue;
            }

            var primitive = defined(data) ? data.primitive : undefined;
            if (!defined(primitive)) {
                primitive = new RectangularPyramidSensorVolume();
                primitive.id = entity;
                primitives.add(primitive);

                data = {
                    primitive : primitive,
                    position : undefined,
                    orientation : undefined
                };
                hash[entity.id] = data;
            }

            if (!Cartesian3.equals(position, data.position) || !Quaternion.equals(orientation, data.orientation)) {
                Matrix4.fromRotationTranslation(Matrix3.fromQuaternion(orientation, matrix3Scratch), position, primitive.modelMatrix);
                data.position = Cartesian3.clone(position, data.position);
                data.orientation = Quaternion.clone(orientation, data.orientation);
            }

            primitive.show = true;
            primitive.xHalfAngle = Property.getValueOrDefault(rectangularSensorGraphics._xHalfAngle, time, CesiumMath.PI_OVER_TWO);
            primitive.yHalfAngle = Property.getValueOrDefault(rectangularSensorGraphics._yHalfAngle, time, CesiumMath.PI_OVER_TWO);
            primitive.radius = Property.getValueOrDefault(rectangularSensorGraphics._radius, time, defaultRadius);
            primitive.lateralSurfaceMaterial = MaterialProperty.getValue(time, rectangularSensorGraphics._lateralSurfaceMaterial, primitive.lateralSurfaceMaterial);
            primitive.intersectionColor = Property.getValueOrClonedDefault(rectangularSensorGraphics._intersectionColor, time, defaultIntersectionColor, primitive.intersectionColor);
            primitive.intersectionWidth = Property.getValueOrDefault(rectangularSensorGraphics._intersectionWidth, time, defaultIntersectionWidth);
        }
        return true;
    };

    /**
     * Returns true if this object was destroyed; otherwise, false.
     *
     * @returns {Boolean} True if this object was destroyed; otherwise, false.
     */
    RectangularSensorVisualizer.prototype.isDestroyed = function() {
        return false;
    };

    /**
     * Removes and destroys all primitives created by this instance.
     */
    RectangularSensorVisualizer.prototype.destroy = function() {
        var entities = this._entitiesToVisualize.values;
        var hash = this._hash;
        var primitives = this._primitives;
        for (var i = entities.length - 1; i > -1; i--) {
            removePrimitive(entities[i], hash, primitives);
        }
        return destroyObject(this);
    };

    /**
     * @private
     */
    RectangularSensorVisualizer.prototype._onCollectionChanged = function(entityCollection, added, removed, changed) {
        var i;
        var entity;
        var entities = this._entitiesToVisualize;
        var hash = this._hash;
        var primitives = this._primitives;

        for (i = added.length - 1; i > -1; i--) {
            entity = added[i];
            if (defined(entity._rectangularSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            }
        }

        for (i = changed.length - 1; i > -1; i--) {
            entity = changed[i];
            if (defined(entity._rectangularSensor) && defined(entity._position) && defined(entity._orientation)) {
                entities.set(entity.id, entity);
            } else {
                removePrimitive(entity, hash, primitives);
                entities.remove(entity.id);
            }
        }

        for (i = removed.length - 1; i > -1; i--) {
            entity = removed[i];
            removePrimitive(entity, hash, primitives);
            entities.remove(entity.id);
        }
    };

    function removePrimitive(entity, hash, primitives) {
        var data = hash[entity.id];
        if (defined(data)) {
            var primitive = data.primitive;
            primitives.remove(primitive);
            if (!primitive.isDestroyed()) {
                primitive.destroy();
            }
            delete hash[entity.id];
        }
    }

    return RectangularSensorVisualizer;
});

/*global define*/
define('initialize',[
        'Cesium/Core/Cartesian3',
        'Cesium/Core/Color',
        'Cesium/Core/defined',
        'Cesium/Core/Spherical',
        'Cesium/Core/TimeInterval',
        'Cesium/DataSources/CzmlDataSource',
        'Cesium/DataSources/DataSourceDisplay',
        './ConicSensorGraphics',
        './ConicSensorVisualizer',
        './CustomPatternSensorGraphics',
        './CustomPatternSensorVisualizer',
        './RectangularSensorGraphics',
        './RectangularSensorVisualizer'
    ], function(
        Cartesian3,
        Color,
        defined,
        Spherical,
        TimeInterval,
        CzmlDataSource,
        DataSourceDisplay,
        ConicSensorGraphics,
        ConicSensorVisualizer,
        CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer,
        RectangularSensorGraphics,
        RectangularSensorVisualizer) {
    "use strict";

    var processPacketData = CzmlDataSource.processPacketData;
    var processMaterialPacketData = CzmlDataSource.processMaterialPacketData;

    function processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection) {
        var i;
        var len;
        var values = [];
        var unitSphericals = directions.unitSpherical;
        var sphericals = directions.spherical;
        var unitCartesians = directions.unitCartesian;
        var cartesians = directions.cartesian;

        if (defined(unitSphericals)) {
            for (i = 0, len = unitSphericals.length; i < len; i += 2) {
                values.push(new Spherical(unitSphericals[i], unitSphericals[i + 1]));
            }
            directions.array = values;
        } else if (defined(sphericals)) {
            for (i = 0, len = sphericals.length; i < len; i += 3) {
                values.push(new Spherical(sphericals[i], sphericals[i + 1], sphericals[i + 2]));
            }
            directions.array = values;
        } else if (defined(unitCartesians)) {
            for (i = 0, len = unitCartesians.length; i < len; i += 3) {
                var tmp = Spherical.fromCartesian3(new Cartesian3(unitCartesians[i], unitCartesians[i + 1], unitCartesians[i + 2]));
                Spherical.normalize(tmp, tmp);
                values.push(tmp);
            }
            directions.array = values;
        } else if (defined(cartesians)) {
            for (i = 0, len = cartesians.length; i < len; i += 3) {
                values.push(Spherical.fromCartesian3(new Cartesian3(cartesians[i], cartesians[i + 1], cartesians[i + 2])));
            }
            directions.array = values;
        }
        processPacketData(Array, customPatternSensor, 'directions', directions, interval, sourceUri, entityCollection);
    }

    function processCommonSensorProperties(sensor, sensorData, interval, sourceUri, entityCollection) {
        processPacketData(Boolean, sensor, 'show', sensorData.show, interval, sourceUri, entityCollection);
        processPacketData(Number, sensor, 'radius', sensorData.radius, interval, sourceUri, entityCollection);
        processPacketData(Boolean, sensor, 'showIntersection', sensorData.showIntersection, interval, sourceUri, entityCollection);
        processPacketData(Color, sensor, 'intersectionColor', sensorData.intersectionColor, interval, sourceUri, entityCollection);
        processPacketData(Number, sensor, 'intersectionWidth', sensorData.intersectionWidth, interval, sourceUri, entityCollection);
        processMaterialPacketData(sensor, 'lateralSurfaceMaterial', sensorData.lateralSurfaceMaterial, interval, sourceUri, entityCollection);
    }

    var iso8601Scratch = {
        iso8601 : undefined
    };

    function processConicSensor(entity, packet, entityCollection, sourceUri) {
        var conicSensorData = packet.agi_conicSensor;
        if (!defined(conicSensorData)) {
            return;
        }

        var interval;
        var intervalString = conicSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var conicSensor = entity.conicSensor;
        if (!defined(conicSensor)) {
            entity.addProperty('conicSensor');
            entity.conicSensor = conicSensor = new ConicSensorGraphics();
        }

        processCommonSensorProperties(conicSensor, conicSensorData, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'innerHalfAngle', conicSensorData.innerHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'outerHalfAngle', conicSensorData.outerHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'minimumClockAngle', conicSensorData.minimumClockAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, conicSensor, 'maximumClockAngle', conicSensorData.maximumClockAngle, interval, sourceUri, entityCollection);
    }

    function processCustomPatternSensor(entity, packet, entityCollection, sourceUri) {
        var customPatternSensorData = packet.agi_customPatternSensor;
        if (!defined(customPatternSensorData)) {
            return;
        }

        var interval;
        var intervalString = customPatternSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var customPatternSensor = entity.customPatternSensor;
        if (!defined(customPatternSensor)) {
            entity.addProperty('customPatternSensor');
            entity.customPatternSensor = customPatternSensor = new CustomPatternSensorGraphics();
        }

        processCommonSensorProperties(customPatternSensor, customPatternSensorData, interval, sourceUri, entityCollection);

        //The directions property is a special case value that can be an array of unitSpherical or unit Cartesians.
        //We pre-process this into Spherical instances and then process it like any other array.
        var directions = customPatternSensorData.directions;
        if (defined(directions)) {
            if (Array.isArray(directions)) {
                var length = directions.length;
                for (var i = 0; i < length; i++) {
                    processDirectionData(customPatternSensor, directions[i], interval, sourceUri, entityCollection);
                }
            } else {
                processDirectionData(customPatternSensor, directions, interval, sourceUri, entityCollection);
            }
        }
    }

    function processRectangularSensor(entity, packet, entityCollection, sourceUri) {
        var rectangularSensorData = packet.agi_rectangularSensor;
        if (!defined(rectangularSensorData)) {
            return;
        }

        var interval;
        var intervalString = rectangularSensorData.interval;
        if (defined(intervalString)) {
            iso8601Scratch.iso8601 = intervalString;
            interval = TimeInterval.fromIso8601(iso8601Scratch);
        }

        var rectangularSensor = entity.rectangularSensor;
        if (!defined(rectangularSensor)) {
            entity.addProperty('rectangularSensor');
            entity.rectangularSensor = rectangularSensor = new RectangularSensorGraphics();
        }

        processCommonSensorProperties(rectangularSensor, rectangularSensorData, interval, sourceUri, entityCollection);
        processPacketData(Number, rectangularSensor, 'xHalfAngle', rectangularSensorData.xHalfAngle, interval, sourceUri, entityCollection);
        processPacketData(Number, rectangularSensor, 'yHalfAngle', rectangularSensorData.yHalfAngle, interval, sourceUri, entityCollection);
    }

    var initialized = false;
    var initialize = function() {
        if (initialized) {
            return;
        }

        CzmlDataSource.updaters.push(processConicSensor, processCustomPatternSensor, processRectangularSensor);

        var originalDefaultVisualizersCallback = DataSourceDisplay.defaultVisualizersCallback;
        DataSourceDisplay.defaultVisualizersCallback = function(scene, dataSource) {
            var entities = dataSource.entities;
            var array = originalDefaultVisualizersCallback(scene, dataSource);
            return array.concat([new ConicSensorVisualizer(scene, entities),
                                 new CustomPatternSensorVisualizer(scene, entities),
                                 new RectangularSensorVisualizer(scene, entities)]);
        };

        initialized = true;
    };

    return initialize;
});
/*global define*/
define('CesiumSensors',[
        './initialize',
        './ConicSensorGraphics',
        './ConicSensorVisualizer',
        './CustomPatternSensorGraphics',
        './CustomPatternSensorVisualizer',
        './CustomSensorVolume',
        './RectangularPyramidSensorVolume',
        './RectangularSensorGraphics',
        './RectangularSensorVisualizer'
    ], function(
        initialize,
        ConicSensorGraphics,
        ConicSensorVisualizer,
        CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer,
        CustomSensorVolume,
        RectangularPyramidSensorVolume,
        RectangularSensorGraphics,
        RectangularSensorVisualizer) {
    "use strict";

    initialize();

    return {
        ConicSensorGraphics : ConicSensorGraphics,
        ConicSensorVisualizer : ConicSensorVisualizer,
        CustomPatternSensorGraphics : CustomPatternSensorGraphics,
        CustomPatternSensorVisualizer : CustomPatternSensorVisualizer,
        CustomSensorVolume : CustomSensorVolume,
        RectangularPyramidSensorVolume : RectangularPyramidSensorVolume,
        RectangularSensorGraphics : RectangularSensorGraphics,
        RectangularSensorVisualizer : RectangularSensorVisualizer
    };
});
(function() {
"use strict";
/*jshint sub:true*/
/*global define,require,self,Cesium*/

define('Cesium/Core/defaultValue', function() { return Cesium["defaultValue"]; });
define('Cesium/Core/defined', function() { return Cesium["defined"]; });
define('Cesium/Core/defineProperties', function() { return Cesium["defineProperties"]; });
define('Cesium/Core/DeveloperError', function() { return Cesium["DeveloperError"]; });
define('Cesium/Core/Event', function() { return Cesium["Event"]; });
define('Cesium/DataSources/createPropertyDescriptor', function() { return Cesium["createPropertyDescriptor"]; });
define('Cesium/Core/AssociativeArray', function() { return Cesium["AssociativeArray"]; });
define('Cesium/Core/Cartesian3', function() { return Cesium["Cartesian3"]; });
define('Cesium/Core/Color', function() { return Cesium["Color"]; });
define('Cesium/Core/destroyObject', function() { return Cesium["destroyObject"]; });
define('Cesium/Core/Math', function() { return Cesium["Math"]; });
define('Cesium/Core/Matrix3', function() { return Cesium["Matrix3"]; });
define('Cesium/Core/Matrix4', function() { return Cesium["Matrix4"]; });
define('Cesium/Core/Quaternion', function() { return Cesium["Quaternion"]; });
define('Cesium/Core/Spherical', function() { return Cesium["Spherical"]; });
define('Cesium/DataSources/MaterialProperty', function() { return Cesium["MaterialProperty"]; });
define('Cesium/DataSources/Property', function() { return Cesium["Property"]; });
define('Cesium/Core/BoundingSphere', function() { return Cesium["BoundingSphere"]; });
define('Cesium/Core/combine', function() { return Cesium["combine"]; });
define('Cesium/Core/ComponentDatatype', function() { return Cesium["ComponentDatatype"]; });
define('Cesium/Core/PrimitiveType', function() { return Cesium["PrimitiveType"]; });
define('Cesium/Renderer/BufferUsage', function() { return Cesium["BufferUsage"]; });
define('Cesium/Renderer/createShaderSource', function() { return Cesium["createShaderSource"]; });
define('Cesium/Renderer/DrawCommand', function() { return Cesium["DrawCommand"]; });
define('Cesium/Scene/BlendingState', function() { return Cesium["BlendingState"]; });
define('Cesium/Scene/CullFace', function() { return Cesium["CullFace"]; });
define('Cesium/Scene/Material', function() { return Cesium["Material"]; });
define('Cesium/Scene/Pass', function() { return Cesium["Pass"]; });
define('Cesium/Scene/SceneMode', function() { return Cesium["SceneMode"]; });
define('Cesium/Core/TimeInterval', function() { return Cesium["TimeInterval"]; });
define('Cesium/DataSources/CzmlDataSource', function() { return Cesium["CzmlDataSource"]; });
define('Cesium/DataSources/DataSourceDisplay', function() { return Cesium["DataSourceDisplay"]; });
define('Cesium/Core/clone', function() { return Cesium["clone"]; });
require(["CesiumSensors"], function(CesiumSensors) {
    var scope = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : {};
    scope.CesiumSensors = CesiumSensors;
}, undefined, true);
})();
})();