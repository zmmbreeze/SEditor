
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true */

SEditor.usePlugin(
    'ul',
    function() {
        return {
            title: SEditor.i18n.ul,      // option
            hasButton: true,    // option
            click: function(editor) {
                // this is dom
                editor.textApi.replaceSelectedText(function(selection) {
                    var text = selection.text,
                        all = selection.all;
                    text = '[ul]\n' + text + (text[text.length-1] === '\n' ? '[/ul]' : '\n[/ul]');
                    if (all[selection.start-1] !== '\n') {
                        text = '\n' + text;
                    }
                    if (all[selection.end+1] !== '\n') {
                        text += '\n';
                    }
                    return text;
                });
            }
        };
    },
    // [option] ubb tag parser
    {
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
        isBlock: 1
    });

