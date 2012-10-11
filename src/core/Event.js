/**
 * Event class
 *
 * @author mzhou
 *
 */
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Proto:false, Util:false */

var Event = (function() {
    'use strict';
    var slice = Array.prototype.slice,
        Event = Proto.$extend();

    /**
     * 注册事件
     * @param {string} name 事件名
     * @param {function} callback 事件的回调函数
     * @param {object} context 【可选】回调函数的this值
     * @param {boolean} once 【可选】是否只执行一次
     * @return {object} this
     */
    Event.prototype.on = function( name, callback, context, once ) {
        this.eventQueue = this.eventQueue || {};
        this.eventQueue[name] = this.eventQueue[name] || [];
        this.eventQueue[name].push({
            callback: callback,
            context: context,
            once: once
        });
        return this;
    };
    /**
     * 取消注册事件
     * @param {string} name
     * @param {function} callback 【可选】指定要取消的回调函数
     * @return {object} this
     */
    Event.prototype.off = function( name, callback ) {
        this.eventQueue = this.eventQueue || {};
        if ( this.eventQueue[name] == null ) {
            return;
        }
        if ( callback ) {
            this.eventQueue[name] = Util.filter( this.eventQueue[name], function( value, index ) {
                return value.callback !== callback;
            });
            if ( this.eventQueue[name].length === 0 ) {
                delete this.eventQueue[name];
            }
        } else {
            delete this.eventQueue[name];
        }
        return this;
    };
    /**
     * 激活事件
     * @param {string} name
     * @param {object} data 传递给事件回调函数的参数值
     * @return {object} this
     */
    Event.prototype.fire = function( name, data ) {
        this.eventQueue = this.eventQueue || {};
        var q = this.eventQueue[name],
            r = true;
        if ( q ) {
            var arg = slice.call( arguments, 1 );
            Util.each( q, function( value ) {
                if ( value.callback.apply( value.context, arg ) === false ) {
                    r = false;
                }
                if ( value.once ) {
                    this.off( name, value.callback );
                }
            }, this);
        }
        return r;
    };

    return Event;
})();
