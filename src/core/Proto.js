/**
 * Proto.js
 * Mixin based OOP library in javascript.
 * 
 *
 * @author mzhou / @zhoumm
 * @log 0.1
 *
 */
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Proto:true */

var Proto = (function() {
    'use strict';
    var ArrayProtoSlice = Array.prototype.slice,
        reservedMethod = {
            $from: 1
        },
        reservedStaticMethod = {
            $methods: 1,
            $statics: 1,
            prototype: 1
        };

    /**
     * arguments to Array
     *
     * @param {object} args arguments
     * @return {array}
     */
    function toArray(args) {
        return ArrayProtoSlice.call(args, 0);
    }

    /**
     * mixin two class
     *
     * @param {object/function} Source
     * @param {function} Target
     *
     */
    function mixin(Source, Target) {
        var staticMethod, method,
            SourceProto, TargetProto;

        // copy static method
        for (staticMethod in Source) {
            if (!reservedStaticMethod[staticMethod] && Source.hasOwnProperty(staticMethod)) {
                Target[staticMethod] = Source[staticMethod];
            }
        }

        // copy normal method
        SourceProto = Source.prototype,
        TargetProto = Target.prototype;
        for (method in SourceProto) {
            if (!reservedMethod[method] && SourceProto.hasOwnProperty(method)) {
                TargetProto[method] = SourceProto[method];
            }
        }
    }

    function Proto() {}

    /**
     * Create new Class base on this one;
     * 
     * @param {function} constructor [option] Constructor of new Class,
     *                       by default it is a empty function
     * @param {function} Constructor of new Class
     *
     */
    Proto.$extend = function(constructor) {
        var Class,
            cachedSuperConstructor,
            methodCache = {},
            staticCache = {},
            Source = this,
            SourceProto = Source.prototype;

        // create constructor
        if (constructor) {
            // if indicate constructor explicitly,
            // then make supr constructor and cache it.
            Class = function() {
                // make supr
                var args = toArray(arguments);

                if (!cachedSuperConstructor) {
                    cachedSuperConstructor = function(self) {
                        var argss = toArray(arguments);
                        argss.splice(0, 1);
                        return Source.apply(self, argss);
                    };
                }
                args.unshift(cachedSuperConstructor);

                // call constructor
                return constructor.apply(this, args);
            };
        } else {
            // if not indicate constructor explicitly,
            // then call Source's constructor by default.
            Class = function() {
                return Source.apply(this, toArray(arguments));
            };
        }

        mixin(Source, Class);

        /**
         * Make supr func with cache;
         * 
         * @param {string} method name
         * @param {function} func
         * @param {function} Source constructor
         * @param {boolean} isStatic [option]
         * @return {function} supr function
         *
         */
        function make(method, func, Source, isStatic) {
            var cache;
            // get cache and set Source
            if (!isStatic) {
                cache = methodCache;
                Source = Source.prototype;
            } else {
                cache = staticCache;
            }

            return function() {
                var args = toArray(arguments);
                if (!cache[method]) {
                    // make supr function and cache it
                    cache[method] = Source[method] ? function(self) {
                        var argss = toArray(arguments);
                        argss.splice(0, 1);
                        return Source[method].apply(self, argss);
                    } : function() {};
                }

                args.unshift(cache[method]);
                // call func
                return func.apply(this, args);
            };
        }

        /**
         * Add method to Class
         *
         * @param {string/object} name method name
         *                             or map of functions
         * @param {function} func
         * @return {object} this Class
         *
         */
        Class.$methods = function(name, func) {
            var method,
                ClassProto = Class.prototype;

            // setup real methods
            if (typeof name === 'string') {
                ClassProto[name] = make(name, func, Source);
            } else {
                for (method in name) {
                    if (name.hasOwnProperty(method)) {
                        ClassProto[method] = make(method, name[method], Source);
                    }
                }
            }

            return this;
        };

        /**
         * Add static method to Class
         *
         * @param {string/object} name method name
         *                             or map of functions
         * @param {function} func
         * @return {object} this Class
         *
         */
        Class.$statics = function(name, func) {
            var method;

            // setup real methods
            if (typeof name === 'string') {
                Class[name] = make(name, func, Source, true);
            } else {
                for (method in name) {
                    if (name.hasOwnProperty(method)) {
                        Class[method] = make(method, name[method], Source, true);
                    }
                }
            }

            return this;
        };

        /**
         * Check if object is from target
         *
         * @param {function} klass
         * @return {boolean}
         *
         */
        Class.prototype.$from = function(klass) {
            if (Class.prototype === klass.prototype) {
                return true;
            } else {
                return SourceProto.$from(klass);
            }
        };

        return Class;
    };

    /**
     * mixin two class
     *      var Class = Proto.$extend(),
     *          Mixined = Proto.$extend();
     *      Mixined.$method('get', function(){return this;});
     *
     * @param {object/function} Source
     * @param {function} Target
     * @return {object}
     *
     */
    Proto.$mixin = function(Source) {
        mixin(Source, this);
        return this;
    };

    Proto.prototype.$from = function(klass) {
        return Proto.prototype === klass.prototype;
    };

    return Proto;
})();
