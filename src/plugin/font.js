
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, prompt:false */

SEditor.usePlugin(
    'font',
    function() {
        return {
            title: SEditor.i18n.font,      // option
            hasButton: true,    // option
            click: function(editor) {
                // this is dom
                var font = prompt(SEditor.i18n.fontPrompt, 'Comic Sans MS');
                editor.textApi.surroundSelectedText('[font='+font+']', '[/font]');
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
