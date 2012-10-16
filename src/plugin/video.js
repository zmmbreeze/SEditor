

/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, prompt:false */

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
        parseHTML: function(nodeName, node, re) {
            if (nodeName === 'img' && !node.getAttribute('data-src')) {
                re.prefix = '[image]' + node.getAttribute('src') + '[/image]' + (re.prefix || '');
            }
        },
        parseUBB: function(node, sonString, setting) {
            return sonString ? ('<img src="' + sonString + '"/>') : '';
        },
        canWrap: 0,
        isBlock: 0
    });


