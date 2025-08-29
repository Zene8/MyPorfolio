
'use client';

import { Editor, EditorState, RichUtils } from 'draft-js';
import 'draft-js/dist/Draft.css';

interface RichTextEditorProps {
  editorState: EditorState;
  onChange: (editorState: EditorState) => void;
}

export default function RichTextEditor({ editorState, onChange }: RichTextEditorProps) {
  const handleKeyCommand = (command: string, editorState: EditorState) => {
    const newState = RichUtils.handleKeyCommand(editorState, command);
    if (newState) {
      onChange(newState);
      return 'handled';
    }
    return 'not-handled';
  };

  const onBoldClick = () => {
    onChange(RichUtils.toggleInlineStyle(editorState, 'BOLD'));
  };

  const onItalicClick = () => {
    onChange(RichUtils.toggleInlineStyle(editorState, 'ITALIC'));
  };

  const onUnderlineClick = () => {
    onChange(RichUtils.toggleInlineStyle(editorState, 'UNDERLINE'));
  };

  return (
    <div className="border rounded-md p-2">
      <div className="flex space-x-2 mb-2">
        <button onClick={onBoldClick} className="font-bold">B</button>
        <button onClick={onItalicClick} className="italic">I</button>
        <button onClick={onUnderlineClick} className="underline">U</button>
      </div>
      <Editor
        editorState={editorState}
        handleKeyCommand={handleKeyCommand}
        onChange={onChange}
      />
    </div>
  );
}
