
/*jshint undef:true, browser:true, noarg:true, curly:true, regexp:true, newcap:true, trailing:false, noempty:true, regexp:false, strict:false, evil:true, funcscope:true, iterator:true, loopfunc:true, multistr:true, boss:true, eqnull:true, eqeqeq:false, undef:true */
/*global SEditor:true, $:false, Util:false, Menu:false */


/**
 * plugin for autoComplete
 */
SEditor.usePlugin('autoComplete', function() {
    'use strict';
    var textArray = [],
        startArray,
        endArray,
        allText,
        completeMenu,
        $menuContainer,                             // 自动补全菜单的包裹
        menuHtml = '<span>{v}</span>',              // 菜单项模板
        menuTmpl = function(data, index) {          // 菜单模板
            return SEditor.Util.format(menuHtml, data);
        },
        autoCompleteStart,                          // 自动补全开始字符位置
        input,                                      // 开始自动补全后的输入内容
        isMenuOn,                                   // 自动补全菜单是否显示
        plugin;

    // 监听，调用自动补全菜单
    function updateAutoComplete(editor) {
        var val = editor.textApi.getSelection();
        if(val.length === 0) {
            var befText = val.all.slice(val.end-1, val.end);
            if(befText === '[' || befText === '［' || befText === '【') {
                if(!isMenuOn) {
                    showMenu(editor);
                    autoCompleteStart = val.end - 1;
                }
            }
        }
    }

    // 绑定选择
    function eventKeydown(e) {
        switch(e.which) {
            // enter
            case 13:
                e.preventDefault();
                completeMenu.done();
                break;
            // esc
            case 27:
                e.preventDefault();
                completeMenu.hide();
                break;
            // down
            case 40:
                e.preventDefault();
                completeMenu.down();
                break;
            // up
            case 38:
                e.preventDefault();
                completeMenu.up();
                break;
        }
    }

    // 绑定输入，e.data传入参数 editor
    function eventKeyup(e) {
        switch(e.which) {
            // enter
            case 13:
            // esc
            case 27:
            // down
            case 40:
            // up
            case 38:
                e.preventDefault();
                return;
        }
        var s = e.data.textApi.getSelection();
        if(s.end <= autoCompleteStart) {
            completeMenu.hide();
            isMenuOn = false;                           // 关闭菜单
            $(e.data.textApi.textarea).unbind('keydown', eventKeydown)
                                      .unbind('keyup', eventKeyup);
        } else {
            var filterData = [];                        // 过滤后的数组
            input = s.all.slice( autoCompleteStart, s.end);
            input = '[' + input.slice(1);
            filterData = $.map(allText, function(n) {
                if(n.indexOf(input) === 0) {
                    return n;
                }
            });
            completeMenu.data(filterData)
                        .update();                      // 更新
        }
    }

    // 显示自动补全
    function showMenu(editor) {
        var s = editor.textApi.getCaretPosition();
        $menuContainer.css({top:s.top+16, left:s.left})
                      .show();
        completeMenu.data(allText)
                    .update()
                    .focus()
                    .done(function(data, index) {
                        var val = editor.textApi.selection;
                        editor.textApi.deleteText(autoCompleteStart, val.end);
                        editor.textApi.insertText(data, autoCompleteStart, true);
                        $menuContainer.hide();
                        $(editor.textApi.textarea).unbind('keydown', eventKeydown)
                                                  .unbind('keyup', eventKeyup);
                        isMenuOn = false;
                    });
        isMenuOn = true;
        editor.textApi.textarea.focus();
        $(editor.textApi.textarea).bind('keydown', eventKeydown)
                                  .bind('keyup', editor, eventKeyup);
    }

    plugin = {
        hasButton: false,    // option
        init: function(editor) {
            // setup
            var bufferedUpdateAutoComplete;
            textArray = $.map(editor.plugins, function(n) {
                if(n.autoComplete) {
                    return n.autoComplete;
                }
            });
            startArray = $.map(textArray, function(n) {
                return n.start;
            });
            endArray = $.map(textArray, function(n) {
                return n.end;
            });
            allText = $.merge(startArray, endArray);

            $menuContainer = $('<div></div>').prependTo($(editor.textApi.textarea).parent());
            $menuContainer.css({position:'absolute', zIndex:5});
            completeMenu = new Menu($menuContainer);
            completeMenu.setMenuTmpl(menuTmpl);

            // bind events
            bufferedUpdateAutoComplete = Util.buffer(function() {
                updateAutoComplete(editor);
            });
            editor.on('textChange', updateAutoComplete);
        }
    };

    return plugin;
});

