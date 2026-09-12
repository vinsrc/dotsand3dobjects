export type StateEventType =
  | "MODEL_CHANGED"
  | "VIEW_CHANGED"
  | "RENDER_MODE_CHANGED"
  | "ERROR_OCCURRED"
  | "MODE_CHANGED"
  | "SELECTION_CHANGED"
  | "AUTO_CONNECT_CHANGED"
  | "GRID_SNAP_CHANGED"
  | "UNDO_REDO_STATE_CHANGED"
  | "MATERIAL_PANEL_CHANGED"
  | "MATERIALS_CHANGED"
  | "UI_CUSTOMIZATION_CHANGED"
  | "DECALS_CHANGED";

export type StateListenerCallback = (payload?: unknown) => void;
export type UnsubscribeCallback = () => void;

export class ApplicationStateNotifier {
  private readonly listenersMap: Map<StateEventType, Set<StateListenerCallback>>;

  public constructor() {
    this.listenersMap = new Map();
  }

  public subscribe(
    eventType: StateEventType,
    listenerCallback: StateListenerCallback
  ): UnsubscribeCallback {
    if (!this.listenersMap.has(eventType)) {
      this.listenersMap.set(eventType, new Set());
    }

    const listenersSet = this.listenersMap.get(eventType);
    if (listenersSet) {
      listenersSet.add(listenerCallback);
    }

    return () => {
      const activeListeners = this.listenersMap.get(eventType);
      if (activeListeners) {
        activeListeners.delete(listenerCallback);
      }
    };
  }

  public notify(eventType: StateEventType, payload?: unknown): void {
    const listenersSet = this.listenersMap.get(eventType);
    if (listenersSet) {
      for (const listenerCallback of listenersSet) {
        listenerCallback(payload);
      }
    }
  }
}
