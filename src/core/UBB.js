/**
 * UBBParser
 * @author mzhou / @zhoumm
 * @log 0.1 finish HTMLtoUBB
 *      0.2 finish UBBtoHTML
 *      0.3 fix inline/inline-block and br bug in HTMLtoUBB
 *      0.4 support white-space:pre except IE 678
 *      0.5 clear useless code
 *          remove jquery require
 *          fix UBBtoHTML whitespace convert to &nbsp;
 *          seperate tagParser
 */


/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:true, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global */

var UBB = (function () {
    'use strict';
    var Tree = {
            clone: function(node, withChildNode) {
                if (!withChildNode) {
                    withChildNode = node;
                    node = this;
                }

                if (!node.isNode) {
                    return null;
                }
                if (withChildNode) {
                    var i,l,
                        newNode = node.clone();
                    for (i=0,l=node.length; i<l; i++) {
                        if (node[i].isNode) {
                            newNode.append(node[i].clone(true));
                        }
                    }
                    return newNode;
                } else {
                    return Tree.createNode(node.name, node.attr);
                }
            },
            append: function(father, son) {
                if (!son) {
                    son = father;
                    father = this;
                }
                if (!son) {
                    return father;
                }
                if (son.parent) {
                    throw 'Node ' + son.name + ' has a parent node!';
                }
                father.push(son);
                son.parent = father;
                return father;
            },
            getDeepestChild: function(node) {
                var next;
                while (next = node[node.length-1]) {
                    node = next;
                }
                return node;
            },
            createNode: function(name, attr) {
                var n = [];
                n.isNode = true;
                n.append = Tree.append;
                n.clone = Tree.clone;
                // n.detach = Tree.detach;
                if (name) {
                    n.name = name;
                }
                if (attr) {
                    n.attr = attr;
                }
                return n;
            },
            createTextNode: function(text) {
                var textNode = Tree.createNode('#text');
                textNode.value = text;
                return textNode;
            }
        },
        upperReg = /([A-Z])/g,
        dashReg = /-([a-z])/g,
        numReg = /^-?\d/,
        numpxReg = /^-?\d+(?:px)?$/i,
        ubbTagNameReg = /\[(\/)?([a-zA-Z]+)/,
        startWhiteSpaceReg = /^[\u0020\u200B\u200A\u3000\u2000]+(?!$)/,
        startToEndWhiteSpaceReg = /^[\u0020\u200B\u200A\u3000\u2000]+/,
        whiteSpaceReg = /[\u0020\u200B\u200A\u3000\u2000]+/g,
        /*
         * Custom tags
         */
        tagsParser = {},
        blockStyle = {
            'block': 1,                             // div/p
            'table': 1,                             // table
            'table-caption': 1,                     // caption
            'table-footer-group': 1,                // tfoot
            'table-header-group': 1,                // thead
            'table-row': 1,                         // tr
            'table-row-group': 1,                   // tbody
            'list-item': 1                          // li
        },
        replacedElement = {
            'img': 1,
            'object': 1,
            'button': 1,
            'textarea': 1,
            'input': 1,
            'select': 1
        },
        preStyle = {
            'pre': 1,
            'pre-wrap': 1,
            'pre-line': 1
        },
        spaceStyle = {
            'pre': 1,
            'pre-wrap': 1
        },
        Util = {
            /**
             * is inline-block element. In IE6/7 inline replacedElement act like inline-block.
             * Can't deal with haslayout, sad.
             * @param {object} node jquery object
             * @return {boolean}
             */
            isInlineBlock: function(node, nodeName) {
                var display = Util.getComputedStyle(node, 'display');
                return !!(display === 'inline-block' || (display === 'inline' && replacedElement[nodeName]));
            },
            /**
             * if node is block a line.
             * @param {object} node jquery object
             * @return {boolean}
             */
            hasBlockBox: function(node) {
                return !!(blockStyle[Util.getComputedStyle(node, 'display')]);
            },
            /**
             * if node is keep new line
             * @param {object} node jquery object
             * @return {number}
             *                  0 not keep new line
             *                  1 keep new line except last one
             *                  2 keep new line except first and last one
             */
            isKeepNewLine: function(node, nodeName) {
                if (nodeName === 'pre' || nodeName === 'textarea') {
                    return 2;
                }
                if (preStyle[Util.getComputedStyle(node, 'white-space')]) {
                    return 1;
                }
                return 0;
            },
            /**
             * if node is keep white space
             * @param {object} node jquery object
             * @return {boolean}
             */
            isKeepWhiteSpace: function(node) {
                return !!(spaceStyle[Util.getComputedStyle(node, 'white-space')]);
            },
            /**
             * escape '[' and ']' to '\[' and '\]'
             * @param string str html string
             * @return string escaped string
             */
            ubbEscape: function(str) {
                return str.replace(/(\[|\])/g, '\\$1');
            },
            /**
             * change text state
             *
             *         0: nothing
             *         1: text and inline-block element
             *         2: br, or block element(height==0)
             *         3: block element
             *         4: inline element
             *         5: pre string trim '\n'
             *         6: pre string only trim start '\n'
             *         7: string only trim end '\n'
             *         8: not trim '\n'
             *
             *              1        |  2        |   3          |  4        |   5         |  6        | 7         | 8        |
             *         0 |  1/false  |  2/false  |   3/false    |  0/false  |   2/false   |  1/false  | 2/false   | 1/false  |
             *         1 |  1/false  |  2/false  |   3/true     |  1/false  |   NaN       |  NaN      | 2/false   | 1/false  |
             *         2 |  1/true   |  2/true   |   3/true     |  2/false  |   NaN       |  NaN      | 2/true    | 1/true   |
             *         3 |  1/true   |  2/true   |   3/true     |  3/false  |   NaN       |  NaN      | 2/true    | 1/true   |
             *
             * @param {object} boxState
             * @param {number} incomming incomming element type
             */
            changeState: function(boxState, incomming, re) {
                var node = boxState.node,
                    key = boxState.key,
                    count,
                    newLineRules = {
                        0: {1:0, 2:0, 3:0, 4:0, 5:0, 6:0, 7:0, 8:0},
                        1: {1:0, 2:0, 3:1, 4:0,           7:0, 8:0},
                        2: {1:1, 2:1, 3:1, 4:0,           7:1, 8:1},
                        3: {1:1, 2:1, 3:1, 4:0,           7:1, 8:1}
                    },
                    convertRules = {
                        1: 1,
                        2: 2,
                        3: 3,
                        5: 2,
                        6: 1,
                        7: 2,
                        8: 2
                    };

                count = newLineRules[key][incomming];
                if (count && node) {
                    // add new line
                    node.suffix = (node.suffix || '') + '\n';
                }
                if (incomming in convertRules) {
                    boxState.key = convertRules[incomming];
                    boxState.node = re;
                }
            },
            /**
             * parse jquery node to ubb text
             * @param {object} node jquery object
             * @param {string} nodeName
             * @param {string} nodeType
             * @param {object} setting
             * @param {object} re
             * @param {object} state
             * @return {string} ubb text of node and it's children
             */
            parseNode: function(node, nodeName, nodeType, setting, re, state) {
                var tagName, tagParser, text, inCommingState,
                    keepNewLine, keepWhiteSpace,
                    trimStartNewLine, trimEndNewLine,
                    boxStates = state.boxStates,
                    textStates = state.textStates,
                    boxState = boxStates[boxStates.length - 1],
                    textState = textStates[textStates.length - 1];

                switch(nodeType) {
                // comments
                case 8:
                    return;
                // text
                case 3:
                    text = node.nodeValue.replace(/\r\n/g, '\n');
                    keepNewLine = textState.keepNewLine;
                    keepWhiteSpace = textState.keepWhiteSpace;

                    if (!keepNewLine) {
                        // trim \n
                        // \n ==> ''
                        text = text.replace(/^\n|\n$/g, '')
                                   .replace(/\n/g, ' ');
                    }

                    if (!keepWhiteSpace) {
                        // whitespace == \u0020, charCode == 32
                        // zero advance width space == \u200B
                        // fixed-width spaces == \u200A || \u3000 || \u2000
                        // non-breaking space(&nbsp;) == \u00A0, charCode == 160

                        // trim whitespace
                        // collapse whitespace
                        // keep nont-breaking space


                        // previous node is not inline element
                        if (boxState.key !== 1) {
                            // trim start whitespace
                            //      if text are all whitespace,
                            //      then keep last whitespace
                            text = text.replace(startWhiteSpaceReg, '');
                            // reset collapseTextNode
                            boxState.collapseTextNode = null;
                        // if collapse with previous text node
                        } else if (boxState.collapseTextNode) {
                            // if  text like 'xxx'
                            //     text ==> 'xxx '
                            // if  text equal ' '
                            //     not change
                            if (boxState.collapseTextNode.text.slice(-1) !== ' ') {
                                boxState.collapseTextNode.text += ' ';
                            }
                            // trim start whitespace
                            text = text.replace(startToEndWhiteSpaceReg, '');
                        } else {
                            // collapse start whitespace
                            text = text.replace(startToEndWhiteSpaceReg, ' ');
                        }

                        // collapse whitespace
                        text = text.replace(whiteSpaceReg, ' ');

                        // collapse other whitespace
                        if (text.slice(-1) === ' ') {
                            // if  text like 'xxx '
                            //     text ==> 'xxx'
                            // if  text equal ' '
                            //     text ==> ' '
                            if (text.length !== 1) {
                                text = text.slice(0, -1);
                            }
                            boxState.collapseTextNode = re;
                        } else {
                            boxState.collapseTextNode = null;
                        }
                    } else {
                        if (boxState.collapseTextNode) {
                            boxState.collapseTextNode.text += ' ';
                        }
                        // reset collapseTextNode
                        boxState.collapseTextNode = null;
                    }

                    text = Util.ubbEscape(text);
                    if (text === '') {
                        return;
                    }

                    trimStartNewLine = (keepNewLine === 2) && (text.slice(0, 1) === '\n') && (boxState.key === 0);
                    trimEndNewLine = keepNewLine && (text.length > 1) && (text.slice(-1) === '\n');

                    if (!keepWhiteSpace) {
                        re.text = text;
                        // not keep new line
                        Util.changeState(boxState, 1, re);
                    } else {
                        if (text === '\n') {
                            re.text = '';
                            if (trimStartNewLine) {
                                // ignore first '\n'
                                Util.changeState(boxState, 6, re);
                            } else {
                                // keep '\n'
                                Util.changeState(boxState, 8, re);
                            }
                        } else {
                            if (trimStartNewLine && trimEndNewLine) {
                                // \naaaa\n or \n\n
                                re.text = text.slice(1, -1);
                                Util.changeState(boxState, 5, re);
                            } else if (trimStartNewLine) {
                                // \naaaa
                                re.text = text.slice(1);
                                Util.changeState(boxState, 6, re);
                            } else if (trimEndNewLine) {
                                // aaaa\n
                                re.text = text.slice(0, -1);
                                Util.changeState(boxState, 7, re);
                            } else {
                                // aaaa
                                re.text = text;
                                Util.changeState(boxState, 1, re);
                            }
                        }
                    }
                    break;
                // element
                case 1:
                    if (nodeName === 'br') {
                        // br
                        inCommingState = 2;
                    } else {
                        if (re.hasBlockBox) {
                            if (node.offsetHeight > 0) {
                                // block element
                                inCommingState = 3;
                            } else {
                                // <div></div>
                                inCommingState = 2;
                            }
                        } else {
                            // inline element
                            inCommingState = Util.isInlineBlock(node, nodeName) ? 1 : 4;
                        }
                    }

                    Util.changeState(boxState, inCommingState, re);
                    break;
                default:
                    break;
                }

                for (tagName in setting.tags) {
                    tagParser = setting.tags[tagName];
                    if (tagParser.parseHTML) {
                        tagParser.parseHTML(nodeName, node, re, setting);
                    }
                }

                return re;
            },
            /**
             * convert abstract node tree to UBB string
             * @param {object} re root abstract node
             * @return {string} UBB string
             */
            treeToUbb: function(re) {
                var i, l, child,
                    texts = [(re.prefix || '')];
                // is text
                if (re.text) {
                    texts.push(re.text);
                }
                // has children
                for (i=0,l=re.length; i<l; i++) {
                    child = re[i];
                    texts.push(Util.treeToUbb(child));
                }
                texts.push(re.suffix || '');
                return texts.join('');
            },
            /**
             * can father contains son
             * @param {object} father father tag
             * @param {object} son son tag
             * @param {object} ubbTagsOrder prioritys for all tags
             * @return {boolean}
             */
            canContains: function(father, son, ubbTagsOrder) {
                var canContainsTags = ubbTagsOrder[father.name];
                return typeof canContainsTags === 'boolean' ? canContainsTags : canContainsTags[son.name];
            },
            /**
             * push open ubb tag into stack
             * @param {array} node
             * @param {object} tag tags to be push
             * @param {object} ubbTagsOrder
             */
            pushOpenUbbTag: function(node, tag, ubbTagsOrder) {
                var autoClosedNode;
                while (!node.isRoot && !Util.canContains(node, tag, ubbTagsOrder)) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                node.append(tag);
                // if has autoClosedNode and tag can contains them, then complete immediately
                if (autoClosedNode && Util.canContains(tag, autoClosedNode, ubbTagsOrder)) {
                    tag.append(autoClosedNode);
                    return Tree.getDeepestChild(autoClosedNode);
                // or complete later
                } else {
                    return tag;
                }
            },
            /**
             * push close ubb tag into stack
             * @param {array} node
             * @param {string} tagName
             */
            pushCloseUbbTag: function(node, tagName) {
                var autoClosedNode;
                while (!node.isRoot && node.name !== tagName) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                if (node.isRoot) {
                    // ignore this tag
                    return node;
                } else {
                    // autoClose
                    node = node.parent;
                    node.append(autoClosedNode);
                    return autoClosedNode ? Tree.getDeepestChild(autoClosedNode) : node;
                }
            },
            /**
             * push '\n'
             * @param {object} node
             * @param {object} wrapUbbTags canWrap value
             */
            pushLineUbbTag: function(node, wrapUbbTags) {
                var autoClosedNode;
                while (!node.isRoot && !wrapUbbTags[node.name]) {
                    if (autoClosedNode) {
                        autoClosedNode = node.clone().append(autoClosedNode);
                    } else {
                        autoClosedNode = node.clone();
                    }
                    node = node.parent;
                }

                node.append(Tree.createTextNode('\n'));
                // if can contains then complete immediately
                node.append(autoClosedNode);
                return autoClosedNode ? Tree.getDeepestChild(autoClosedNode) : node;
            },
            /**
             * html encode
             * @param {string} str html string
             * @return {string} encoded html string
             */
            htmlEncode: function (str) {
                if (str) {
                    str = str.replace(/&/igm, '&amp;');
                    str = str.replace(/</igm, '&lt;');
                    str = str.replace(/>/igm, '&gt;');
                    str = str.replace(/\"/igm, '&quot;');
                }
                return str;
            },
            /**
             * scan ubb text into tag list
             * @param {string} text ubb text
             * @param {object} ubbTagsOrder
             * @param {object} wrapUbbTags
             * @param {boolean} needEncodeHtml
             * @return {array} tag list
             */
            scanUbbText: function(text, setting, needEncodeHtml) {
                // encode html
                if (needEncodeHtml) {
                    text = Util.htmlEncode(text);
                }
                text = text.replace(/\r\n/g, '\n'); // for IE hack
                var c, r, tagName, tag, prevOpenTag, attr, isClose,
                    ubbTagsOrder = setting.ubbTagsOrder,
                    wrapUbbTags = setting.wrapUbbTags,
                    // state value represent next char not be escape
                    NOESCAPE = 0,
                    // state value represent next char should be escape
                    ESCAPE = 1,
                    // state value
                    state = NOESCAPE,
                    j = 0,
                    i = 0,
                    l = text.length,
                    buf = '',
                    root = Tree.createNode(),
                    node = root;
                // mark root
                root.isRoot = true;
                for(; i<l; i++) {
                    c = text.charAt(i);
                    switch(c) {
                    case '\\':
                        state = ESCAPE;
                        break;
                    case '[':
                        if (state === ESCAPE) {
                            buf += '[';
                            state = NOESCAPE;
                        } else {
                            if (buf) {
                                node.append(Tree.createTextNode(buf));
                            }
                            buf = '[';
                        }
                        break;
                    case ']':
                        if (state === ESCAPE) {
                            buf += ']';
                            state = NOESCAPE;
                        } else {
                            r = ubbTagNameReg.exec(buf);
                            // is tag
                            if (r && r[2] && ((tagName = r[2].toLowerCase()) in ubbTagsOrder)) {
                                // new tag
                                isClose = !!r[1];
                                if (!isClose) {
                                    attr = buf.slice(r[2].length + (r[1] ? 2 : 1));
                                    tag = Tree.createNode(tagName, attr);
                                }

                                // close
                                if (isClose) {
                                    node = Util.pushCloseUbbTag(node, tagName);
                                // open
                                } else {
                                    node = Util.pushOpenUbbTag(node, tag, ubbTagsOrder);
                                }
                            // not tag
                            } else {
                                node.append(Tree.createTextNode(buf + ']'));
                            }
                            buf = '';
                        }
                        break;
                    case '\n':
                        if (state === ESCAPE) {
                            state = NOESCAPE;
                        }
                        if (buf) {
                            node.append(Tree.createTextNode(buf));
                            buf = '';
                        }
                        node = Util.pushLineUbbTag(node, wrapUbbTags);
                        break;
                    default:
                        if (state === ESCAPE) {
                            state = NOESCAPE;
                        }
                        buf += c;
                        break;
                    }
                }
                if (buf) {
                    node.append(Tree.createTextNode(buf));
                }

                return root;
            },
            /**
             * parse ubb node to ubb text
             * @param {object} node ubb node
             * @param {string} sonString the ubb text of node's children
             * @param {object} setting
             * @param {object} state
             * @return {string} html text of node and it's children
             */
            parseUbbNode: function(node, sonString, setting, state) {
                var tagsParser = setting.tags,
                    tagInfo;
                if (node.name === '#text') {
                    if (node.value === '\n') {
                        if (state.nobr) {
                            state.nobr = false;
                            return '';
                        } else {
                            return '<br/>';
                        }
                    } else {
                        state.nobr = false;
                        return node.value.replace(/\s/g, '&nbsp;');
                    }
                } else if ((tagInfo = tagsParser[node.name]) && tagInfo.parseUBB) {
                    if (tagInfo.isBlock) {
                        state.nobr = true;
                    }
                    return tagInfo.parseUBB(node, sonString, setting);
                }
            },
            /**
             * fix ubb node to ubb text
             * @param {object} node ubb node
             * @param {string} sonString the ubb text of node's children
             * @param {object} setting
             * @return {string} ubb text of node and it's children
             */
            fixUbbNode: function(node, sonString, setting) {
                if (node.name === '#text') {
                    return Util.ubbEscape(node.value);
                } else {
                    return '['+node.name+(node.attr || '')+']'+sonString+'[/'+node.name+']';
                }
            }
        },
        /**
         * parse jquery node into html
         * @param {object} node dom object, must be a block element
         * @param {object} setting
         * @param {object} parent jquery object
         * @return {string} ubb text
         */
        parseHtml = function(node, setting, state, notRoot) {
            var i, l, j, jl, child,
                re = Tree.createNode(),
                nodeType = node.nodeType,
                nodeName = node.nodeName.toLowerCase(),
                children = node.childNodes;
            // init
            if (!state) {
                state = {};
                state.boxStates = [];      // record the block box state
                state.textStates = [];     // record the text state: keepNewLine and keepWhiteSpace
            }

            // push state
            if (nodeType === 1) {
                // element has block box
                if (!notRoot || Util.hasBlockBox(node)) {
                    state.boxStates.push({
                        key: 0,
                        node: null
                    });
                    re.hasBlockBox = true;
                }
                state.textStates.push({
                    keepNewLine: Util.isKeepNewLine(node, nodeName),
                    keepWhiteSpace: Util.isKeepNewLine(node)
                });
            }

            // parse children
            for (i=0,l=children.length; i<l; i++) {
                child = parseHtml(children[i], setting, state, true);
                // add relationship
                if (child) {
                    re.append(child);
                }
            }

            // pop state
            if (nodeType === 1) {
                state.textStates.pop();
            }
            if (re.hasBlockBox) {
                state.boxStates.pop();
            }

            // make sure container not to be parsed
            if (notRoot) {
                return Util.parseNode(node, nodeName, nodeType, setting, re, state);
            } else {
                // change tree to ubb string
                return Util.treeToUbb(re);
            }
        },
        /**
         * parse ubb text into html text
         * @param {object} node
         * @param {object} setting
         * @param {object} state
         * @return {string} html text
         */
        parseUbb = function(node, setting, state) {
            var i, l,
                re = [];
            state = state || {};

            if (node.isNode) {
                for (i=0,l=node.length; i<l; i++) {
                    re.push(parseUbb(node[i], setting, state));
                }
            }

            // root node has no meaning
            if (!node.isRoot) {
                return Util.parseUbbNode(node, re.join(''), setting, state);
            } else {
                return re.join('');
            }
        },
        /**
         * auto complete ubb string
         * fix error placed tags
         * @param {object} node
         * @param {object} setting
         * @param {object} state
         * @return {string} fixed ubb string
         */
        fixUbb = function(node, setting, state) {
            var i, l,
                re = [];
            state = state || {};

            if (node.isNode) {
                for (i=0,l=node.length; i<l; i++) {
                    re.push(fixUbb(node[i], setting, state));
                }
            }

            // root node has no meaning
            if (!node.isRoot) {
                return Util.fixUbbNode(node, re.join(''), setting, state);
            } else {
                return re.join('');
            }
        };


    /**
     * get css style
     * copy from jquery src: https://github.com/jquery/jquery/blob/1.4.4/src/css.js
     *
     * @param {object} node dom element
     * @param {string} cssStyleName
     * @return {string} style
     */
    if (document.defaultView && document.defaultView.getComputedStyle) {
        Util.getComputedStyle = function(node, cssStyleName) {
            var computedStyle, re,
                defaultView = node.ownerDocument.defaultView;
            if (!defaultView) {
                return;
            }
            cssStyleName = cssStyleName.replace(upperReg, '-$1').toLowerCase();
            computedStyle = defaultView.getComputedStyle(node, null);
            if (computedStyle) {
                re = computedStyle.getPropertyValue(cssStyleName);
            }
            return re;
        };
    } else {
        Util.getComputedStyle = function(node, cssStyleName) {
            cssStyleName = cssStyleName.replace(dashReg, function($1) {
                return $1.charAt(1).toUpperCase();
            });
            var left, rsLeft,
                re = node.currentStyle && node.currentStyle[ cssStyleName ],
                style = node.style;

            // From the awesome hack by Dean Edwards
            // http://erik.eae.net/archives/2007/07/27/18.54.15/#comment-102291

            // If we're not dealing with a regular pixel number
            // but a number that has a weird ending, we need to convert it to pixels
            if ( !numpxReg.test( re ) && numReg.test( re ) ) {
                // Remember the original values
                left = style.left;
                rsLeft = node.runtimeStyle.left;

                // Put in the new values to get a computed value out
                node.runtimeStyle.left = node.currentStyle.left;
                style.left = cssStyleName === 'fontSize' ? '1em' : (re || 0);
                re = style.pixelLeft + 'px';

                // Revert the changed values
                style.left = left;
                node.runtimeStyle.left = rsLeft;
            }

            return re === '' ? 'auto' : re.toString();
        };
    }

    /**
     *  var ubbParser = new UBB();
     *  @param {object} setting
     */
    function UBB(setting) {
        this.setting = UBB.mix({
                            defaultColor: '#000000',            // color of all text element
                            linkDefaultColor: '#006699',        // color of a elment
                            flashImage: '/skin/imgs/flash.png'  // flash image to show
                       }, setting);
        this.setting.tags = UBB.mix(tagsParser, this.setting.tags);
        this.setting.ubbTagsOrder = {};
        this.setting.wrapUbbTags = {};
        // generate tag ubbTagsOrder and wrapUbbTags
        //      ubbTagsOrder:
        //          {
        //              blockquote: true,       // can contain every tags
        //              image: false,           // can't contain tag include self
        //              bold: {                 // can contain bold and image tag
        //                  bold: true,
        //                  image: true
        //              }
        //          }
        //      wrapUbbTags:
        //          {
        //              blockquote: 1,          // can contain new line
        //              bold: 0,                // can't contain new line
        //              image: 0                // can't contain new line
        //          }
        var k, v, i, l, tagNames, order;
        setting = this.setting;
        for (k in setting.tags) {
            v = setting.tags[k];
            switch (v.canContains) {
            case '*':
                setting.ubbTagsOrder[k] = true;
                break;
            case '':
                setting.ubbTagsOrder[k] = false;
                break;
            case undefined:
                setting.ubbTagsOrder[k] = false;
                break;
            default:
                tagNames = v.canContains.split(',');
                order = {};
                for (i=0,l=tagNames.length; i<l; i++) {
                    order[tagNames[i].toLowerCase()] = true;
                }
                setting.ubbTagsOrder[k] = order;
                break;
            }
            setting.wrapUbbTags[k] = v.canWrap;
        }
    }
    /**
     * Util.extend(obj, {newMethod: 'a'});
     * @param {object} object
     * @param {object} source
     */
    UBB.extend = function(object, source) {
        var method;
        for (method in source) {
            if (source.hasOwnProperty(method)) {
                object[method] = source[method];
            }
        }
    };
    /**
     * add or modify tags
     * @param {object} tags
     */
    UBB.addTags = function(tags) {
        UBB.extend(tagsParser, tags);
    };
    /**
     * obj = Util.mix({method: 'b'}, {newMethod: 'a'});
     * @param {object} object
     * @param {object} object2
     * @return {object} newObject
     */
    UBB.mix = function(object, object2) {
        var method,
            re = {};
        UBB.extend(re, object);
        UBB.extend(re, object2);
        return re;
    };
    UBB.Util = Util;
    /**
     * @param {object} dom dom object must be a block element
     * @return {string} ubb text
     */
    UBB.prototype.HTMLtoUBB = function (dom) {
        if (dom.nodeType === 1 ) {
            return this.fixUBB(parseHtml(dom, this.setting));
        } else {
            return '';
        }
    };
    /**
     * @param {string} ubb text
     * @return {string} html text
     */
    UBB.prototype.UBBtoHTML = function(ubb) {
        return parseUbb(Util.scanUbbText(ubb, this.setting, true), this.setting);
    };
    /**
     * fix error ubb text
     * @param {string} ubb text
     * @return {string} fixed ubb text
     */
    UBB.prototype.fixUBB = function(ubb) {
        return fixUbb(Util.scanUbbText(ubb, this.setting), this.setting);
    };
    return UBB;
})();


/**
 * UBBParser
 * @author mzhou / @zhoumm
 * @log 0.1
 */
(function() {
    'use strict';
    UBB.extend(UBB.Util, {
        /**
         * if fontWeight is bold
         * @param {string} fontWeight
         * @return {boolean}
         */
        isBold: function(fontWeight) {
            var number = parseInt(fontWeight, 10);
            if(isNaN(number)) {
                return (/^(bold|bolder)$/).test(fontWeight);
            } else {
                return number > 400;
            }
        },
        /**
         * if fontStyle is italic
         * @param {string} fontStyle
         * @return {boolean}
         */
        isItalic: function(fontStyle) {
            return (/^(italic|oblique)$/).test(fontStyle);
        },
        /**
         * change RGB to HEX
         * @param {string} oldColor rbg color
         * @return {string} hex color
         */
        RGBtoHEX: function (oldColor) {
            var i,
                RGB2HexValue = '',
                numbers,
                regExp = /([0-9]+)[, ]+([0-9]+)[, ]+([0-9]+)/,
                array = regExp.exec(oldColor);
            if (!array) {
                if (oldColor.length === 4) {
                    numbers = oldColor.split('').slice(1);
                    RGB2HexValue = '#';
                    for (i=0; i<3; i++) {
                        RGB2HexValue += numbers[i]+numbers[i];
                    }
                } else {
                    RGB2HexValue = oldColor;
                }
            } else {
                for (i = 1; i < array.length; i++) {
                    RGB2HexValue += ('0' + parseInt(array[i], 10).toString(16)).slice(-2);
                }
                RGB2HexValue = '#' + RGB2HexValue;
            }
            return RGB2HexValue;
        }
    });
    var Util = UBB.Util;
    UBB.addTags({
        // lowerCase tag name
        bold: {
            /**
             * parse html node to UBB text
             * @param {string} nodeName nodeName
             * @param {object} node jquery object
             * @param {string} re abstract node
             * @param {object} setting
             * @return {string} ubb text of node and it's children
             */
            parseHTML: function(nodeName, node, re) {
                if (nodeName === '#text') {
                    if (Util.isBold(Util.getComputedStyle(node.parentNode, 'font-weight'))) {
                        re.prefix = '[bold]' + (re.prefix || '');
                        re.suffix = (re.suffix || '') + '[/bold]';
                    }
                }
            },
            /**
             * parse UBB text to HTML text
             * @param {object} node object represent ubb tag.
             *                     eg:
             *                         tree node
             *                         string tag: 'This is a text'; (It's not contains '\n')
             *                         \n tag: '\n'.
             * @param {string} sonString
             * @param {object} setting
             * @return {string} html text
             */
            parseUBB: function(node, sonString, setting) {
                return '<b>' + sonString + '</b>';
            },
            // string.
            // Specified which tag can be contained.
            // '' or undefined indicate it can't contian any tag.
            // '*' indicate it can contian any tag.
            canContains: 'bold,italic,color,url,image',
            // bool.
            // If true, then this tag can contains '\n'.
            canWrap: 0,
            // bool.
            // If true, then the '\n' right after this tag should be ignore.
            isBlock: 0,
            noAttr: 1
        },
        italic: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === '#text') {
                    if (Util.isItalic(Util.getComputedStyle(node.parentNode, 'font-style'))) {
                        re.prefix = '[italic]' + (re.prefix || '');
                        re.suffix = (re.suffix || '') + '[/italic]';
                    }
                }
            },
            parseUBB: function(node, sonString, setting) {
                return '<i>' + sonString + '</i>';
            },
            canContains: 'bold,italic,color,url,image',
            canWrap: 0,
            isBlock: 0,
            noAttr: 1
        },
        color: {
            parseHTML: function(nodeName, node, re, setting) {
                if (nodeName === '#text') {
                    var color,
                        container = node.parentNode;
                    color = Util.RGBtoHEX(Util.getComputedStyle(container, 'color'));
                    if (color && color !== setting.defaultColor && !(container.nodeName.toLowerCase() === 'a' && color === setting.linkDefaultColor)) {
                        re.prefix = '[color='+color+']' + (re.prefix || '');
                        re.suffix = (re.suffix || '') + '[/color]';
                    }
                }
            },
            parseUBB: function(node, sonString, setting) {
                return '<span style="color:'+(node.attr ? node.attr.slice(1) : '')+';">' + sonString + '</span>';
            },
            canContains: 'bold,italic,color,url,image',
            canWrap: 0,
            isBlock: 0,
            noAttr: 0
        },
        url: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'a') {
                    re.prefix = '[url href=' + node.getAttribute('href') + ']' + (re.prefix || '');
                    re.suffix = (re.suffix || '') + '[/url]';
                }
            },
            parseUBB: function(node, sonString, setting) {
                var i, t, l,
                    href = node.attr ? node.attr.replace(/^\ href\=/, '') : '';
                if (!node.attr) {
                    // for [url]http://www.guokr.com/question/[bold]265263[/bold]/[/url]
                    for (i=0,l=node.length; i<l; i++) {
                        t = node[i];
                        if (t.name === '#text') {
                            href += t.value;
                        }
                    }
                }
                return '<a href="' + href + '">' + sonString + '</a>';
            },
            canContains: 'bold,italic,color,url,image',
            canWrap: 0,
            isBlock: 0,
            noAttr: 0
        },
        image: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'img' && !node.getAttribute('data-src')) {
                    re.prefix = '[image]' + node.getAttribute('src') + '[/image]' + (re.prefix || '');
                }
            },
            parseUBB: function(node, sonString, setting) {
                return sonString ? ('<img src="' + sonString + '"/>') : '';
            },
            canWrap: 0,
            isBlock: 0,
            noAttr: 1
        },
        video: {
            parseHTML: function(nodeName, node, re) {
                var src;
                if (nodeName === 'img' && (src = node.getAttribute('data-src'))) {
                    re.prefix = '[video]' + src + '[/video]' + (re.prefix || '');
                }
            },
            parseUBB: function(node, sonString, setting) {
                return sonString ? ('<img class="gui-ubb-flash" data-src="'+sonString+'" src="'+setting.flashImage+'" width="480" height="400"/>') : '';
            },
            canWrap: 0,
            isBlock: 0,
            noAttr: 1
        },
        flash: {
            parseUBB: function(node, sonString, setting) {
                return sonString ? ('<img class="gui-ubb-flash" data-src="'+sonString+'" src="'+setting.flashImage+'" width="480" height="400"/>') : '';
            },
            canWrap: 0,
            isBlock: 0,
            noAttr: 1
        },
        blockquote: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'blockquote') {
                    re.prefix = '[blockquote]' + (re.prefix || '');
                    re.suffix = (re.suffix || '') + '[/blockquote]';
                }
            },
            parseUBB: function(node, sonString, setting) {
                return '<blockquote>' + sonString + '</blockquote>';
            },
            canContains: '*',
            canWrap: 1,
            isBlock: 1,
            noAttr: 1
        },
        ul: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'ul') {
                    re.prefix = '[ul]\n' + (re.prefix || '');
                    re.suffix = (re.suffix || '') + '\n[/ul]';
                }
            },
            parseUBB: function(node, sonString, setting) {
                var i = 0,
                    strs = sonString.split('<br/>'),
                    j = strs[0] ? 0 : 1,
                    l = strs[strs.length-1] ? 0 : -1,
                    newStrs = [];
                l += strs.length;
                for (; j<l; i++, j++) {
                    newStrs[i] = strs[j];
                }
                return '<ul><li>' + newStrs.join('</li><li>') + '</li></ul>';
            },
            canContains: '*',
            canWrap: 1,
            isBlock: 1,
            noAttr: 1
        },
        ol: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'ol') {
                    re.prefix = '[ol]\n' + (re.prefix || '');
                    re.suffix = (re.suffix || '') + '\n[/ol]';
                }
            },
            parseUBB: function(node, sonString, setting) {
                var i = 0,
                    strs = sonString.split('<br/>'),
                    j = strs[0] ? 0 : 1,
                    l = strs[strs.length-1] ? 0 : -1,
                    newStrs = [];
                l += strs.length;
                for (; j<l; i++, j++) {
                    newStrs[i] = strs[j];
                }
                return '<ol><li>' + newStrs.join('</li><li>') + '</li></ol>';
            },
            canContains: '*',
            canWrap: 1,
            isBlock: 1,
            noAttr: 1
        },
        ref: {
            parseHTML: function(nodeName, node, re) {
                if (nodeName === 'div' && node.className === 'gui-ubb-ref') {
                    re.prefix = '[ref]' + (re.prefix || '');
                    re.suffix = (re.suffix || '') + '[/ref]';
                }
            },
            parseUBB: function(node, sonString, setting) {
                return '<div class="gui-ubb-ref">' + sonString + '</div>';
            },
            canWrap: 0,
            isBlock: 1,
            noAttr: 1
        }
    });
})();