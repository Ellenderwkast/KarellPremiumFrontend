import React, { useEffect, useRef } from 'react';

function WysiwygEditor({ value, onChange }) {
  const editorRef = useRef(null);

  useEffect(() => {
    if (!editorRef.current) return;
    const nextValue = value || '';
    if (editorRef.current.innerHTML !== nextValue) {
      editorRef.current.innerHTML = nextValue;
    }
  }, [value]);

  const handleInput = () => {
    if (!editorRef.current) return;
    onChange(editorRef.current.innerHTML);
  };

  const exec = (command) => {
    document.execCommand(command, false);
    editorRef.current?.focus();
    handleInput();
  };

  return (
    <div style={{ border: '1px solid #d0d7de', borderRadius: 8, overflow: 'hidden', background: '#fff' }}>
      <div style={{ display: 'flex', gap: 8, padding: 8, borderBottom: '1px solid #e5e7eb', background: '#f8fafc' }}>
        <button type="button" onClick={() => exec('bold')}><b>B</b></button>
        <button type="button" onClick={() => exec('italic')}><i>I</i></button>
        <button type="button" onClick={() => exec('underline')}><u>U</u></button>
        <button type="button" onClick={() => exec('insertUnorderedList')}>• Lista</button>
        <button type="button" onClick={() => exec('insertOrderedList')}>1. Lista</button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        style={{ minHeight: 180, padding: 12, outline: 'none' }}
      />
    </div>
  );
}

export default WysiwygEditor;
