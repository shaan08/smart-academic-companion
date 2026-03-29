import Editor from "@monaco-editor/react";

interface Props {
  code: string;
  language: string;
  onChange: (value: string | undefined) => void;
}

const CodeEditorPanel = ({ code, language, onChange }: Props) => {
  return (
    <Editor
      height="100%"
      language={language}
      value={code}
      onChange={onChange}
      theme="vs-dark"
      options={{
        minimap: { enabled: true },
        fontSize: 14,
        lineNumbers: "on",
        wordWrap: "on",
        automaticLayout: true,
        scrollBeyondLastLine: false,
        padding: { top: 12 },
        suggestOnTriggerCharacters: true,
        quickSuggestions: true,
      }}
    />
  );
};

export default CodeEditorPanel;
