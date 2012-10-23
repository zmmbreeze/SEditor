
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, Util:false, MathJax:false */

SEditor.usePlugin(
    'mathjax',
    function() {
        return {
            init: function(editor, option) {
                // this === editor
                if (typeof MathJax !== 'undefined') {
                    editor.on('previewUpdate', function($view) {
                        MathJax.Hub.Queue(['Typeset', MathJax.Hub, $view[0]]);
                    });
                }
            }
        };
    });
