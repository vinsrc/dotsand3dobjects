import { UiCustomizationSettings } from "./UiCustomizationService";

export interface UiCustomizationStorage {
  load(): UiCustomizationSettings | null;
  save(settings: UiCustomizationSettings): void;
}
