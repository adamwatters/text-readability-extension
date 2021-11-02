// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
const rs = require("text-readability");

// this method is called when vs code is activated
export function activate(context: vscode.ExtensionContext) {
  //Create output channel
  let output = vscode.window.createOutputChannel("Readability Extension");

  let activeEditor = vscode.window.activeTextEditor;

  if (activeEditor) {
    triggerUpdateDecorations();
  }

  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (activeEditor && event.document === activeEditor.document) {
        triggerUpdateDecorations();
      }
    },
    null,
    context.subscriptions
  );

  function isEmptyObject(obj) {
    return Object.getOwnPropertyNames(obj).length === 0;
  }

  var timeout = null;
  function triggerUpdateDecorations() {
    if (timeout) {
      clearTimeout(timeout);
    }
    var updateDelay = 100;
    timeout = setTimeout(updateDecorations, updateDelay);
  }

  let decorators: vscode.TextEditorDecorationType[] = [];
  function updateDecorations() {
    decorators.forEach((decorator) => {
      decorator.dispose();
    });

    if (!activeEditor) {
      return;
    }

    var regEx = /.+?[\.\?\!]/gm;
    var text = activeEditor.document.getText();

    var matchesArray = Array.from(text.matchAll(regEx), (m, i) => {
      return { match: m[0], index: i };
    });

    matchesArray.forEach((match) => {
      let startIndex = text.indexOf(match.match);
      var startPos = activeEditor.document.positionAt(startIndex);
      var endPos = activeEditor.document.positionAt(
        startIndex + match.match.length
      );
      let accumulatedText = text
        .slice(0, startIndex + match.match.length)
        .replace(/\n/gm, ` `);
      output.appendLine(accumulatedText);
      const score = rs.fleschKincaidGrade(match.match, true);
      output.appendLine(`sentence score: ${score}`);
      const movingScore = rs.fleschKincaidGrade(accumulatedText, true);
      output.appendLine(`accumulated score: ${movingScore}`);
      let decoration = vscode.window.createTextEditorDecorationType({
        color: colorFromScore(movingScore),
      });
      decorators.push(decoration);
      activeEditor.setDecorations(decoration, [
        {
          range: new vscode.Range(startPos, endPos),
          hoverMessage: `sentence score: ${score}, accumulated score:  ${movingScore}`,
        },
      ]);
    });
  }
}

function colorFromScore(score) {
  if (score >= 15) {
    return "red";
  }
  var hue = (((15 - score) / 15) * 120).toString(10);
  return ["hsl(", hue, ",100%,50%)"].join("");
}
