import { useState, useEffect } from "react";
import { useAppController } from "./AppContext";
import { StateEventType } from "../../Application/Common/ApplicationStateNotifier";

export const useApplicationState = (monitoredEventTypes: StateEventType[]) => {
  const controller = useAppController();
  const [, setTriggerCount] = useState<number>(0);

  useEffect(() => {
    const notifier = controller.getStateNotifier();
    const unsubscribeCallbacks = monitoredEventTypes.map((eventType) =>
      notifier.subscribe(eventType, () => {
        setTriggerCount((previousCount) => previousCount + 1);
      })
    );

    return () => {
      for (const unsubscribe of unsubscribeCallbacks) {
        unsubscribe();
      }
    };
  }, [controller, monitoredEventTypes]);

  return controller;
};
