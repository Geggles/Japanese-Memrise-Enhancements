export default function inject(string, deleteAfterwards=false) {
  const ScriptElement = document.createElement('script');
  ScriptElement.textContent = string;
  const parent = (document.head || document.documentElement);
  parent.appendChild(ScriptElement);
  if (deleteAfterwards) parent.removeChild(ScriptElement);
  return ScriptElement;
}
