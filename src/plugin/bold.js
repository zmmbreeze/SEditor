
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true */

SEditor.usePlugin(
    'bold',
    function() {
        return {
            title: SEditor.i18n.bold,      // option
            hasButton: true,    // option
            /*
            init: function(editor, option) {
                // this === editor
            },
            */
            click: function(editor) {
                // this is dom
                editor.textApi.replaceSelectedText(function(selection) {
                    var text = selection.text,
                        l;
                    text = '[bold]' + text;
                    l = text.length;

                    if (text[l-1] === '\n') {
                        text = text.slice(0, l-1) + '[/bold]\n';
                    } else {
                        text += '[/bold]';
                    }

                    return text;
                });
                editor.fire('seditorChange');
            }
        };
    },
    // [option] ubb tag parser
    {
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
        canContains: 'bold,italic,font,color,url,image',
        // bool.
        // If true, then this tag can contains '\n'.
        canWrap: 0,
        // bool.
        // If true, then the '\n' right after this tag should be ignore.
        isBlock: 0
    });
