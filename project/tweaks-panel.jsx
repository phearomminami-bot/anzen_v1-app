// tweaks-panel.jsx — app tweak state (theme / role / language) shared across the
// app via useTweaks. The host "edit-mode" preview panel + deck-stage scaffolding
// were removed; only the state hook the app actually uses remains.

function useTweaks(defaults) {
  const [values, setValues] = React.useState(defaults);
  // Accepts setTweak('key', value) or setTweak({ key: value, ... }).
  const setTweak = React.useCallback((keyOrEdits, val) => {
    const edits = (typeof keyOrEdits === 'object' && keyOrEdits !== null)
      ? keyOrEdits : { [keyOrEdits]: val };
    setValues((prev) => ({ ...prev, ...edits }));
  }, []);
  return [values, setTweak];
}

Object.assign(window, { useTweaks });
