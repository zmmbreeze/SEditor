
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false, Util:false */


/**
 * plugin for preview UBB
 * add options:
 *      {
 *          viewHtml: '<div class="seditor-view"></div>',
 *          viewWhenFirstFocus: false,
 *          viewWidth: self.$text.width(),
 *          selectionClass: 'selection',
 *          selectionSingleClass: 'selection-single',
 *      }
 */
SEditor.usePlugin('preview', function() {
    'use strict';
    var showSign = false,
        hideSign = false,
        originalWidth,
        plugin,
        $win = $(window);

    function updatePreview(editor) {
        if (editor.isPreviewing) {
            // update html
            var $view = editor.$view,
                option, $selections, num;
            $view.html(editor.parser.UBBtoHTML(editor.val(), editor.textApi.selection));

            // update selection
            option = editor.option;
            $selections = $('.' + option.selectionClass);
            num = $selections.length;
            switch(num) {
            case 1:
                // add single class
                if ($selections.text() === '') {
                    $selections.addClass(option.selectionSingleClass);
                }
                Util.scrollYTo($view, $selections);
                break;
            case 0:
                // none selection
                break;
            default:
                // not single selection
                $selections.removeClass(option.selectionSingleClass);
                Util.scrollYTo($view, $selections);
                break;
            }
            // TODO
            /*
            var s = editor.textApi.getCaretPosition();
            $('#pos').text('top:'+s.top+', left:'+s.left);
            var $caret = $('#caret');
            if(!$caret.length){
                $caret = $('<span id="caret"></span>').prependTo($('#editor').parent());
            }
            $caret.css({top:s.top, left:s.left, position:'absolute', zIndex:5, backgroundColor:'red', width:'20px', height: '5px'});
            $('#editor').focus();
            */


            // fire event
            editor.fire('previewUpdate', editor.$view);
        }
    }

    function updatePreviewPos(editor, width) {
        var left = editor.$text.outerWidth();
        if (editor.isPreviewing) {
            editor.$view
                .css('left', left)
                .width(width);
        } else {
            editor.$view
                .hide()
                .css('left', 0);
        }
    }

    function updateHeight(editor) {
        var $view = editor.$view,
            otherHeight = $view.outerHeight() - $view.height();
        $view.height(editor.$text.outerHeight() - otherHeight);
    }

    function updateWidth(editor, width) {
        if (editor.isPreviewing) {
            var $text = editor.$text,
                $view = editor.$view;
            if (editor.isFullscreen) {
                var useableWidth = width / 2,
                    textWidth = useableWidth - ($text.outerWidth() - $text.width()),
                    viewWidth = useableWidth - ($view.outerWidth() - $view.width());
                $text.width(textWidth);
                updatePreviewPos(editor, viewWidth);
            } else {
                updatePreviewPos(editor, originalWidth);
            }
        }
    }

    function showPreview(editor) {
        if (editor.isPreviewing) {
            return;
        }
        editor.isPreviewing = true;

        // show view
        editor.$view.show();
        updateHeight(editor);
        updatePreview(editor);
        updateWidth(editor, $win.width());
        // update button
        changeButtonState(plugin.$button, true, SEditor.i18n.unpreview);
    }

    function hidePreview(editor) {
        if (!editor.isPreviewing) {
            return;
        }
        editor.isPreviewing = false;

        if (editor.isFullscreen) {
            editor.width($win.width());
        }
        updatePreviewPos(editor);
        // update button
        changeButtonState(plugin.$button, false, SEditor.i18n.preview);
    }

    function changeButtonState($button, useCurrent, title) {
        if ($button) {
            $button
                [useCurrent ? 'addClass' : 'removeClass']('current')
                .text(title)
                .attr('title', title);
        }
    }

    plugin = {
        title: SEditor.i18n.preview,      // option
        hasButton: true,    // option
        init: function(editor, option) {
            option.selectionClass = option.selectionClass || 'selection';
            option.selectionSingleClass = option.selectionSingleClass || 'selection-single';
            originalWidth = option.viewWidth || 400;

            // setup view div
            var viewHtml = editor.option.viewHtml || '<div class="seditor-view"><div></div></div>',
                $text = editor.$text,
                $view = editor.$view = $(viewHtml)
                    .css('width', originalWidth),
                bufferedUpdatePreview;
            $text.after(editor.$view);

            // bind events
            editor.textApi.detectSelectionChangeEvent();
            editor.on('remove', function() {
                this.textApi.cancelSelectionChangeEvent();
            }, editor);

            bufferedUpdatePreview = Util.buffer(function() {
                updatePreview(editor);
            });
            editor.on('selectionChange', bufferedUpdatePreview);
            editor.on('textChange', bufferedUpdatePreview);

            editor.on('heightChange', function(height, textHeight) {
                updateHeight(editor);
            });

            editor.on('widthChange', function(width, textWidth) {
                updateWidth(editor, width);
            });

            // setup viewWhenFirstFocus
            //      default is true
            if (!option.viewWhenFirstFocus) {
                $text.one('focus', function() {
                    showPreview(editor);
                });
            }
        },
        click: function(editor) {
            // this is dom
            if (editor.isPreviewing) {
                hidePreview(editor, $(this));
            } else {
                showPreview(editor, $(this));
            }
        }
    };

    return plugin;
});

