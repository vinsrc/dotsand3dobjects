import { describe, it, expect, vi } from "vitest";
import { ApplicationStateNotifier } from "../../../src/Application/Common/ApplicationStateNotifier";

describe("ApplicationStateNotifier", () => {
  it("should register listener and notify on event", () => {
    const notifier = new ApplicationStateNotifier();
    const mockListener = vi.fn();

    const unsubscribe = notifier.subscribe("MODEL_CHANGED", mockListener);
    notifier.notify("MODEL_CHANGED", { message: "loaded" });

    expect(mockListener).toHaveBeenCalledTimes(1);
    expect(mockListener).toHaveBeenCalledWith({ message: "loaded" });

    unsubscribe();
    notifier.notify("MODEL_CHANGED");
    expect(mockListener).toHaveBeenCalledTimes(1);
  });

  it("should ignore notification if no listeners are registered for event", () => {
    const notifier = new ApplicationStateNotifier();
    expect(() => notifier.notify("ERROR_OCCURRED", "error")).not.toThrow();
  });

  it("should safely handle unsubscribing multiple times or after listeners map is cleared", () => {
    const notifier = new ApplicationStateNotifier();
    const mockListener = vi.fn();

    const unsubscribe = notifier.subscribe("MODEL_CHANGED", mockListener);
    unsubscribe();
    expect(() => unsubscribe()).not.toThrow();

    // Directly delete the map entry to cover the !activeListeners branch
    (notifier as unknown as { listenersMap: Map<string, unknown> }).listenersMap.delete("MODEL_CHANGED");
    expect(() => unsubscribe()).not.toThrow();
  });
});
