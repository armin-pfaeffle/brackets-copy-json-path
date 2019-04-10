define(function (require, exports, module) {
    'use strict';

    var PREFIX = 'ap.cjp';
    var COMMAND_ID = PREFIX + '.copy';
    
    var KEY_BINDINGS = [
        {
            key: 'Ctrl-Alt-C',
            platform: 'win'
        }, {
            key: 'Cmd-Shift-C',
            platform: 'mac'
        }, {
            key: 'Ctrl-Alt-C'
        }
    ];

    /* beautify preserve:start *//* eslint-disable no-multi-spaces */
    var CommandManager     = brackets.getModule('command/CommandManager');
    var Menus              = brackets.getModule('command/Menus');
    var DocumentManager    = brackets.getModule('document/DocumentManager');
    var EditorManager      = brackets.getModule('editor/EditorManager');
    var ExtensionUtils     = brackets.getModule('utils/ExtensionUtils');
    /* eslint-enable no-multi-spaces *//* beautify preserve:end */

    
    var currentEditorText = '';

    
    function isValidJson() {
        try {
            json = JSON.parse(currentEditorText);
            return true;
        }
        catch (e) {
            return false;
        }
    }
    
    function getJsonKeyAfterIndex(startIndex) {
        var index = startIndex;
        var startQuoteIndex = -1;
        var endQuoteIndex = -1;
        while (index < currentEditorText.length) {
            if (startQuoteIndex == -1 && "{}[]:".indexOf(currentEditorText[index]) > -1) {
                return false;
            }
            
            if (currentEditorText[index] == '"') {
                if (startQuoteIndex == -1) {
                    startQuoteIndex = index + 1;
                }
                else {
                    endQuoteIndex = index - 1;
                    index++;
                    break;                    
                }                
            }
            index++;
        }
        
        // Ensure that a key is followed by a colon
        var isKey = false;
        while (true) {
            var c = currentEditorText[index].trim();
            if (c != '') {
                isKey = (c == ':');
                break;
            }
            index++;
        }
        
        if (isKey && startQuoteIndex > -1 && endQuoteIndex > -1) {
            var key = currentEditorText.substr(startQuoteIndex, endQuoteIndex - startQuoteIndex + 1);
            return key;
        }
        
        return false;
    }
    
    function getSameLevelCurlyClamp(startIndex) {
        var level = 0;
        for (var index = startIndex; index > 0; index--) {
            if (currentEditorText[index] == "}") {
                level++;
            }
            else if (currentEditorText[index] == "{") {
                level--;
            }

            if (level == 0) {
                return index;
            }
        }
    }
    
    function getUpperLevelCurlyClamp(startIndex) {
        var level = 0;
        for (var index = startIndex; index > 0; index--) {
            if (currentEditorText[index] == "}") {
                level++;
            }
            else if (currentEditorText[index] == "{") {
                level--;
            }

            if (level < 0) {
                return index;
            }
        }
    }

    function obtainJsonPathAsArray() {
        var editor = EditorManager.getCurrentFullEditor();
        var cursorPos = editor.getCursorPos();
        var currentCursorPosition = editor.indexFromPos(cursorPos);
        var path = [];
        var index = currentCursorPosition - 1;
        while (index >= 0) {
            if (currentEditorText[index] == "," ||currentEditorText[index] == "{") {
                var pathPart = getJsonKeyAfterIndex(index + 1);
                if (pathPart) {
                    path.unshift(pathPart);                        
                    index = getUpperLevelCurlyClamp(index);
                }
            }
            else if (currentEditorText[index] == "}") {         
                index = getSameLevelCurlyClamp(index);
            }
            index--;
        }
        return path;        
    }
    
    function copyPathToClipboard(path) {
        var tempInput = document.createElement('textarea');
        document.body.appendChild(tempInput);
        tempInput.value = path.join('.');
        tempInput.style.position = 'absolute';
        tempInput.select();
        document.execCommand('copy');
        document.body.removeChild(tempInput);
    }
    
    function copyJSONPath() {
        var document = DocumentManager.getCurrentDocument();
        var editor = EditorManager.getCurrentFullEditor();
        
        currentEditorText = document.getText();
        if (isValidJson) {
            var path = obtainJsonPathAsArray();
            copyPathToClipboard(path);
            editor.focus();
        }
    }
    
    
    CommandManager.register('Copy JSON path', COMMAND_ID, copyJSONPath);

    var editMenu = Menus.getMenu(Menus.AppMenuBar.EDIT_MENU);
    editMenu.addMenuDivider();
    editMenu.addMenuItem(COMMAND_ID, KEY_BINDINGS);
    Menus.getContextMenu(Menus.ContextMenuIds.EDITOR_MENU).addMenuItem(COMMAND_ID);
});
