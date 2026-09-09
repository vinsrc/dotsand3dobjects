import React, { createContext, useContext } from "react";
import { AppController } from "../../Application/Controllers/AppController";

const ApplicationControllerContext = createContext<AppController | null>(null);

export interface ApplicationProviderProps {
  readonly controller: AppController;
  readonly children: React.ReactNode;
}

export const ApplicationProvider: React.FC<ApplicationProviderProps> = ({
  controller,
  children,
}) => {
  return (
    <ApplicationControllerContext.Provider value={controller}>
      {children}
    </ApplicationControllerContext.Provider>
  );
};

export const useAppController = (): AppController => {
  const controllerInstance = useContext(ApplicationControllerContext);
  if (!controllerInstance) {
    throw new Error(
      "useAppController must be used within an ApplicationProvider"
    );
  }
  return controllerInstance;
};
