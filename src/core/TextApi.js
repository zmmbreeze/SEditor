/**
 * TextApi class
 *
 * 修改自：http://code.google.com/p/rangyinputs/
 * @author mzhou
 * @log 0.1 添加了insertCaret函数用于插入光标
 * @license Rangy Text Inputs, a cross-browser textarea and text input library plug-in for jQuery.
 *
 * Part of Rangy, a cross-browser JavaScript range and selection library
 * http://code.google.com/p/rangy/
 *
 * Depends on jQuery 1.0 or later.
 *
 * Copyright 2010, Tim Down
 * Licensed under the MIT license.
 * Version: 0.1.205
 * Build date: 5 November 2010
 *
 * @author mzhou
 *
 */
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global Proto:false, Util:false */

var TextApi = (function() {
    'use strict';
    var UNDEF = 'undefined';
    var getSelection, setSelection, deleteSelectedText, deleteText, insertText;
    var replaceSelectedText, surroundSelectedText, extractSelectedText, collapseSelection, insertCaret;

    // Trio of isHost* functions taken from Peter Michaux's article:
    // http://peter.michaux.ca/articles/feature-detection-state-of-the-art-browser-scripting
    function isHostMethod(object, property) {
        var t = typeof object[property];
        return t === 'function' || (!!(t == 'object' && object[property])) || t == 'unknown';
    }

    function isHostProperty(object, property) {
        return typeof(object[property]) != UNDEF;
    }

    function isHostObject(object, property) {
        return !!(typeof(object[property]) == 'object' && object[property]);
    }

    function fail(reason) {
        if (window.console && window.console.log) {
            window.console.log('TextInputs module for Rangy not supported in your browser. Reason: ' + reason);
        }
    }

    function adjustOffsets(el, start, end) {
        if (start < 0) {
            start += el.value.length;
        }
        if (typeof end == UNDEF) {
            end = start;
        }
        if (end < 0) {
            end += el.value.length;
        }
        return { start: start, end: end };
    }

    function makeSelection(el, start, end) {
        return {
            start: start,
            end: end,
            length: end - start,
            text: el.value.slice(start, end)
        };
    }

    function getBody() {
        return isHostObject(document, 'body') ? document.body : document.getElementsByTagName('body')[0];
    }

    var testTextArea = document.createElement('textarea');

    getBody().appendChild(testTextArea);

    if (isHostProperty(testTextArea, 'selectionStart') && isHostProperty(testTextArea, 'selectionEnd') && isHostMethod(testTextArea, 'setSelectionRange')) {
        getSelection = function(el) {
            var start = el.selectionStart, end = el.selectionEnd;
            return makeSelection(el, start, end);
        };

        setSelection = function(el, startOffset, endOffset) {
            var offsets = adjustOffsets(el, startOffset, endOffset);
            el.focus();
            el.setSelectionRange( offsets.start, offsets.end );
        };

        collapseSelection = function(el, toStart) {
            if (toStart) {
                el.selectionEnd = el.selectionStart;
            } else {
                el.selectionStart = el.selectionEnd;
            }
        };
    } else if (isHostMethod(testTextArea, 'createTextRange') && isHostObject(document, 'selection') &&
               isHostMethod(document.selection, 'createRange')) {

        getSelection = function(el) {
            el.focus();
            var start = 0, end = 0, normalizedValue, textInputRange, len, endRange;
            var range = document.selection.createRange();

            if (range && range.parentElement() == el) {
                len = el.value.length;

                normalizedValue = el.value.replace(/\r\n/g, '\n');
                textInputRange = el.createTextRange();
                textInputRange.moveToBookmark(range.getBookmark());
                endRange = el.createTextRange();
                endRange.collapse(false);
                if (textInputRange.compareEndPoints('StartToEnd', endRange) > -1) {
                    start = end = len;
                } else {
                    start = -textInputRange.moveStart('character', -len);
                    start += normalizedValue.slice(0, start).split('\n').length - 1;
                    if (textInputRange.compareEndPoints('EndToEnd', endRange) > -1) {
                        end = len;
                    } else {
                        end = -textInputRange.moveEnd('character', -len);
                        end += normalizedValue.slice(0, end).split('\n').length - 1;
                    }
                }
            }

            return makeSelection(el, start, end);
        };

        // Moving across a line break only counts as moving one character in a TextRange, whereas a line break in
        // the textarea value is two characters. This function corrects for that by converting a text offset into a
        // range character offset by subtracting one character for every line break in the textarea prior to the
        // offset
        var offsetToRangeCharacterMove = function(el, offset) {
            return offset - (el.value.slice(0, offset).split('\r\n').length - 1);
        };

        setSelection = function(el, startOffset, endOffset) {
            var offsets = adjustOffsets(el, startOffset, endOffset);
            var range = el.createTextRange();
            var startCharMove = offsetToRangeCharacterMove(el, offsets.start);
            range.collapse(true);
            if (offsets.start == offsets.end) {
                range.move('character', startCharMove);
            } else {
                range.moveEnd('character', offsetToRangeCharacterMove(el, offsets.end));
                range.moveStart('character', startCharMove);
            }
            range.select();
        };

        collapseSelection = function(el, toStart) {
            var range = document.selection.createRange();
            range.collapse(toStart);
            range.select();
        };
    } else {
        getBody().removeChild(testTextArea);
        fail('No means of finding text input caret position');
        return;
    }

    // Clean up
    getBody().removeChild(testTextArea);

    deleteText = function(el, start, end, moveSelection) {
        var val;
        if (start != end) {
            val = el.value;
            el.value = val.slice(0, start) + val.slice(end);
        }
        if (moveSelection) {
            setSelection(el, start, start);
        }
    };

    deleteSelectedText = function(el) {
        var sel = getSelection(el);
        deleteText(el, sel.start, sel.end, true);
    };

    extractSelectedText = function(el) {
        var sel = getSelection(el), val;
        if (sel.start != sel.end) {
            val = el.value;
            el.value = val.slice(0, sel.start) + val.slice(sel.end);
        }
        setSelection(el, sel.start, sel.start);
        return sel.text;
    };

    insertCaret = function(el, index) {
        if ( index == null ) {
            index = el.value.length;
        }
        setSelection(el, index, index);
    };

    insertText = function(el, text, index, moveSelection) {
        var val = el.value, caretIndex;
        el.value = val.slice(0, index) + text + val.slice(index);
        if (moveSelection) {
            caretIndex = index + text.length;
            setSelection(el, caretIndex, caretIndex);
        }
    };

    replaceSelectedText = function(el, text) {
        var sel = getSelection(el), val = el.value;
        el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
        var caretIndex = sel.start + text.length;
        setSelection(el, caretIndex, caretIndex);
    };

    surroundSelectedText = function(el, before, after) {
        var sel = getSelection(el), val = el.value;

        el.value = val.slice(0, sel.start) + before + sel.text + after + val.slice(sel.end);
        var startIndex = sel.start + before.length;
        var endIndex = startIndex + sel.length;
        setSelection(el, startIndex, endIndex);
    };


    // --------------------------------------------------------
    var Klass = function(textarea) {
            this.textarea = textarea;
        },
        arraySlice = Array.prototype.slice,
        klassify = function(method) {
            return function() {
                var args = arraySlice.call(arguments, 0);
                args.unshift(this.textarea);
                return method.apply(null, args);
            };
        };

    Klass.prototype.getSelection = klassify(getSelection);
    Klass.prototype.deleteText = klassify(deleteText);
    Klass.prototype.deleteSelectedText = klassify(deleteSelectedText);
    Klass.prototype.extractSelectedText = klassify(extractSelectedText);
    Klass.prototype.insertCaret = klassify(insertCaret);
    Klass.prototype.insertText = klassify(insertText);
    Klass.prototype.replaceSelectedText = klassify(replaceSelectedText);
    Klass.prototype.surroundSelectedText = klassify(surroundSelectedText);

    return Klass;
})();
