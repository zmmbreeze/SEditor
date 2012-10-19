

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, prompt:false, Util:false */

SEditor.usePlugin(
    'video',
    function() {
        return {
            title: SEditor.i18n.video,      // option
            hasButton: true,    // option
            click: function(editor) {
                // this is dom
                var url = prompt(SEditor.i18n.videoPrompt, 'http://'),
                    selection = editor.textApi.getSelection();
                if (url) {
                    editor.textApi.insertText('[video]' + url + '[/video]', selection.end, true);
                }
            }
        };
    },
    // [option] ubb tag parser
    {
        parseUBB: function(node, sonString, setting) {
            sonString = Util.getTextOfUBBNode(node);
            return sonString ? ('<img src="' + sonString + '"/>') : '';
        },
        canWrap: 0,
        isBlock: 0
    });


