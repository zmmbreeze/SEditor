
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
                if (url) {
                    editor.textApi.surroundSelectedText('[url href='+url+']', '[/url]');
                    editor.fire('seditorChange');
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
                for (i=0,l=node.length; i<l; i++) {
                    t = node[i];
                    if (t.name === '#text') {
                        href += t.value;
                    }
                }
            }
            return '<a href="' + href + '">' + sonString + '</a>';
        },
        canContains: 'bold,italic,color,font,url,image',
        canWrap: 0,
        isBlock: 0
    });

