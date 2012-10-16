
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false, Util:false */


/**
 * plugin for making editor support fullscreen
 * add options:
 *      {
 *      }
 *
 *
 *
 *
 */
SEditor.usePlugin('fullscreen', function() {
    'use strict';
    var old,
        oldWH,
        $win = $(window);

    function updateWH(editor) {
        editor.width($win.width());
        editor.height($win.height());
    }

    function fullscreen(editor, $button) {
        if (editor.isFullscreen) {
            return;
        }
        editor.isFullscreen = true;

        var $all = editor.$all;
        // remember old css style
        old = {
            'position' : $all.css('position'),
            'top': $all.css('top'),
            'left': $all.css('left')
        };
        // update css style
        $all.css({
            'position': 'absolute',
            'top': 0,
            'left': 0
        });

        // remember old width/height
        oldWH = {
            'height': editor.height(),
            'width': editor.width()
        };
        // update width/height
        updateWH(editor);
        // set button
        $button
            .text(SEditor.i18n.unfullscreen)
            .attr('title', SEditor.i18n.unfullscreen);
        // fire event
        editor.fire('leaveFullscreen');
    }

    function unFullscreen(editor, $button) {
        if (!editor.isFullscreen) {
            return;
        }
        editor.isFullscreen = false;
        // reset css style
        editor.$all.css(old);
        // reset old width/height
        editor.width(oldWH.width);
        editor.height(oldWH.height);
        // set button
        $button
            .text(SEditor.i18n.fullscreen)
            .attr('title', SEditor.i18n.fullscreen);
        // fire event
        editor.fire('enterFullscreen');
    }

    var plugin = {
        title: SEditor.i18n.fullscreen,      // option
        hasButton: true,    // option
        init: function(editor, option) {
            $win.resize(Util.buffer(function() {
                if (editor.isFullscreen) {
                    updateWH(editor);
                }
            }));
        },
        click: function(editor) {
            // this is dom
            if (editor.isFullscreen) {
                unFullscreen(editor, $(this));
            } else {
                fullscreen(editor, $(this));
            }
        }
    };

    return plugin;
});
