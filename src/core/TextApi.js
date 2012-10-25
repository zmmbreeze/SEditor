/**
 * TextApi class
 *
 * 修改自：http://code.google.com/p/rangyinputs/
 * @author mzhou
 * @log 0.1 add insertCaret api
 *      0.2 remove jquery require
 *      0.3 replaceSelectedText api add transform function support
 *      0.4 add all value for getSelection's return value
 *      0.5 add detectSelectionChangeEvent
 *
 * License Rangy Text Inputs, a cross-browser textarea and text input library plug-in for jQuery.
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
/*global Proto:false, Util:false, $:false */

var TextApi = (function() {
    'use strict';
    var UNDEF = 'undefined';
    var getSelection, setSelection, deleteSelectedText, deleteText, insertText;
    var replaceSelectedText, surroundSelectedText, extractSelectedText, collapseSelection, insertCaret, getCaretPosition;

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
        var v = el.value;
        return {
            start: start,
            end: end,
            length: end - start,
            text: v.slice(start, end),
            all: v
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

    // getCaretPosition
    if (isHostObject(document, 'selection') && isHostMethod(document.selection, 'createRange')) {
        getCaretPosition = function(el) {
            $(el).focus();
            var range = document.selection.createRange(),
                elementOffset = $(el).offset();
            range.collapse(false);
            return {
                left: range.boundingLeft - elementOffset.left,
                top: range.boundingTop - elementOffset.top + el.scrollTop
            };
        };
    } else {
        getCaretPosition = function(el) {
            var $textDiv = $(el).prev('[data-type="textDiv"]'),
                caretSpan = '<span>1</span>',
                $caretSpan,
                sel,
                val,
                offset,
                elementOffset,
                scroll;
            if(!$textDiv.length) {
                var textDivHTML = '<div data-type="textDiv" style="'+
                                  'position: absolute;' +
                                  'z-index: -999;' +
                                  'overflow: hidden;' +
                                  'visiable: hidden;' +
                                  'opacity: 0;' +
                                  'white-space: pre-wrap;' +
                                  'word-wrap: break-word;' +
                                  '"></div>',
                    style = [
                        'fontFamily',
                        'fontSize',
                        'fontWeight',
                        'fontVariant',
                        'fontStyle',
                        'line-height',
                        'text-align',
                        'outline',
                        'paddingTop',
                        'paddingRight',
                        'paddingLeft',
                        'paddingBottom',
                        'marginTop',
                        'marginRight',
                        'marginBottom',
                        'marginLeft',
                        'borderTopStyle',
                        'borderTopWidth',
                        'borderRightStyle',
                        'borderRightWidth',
                        'borderBottomStyle',
                        'borderBottomWidth',
                        'borderLeftStyle',
                        'borderLeftWidth'
                    ];
                $textDiv = $(textDivHTML);
                $(el).before($textDiv);
                $.each(style, function(i, n){
                    $textDiv.css(n, $(el).css(n));
                });
            }

            scroll = el.scrollHeight > $(el).innerHeight() ? 'scroll':'';
            $textDiv.css({
                'width': $(el).css('width'),
                'height': $(el).css('height'),
                'overflow-y': scroll
            });
            $(el).focus();
            sel = getSelection(el);
            if (sel.start != sel.end) {
                val = el.value;
                el.value = val.slice(0, sel.start) + val.slice(sel.end);
            }
            setSelection(el, 0, sel.start);
            sel = getSelection(el);
            collapseSelection(el, false);
            $textDiv.html(sel.text + caretSpan);
            $caretSpan = $textDiv.children('span:last');
            offset = $caretSpan.offset();
            elementOffset = $(el).offset();
            return {
                left: offset.left - elementOffset.left,
                top: offset.top - elementOffset.top - el.scrollTop
            };
        };
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

    /**
     * replace selected text
     *
     * @param {object} el dom
     * @param {string/function} text replacement
     *                               function (selection) {
     *                                  return selection.text.slice(1);
     *                               }
     * @param {number} length sel.start change index
     */
    replaceSelectedText = function(el, text, length) {
        var sel = getSelection(el),
            val = el.value,
            caretIndex;
        text = typeof text === 'string' ? text : text(sel);
        el.value = val.slice(0, sel.start) + text + val.slice(sel.end);
        if(length) {
            setSelection(el, sel.start + length, sel.end + length);
        } else {
            caretIndex = sel.start + text.length;
            setSelection(el, sel.start, caretIndex);
        }
    };

    surroundSelectedText = function(el, before, after) {
        var sel = getSelection(el), val = el.value;

        el.value = val.slice(0, sel.start) + before + sel.text + after + val.slice(sel.end);
        var startIndex = sel.start + before.length;
        var endIndex = startIndex + sel.length;
        setSelection(el, startIndex, endIndex);
    };


    // --------------------------------------------------------
    var Klass = function(textarea, editor) {
            this.textarea = textarea;
            this.editor = editor;
        },
        arraySlice = Array.prototype.slice,
        klassify = function(method) {
            return function() {
                var args = arraySlice.call(arguments, 0),
                    re;
                args.unshift(this.textarea);
                re = method.apply(null, args);
                this.editor.fire('textChange', this.editor);
                return re;
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
    Klass.prototype.getCaretPosition = klassify(getCaretPosition);

    /**
     * start detect selectionChange event
     */
    Klass.prototype.detectSelectionChangeEvent = function() {
        if (!this._selectionChangeBinded) {
            // don't use selectionchange event it will cause ie bug
            var self = this,
                timeout = function() {
                    var o = self.selection,
                        n = self.getSelection();
                    if (!o || (o.start !== n.start) || (o.end !== n.end)) {
                        self.selection = n;
                        self.editor.fire('selectionChange');
                    }

                    self._selectionChangeTimeout = setTimeout(timeout, 500);
                };
            self._selectionChangeTimeout = setTimeout(timeout, 500);
            self._selectionChangeBinded = true;
        }
    };
    /**
     * stop detect selectionChange event
     */
    Klass.prototype.cancelSelectionChangeEvent = function() {
        if (this._selectionChangeBinded) {
            clearTimeout(this._selectionChangeTimeout);
        }
    };

    return Klass;
})();
