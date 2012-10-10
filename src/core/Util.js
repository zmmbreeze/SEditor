/**
 *
 *
 *
 */

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Proto:true */
var Util = (function() {
    'use strict';
    var Klass = {},
        ArrayProto = Array.prototype,
        ObjProto = Object.prototype,
        nativeFilter = ArrayProto.filter,
        toString = ObjProto.toString,
        // validate html
        class2type = { // Ideas from jquery, but don't use string and each to make it faster
            '[object Boolean]': 'boolean',
            '[object Number]': 'number',
            '[object String]': 'string',
            '[object Function]': 'function',
            '[object Array]': 'array',
            '[object Date]': 'date',
            '[object RegExp]': 'regexp',
            '[object Object]': 'object'
        };

    /**
     * Get the type of target.
     *      results: null, undefined, boolean, function, number,
     *               string, array, date, regexp, object
     * @param {object} obj everything
     */
    Klass.type = function(obj) {
        return obj == null ? String(obj) : class2type[toString.call(obj)] || 'object';
    };

    /**
     * forEach函数
     * @param {array/object} array 被迭代数组或map
     * @param {function} iterator 迭代函数 callback: function( array[key], key, array );
     * @param {object} context 设置的this对象
     */
    Klass.each = function(array, iterator, context) {
        var value;
        if (array == null) {
            return;
        }

        if (ArrayProto.forEach && array.forEach === ArrayProto.forEach) {
            array.forEach(iterator, context);
        } else if (Klass.type(array.length) === 'number') {
            for (var i = 0, l = array.length; i < l; i++) {
                if (i in array) {
                    iterator.call(context, array[i], i, array);
                }
            }
        } else {
            for (var key in array) {
                if (ObjProto.hasOwnProperty.call(array, key)) {
                    iterator.call(context, array[key], key, array);
                }
            }
        }
    };

    /**
     * https://developer.mozilla.org/en/JavaScript/Reference/Global_Objects/Array/filter
     * 根据回调函数，过滤数组的各个值
     * @param {array} array 被迭代数组
     * @param {function} iterator 过滤数组的回调函数
     * @param {object} context 回调函数的this值
     * @return {array} 过滤之后的数组
     */
    Klass.filter = function(array, iterator, context) {
        var results = [];
        if (array == null) {
            return;
        }

        if (nativeFilter && array.filter === nativeFilter) {
            return array.filter(iterator, context);
        } else {
            Klass.each(array, function(value, index, list) {
                if (iterator.call(context, value, index, list)) {
                    results.push(value);
                }
            });
            return results;
        }
    };

    /**
     * 用于替代字符串拼接的模板函数
     *      Util.format( '{1} name is {2}!', { 1: 'Her', 2: 'Mo' });
     *      Util.format( '{v} is good!', 'JavaScript' );
     *      Util.format( '{s} is good!', '{s}', 'JavaScript' );
     *      Util.format( '<1> name is <2>!', { 1: 'Her', 2: 'Mo' }, /<([^<>]+)>/g);
     * @param {string} tmpl 模板字符串
     * @param {string/object} key 如果是字符串则是键值；
     *                            如果是object则是Map,key为键值，value为替换值;
     *                            如果没有第三个参数，则key为{v}，value为此值
     * @param {string/regexp} val 如果key是字符串，则val是被替换值
     *                            如果key是Map，且有val，则val是搜索key的正则，例如：/<([^<>]+)>\/g
     * @return {string} 替换成功后的值
     */
    Util.format = function(tmpl, _key, _val) {
        if (!_key) {
            return tmpl;
        }
        var val;

        if (typeof _key !== 'object') {
            var key = _val ? _key : '{v}';
            val = _val || _key;
            return tmpl.replace(new RegExp(key, 'g'), ('' + val));
        } else {
            var obj = _key;
            return tmpl.replace(_val || /\{([^{}]+)\}/g, function(match, key) {
                val = obj[key];
                return (val !== undefined) ? ('' + val) : '';
            });
        }
    };

    return Klass;
});