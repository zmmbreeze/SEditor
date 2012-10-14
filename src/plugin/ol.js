
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true */

SEditor.usePlugin(
    'ol',
    function() {
        return {
            title: SEditor.i18n.ul,
            hasButton: true,
            click: function(editor) {
                // this is dom
                editor.textApi.replaceSelectedText(function(selection) {
                    var text = selection.text,
                        all = selection.all;
                    text = '[ol]\n' + text + (text[text.length-1] === '\n' ? '[/ol]' : '\n[/ol]');
                    if (all[selection.start-1] !== '\n') {
                        text = '\n' + text;
                    }
                    if (all[selection.end+1] !== '\n') {
                        text += '\n';
                    }
                    return text;
                });
                editor.fire('seditorChange');
            }
        };
    },
    // [option] ubb tag parser
    {
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
        isBlock: 1
    });

