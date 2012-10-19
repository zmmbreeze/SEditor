
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, prompt:false, Util:false */

SEditor.usePlugin(
    'url',
    function() {
        return {
            title: SEditor.i18n.url,      // option
            hasButton: true,    // option
            click: function(editor) {
                // this is dom
                var url = prompt(SEditor.i18n.urlPrompt, 'http://');
                if (url) {
                    editor.textApi.replaceSelectedText(function(selection) {
                        if (selection.text) {
                            return Util.wrapTextByLine(selection.text, '[url href='+url+']', '[/url]');
                        } else {
                            return '[url]' + url + '[/url]';
                        }
                    });
                }
            }
        };
    },
    // [option] ubb tag parser
    {
        parseUBB: function(node, sonString, setting) {
            var i, t, l,
                href = node.attr ? node.attr.replace(/^\ href\=/, '') : '';
            if (!node.attr) {
                // for [url]http://www.guokr.com/question/[bold]265263[/bold]/[/url]
                href = Util.getTextOfUBBNode(node);
            }
            return '<a href="' + href + '">' + sonString + '</a>';
        },
        canContains: 'bold,italic,color,font,url,image',
        canWrap: 0,
        isBlock: 0
    });

