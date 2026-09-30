import React, { createContext, useContext } from "react";
import { AppController } from "../../Application/Controllers/AppController";
import { KeyboardShortcutService } from "../../Application/Services/KeyboardShortcutService/KeyboardShortcutService";

interface ApplicationContextValue {
  readonly controller: AppController;
  readonly keyboardShortcutService: KeyboardShortcutService;
}

const ApplicationControllerContext = createContext<ApplicationContextValue | null>(null);

export interface ApplicationProviderProps {
  readonly controller: AppController;
  readonly keyboardShortcutService: KeyboardShortcutService;
  readonly children: React.ReactNode;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({
  controller,
  keyboardShortcutService,
  children,
}) => {
  return (
    <ApplicationControllerContext.Provider value={{ controller, keyboardShortcutService }}>
      {children}
    </ApplicationControllerContext.Provider>
  );
};

export const useAppController = (): AppController => {
  const contextValue = useContext(ApplicationControllerContext);
  if (!contextValue) {
    throw new Error(
      "useAppController must be used within an ApplicationProvider"
    );
  }
  return contextValue.controller;
};

export const useKeyboardShortcutService = (): KeyboardShortcutService => {
  const contextValue = useContext(ApplicationControllerContext);
  if (!contextValue) {
    throw new Error(
      "useKeyboardShortcutService must be used within an ApplicationProvider"
    );
  }
  return contextValue.keyboardShortcutService;
};