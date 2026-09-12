import { useEffect } from "react";
import { useKeyboardShortcutService } from "./AppContext";

const INPUT_TAG_NAMES = new Set(["INPUT", "TEXTAREA", "SELECT"]);

/**
 * Attaches global keydown and keyup listeners that forward key events to
 * KeyboardShortcutService. Suppressed when focus is on a text input,
 * textarea, select, or a contenteditable element.
 */
export const useKeyboardShortcuts = (): void => {
  const shortcutService = useKeyboardShortcutService();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && INPUT_TAG_NAMES.has(target.tagName)) {
        return;
      }
      if (target && target.isContentEditable) {
        return;
      }

      const normalizedKey = event.key.toUpperCase();
      const consumed = shortcutService.handleKeyDown(
        normalizedKey,
        event.repeat
      );
      if (consumed) {
        event.preventDefault();
      }
    };

    const handleKeyUp = (event: KeyboardEvent): void => {
      const target = event.target as HTMLElement | null;
      if (target && INPUT_TAG_NAMES.has(target.tagName)) {
        return;
      }
      if (target && target.isContentEditable) {
        return;
      }

      const normalizedKey = event.key.toUpperCase();
      const consumed = shortcutService.handleKeyUp(normalizedKey);
      if (consumed) {
        event.preventDefault();
      }
    };

    const handleBlur = (): void => {
      shortcutService.handleKeyUp("SHIFT");
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, [shortcutService]);
};