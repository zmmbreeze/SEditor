
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, prompt:false */

SEditor.usePlugin(
    'url',
    function() {
        return {
            title: SEditor.i18n.url,      // option
            hasButton: true,    // option
            click: function(editor) {
                // this is dom
                var url = prompt(SEditor.i18n.urlPrompt, 'http://');
                editor.textApi.surroundSelectedText('[url='+url+']', '[/url]');
                editor.fire('seditorChange');
            }
        };
    },
    // [option] ubb tag parser
    {
        parseUBB: function(node, sonString, setting) {
            if (node.attr) {
                return '<span style="font-family:' + node.attr.slice(1) + ';">' + sonString + '</b>';
            } else {
                return sonString;
            }
        },
        canContains: 'bold,italic,color,font,url,image',
        canWrap: 0,
        isBlock: 0
    });

