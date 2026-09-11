import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";
import { Material3D } from "./Material3D";

export type PanelDockSide = "left" | "right";

export class MaterialService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private materialsList: Material3D[] = [];
  private selectedMaterialId: string | null = null;
  private panelOpen: boolean = false;
  private dockSide: PanelDockSide = "left";
  private nextMaterialNumber: number = 1;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
  }

  public getMaterials(): readonly Material3D[] {
    return this.materialsList;
  }

  public getSelectedMaterialId(): string | null {
    return this.selectedMaterialId;
  }

  public getSelectedMaterial(): Material3D | null {
    if (!this.selectedMaterialId) {
      return null;
    }
    return (
      this.materialsList.find(
        (material) => material.id === this.selectedMaterialId
      ) ?? null
    );
  }

  public selectMaterial(materialId: string | null): void {
    if (this.selectedMaterialId === materialId) {
      return;
    }
    this.selectedMaterialId = materialId;
    this.stateNotifier.notify("MATERIALS_CHANGED", {
      materials: this.materialsList,
      selectedMaterialId: this.selectedMaterialId,
    });
  }

  public createMaterial(): Material3D {
    const generatedName = `Material ${this.nextMaterialNumber}`;
    this.nextMaterialNumber += 1;

    const newMaterial = new Material3D({
      id: `mat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: generatedName,
      baseColor: "#cccccc",
      roughness: 0.5,
      metalness: 0.0,
      imageUrl: null,
    });

    this.materialsList = [...this.materialsList, newMaterial];
    this.selectedMaterialId = newMaterial.id;
    this.stateNotifier.notify("MATERIALS_CHANGED", {
      materials: this.materialsList,
      selectedMaterialId: this.selectedMaterialId,
    });
    return newMaterial;
  }

  public deleteMaterial(materialId: string): boolean {
    const previousLength = this.materialsList.length;
    this.materialsList = this.materialsList.filter(
      (material) => material.id !== materialId
    );
    if (this.materialsList.length === previousLength) {
      return false;
    }

    if (this.selectedMaterialId === materialId) {
      this.selectedMaterialId =
        this.materialsList.length > 0 ? this.materialsList[0].id : null;
    }

    this.stateNotifier.notify("MATERIALS_CHANGED", {
      materials: this.materialsList,
      selectedMaterialId: this.selectedMaterialId,
    });
    return true;
  }

  public updateMaterial(updatedMaterial: Material3D): void {
    const existingIndex = this.materialsList.findIndex(
      (material) => material.id === updatedMaterial.id
    );
    if (existingIndex === -1) {
      return;
    }

    const updatedList = [...this.materialsList];
    updatedList[existingIndex] = updatedMaterial;
    this.materialsList = updatedList;

    this.stateNotifier.notify("MATERIALS_CHANGED", {
      materials: this.materialsList,
      selectedMaterialId: this.selectedMaterialId,
    });
  }

  public isPanelOpen(): boolean {
    return this.panelOpen;
  }

  public togglePanel(): void {
    this.panelOpen = !this.panelOpen;
    this.stateNotifier.notify("MATERIAL_PANEL_CHANGED", {
      isOpen: this.panelOpen,
      dockSide: this.dockSide,
    });
  }

  public setPanelOpen(isOpen: boolean): void {
    if (this.panelOpen === isOpen) {
      return;
    }
    this.panelOpen = isOpen;
    this.stateNotifier.notify("MATERIAL_PANEL_CHANGED", {
      isOpen: this.panelOpen,
      dockSide: this.dockSide,
    });
  }

  public getDockSide(): PanelDockSide {
    return this.dockSide;
  }

  public setDockSide(dockSide: PanelDockSide): void {
    if (this.dockSide === dockSide) {
      return;
    }
    this.dockSide = dockSide;
    this.stateNotifier.notify("MATERIAL_PANEL_CHANGED", {
      isOpen: this.panelOpen,
      dockSide: this.dockSide,
    });
  }

  public restoreMaterials(
    materials: readonly Material3D[],
    selectedMaterialId: string | null
  ): void {
    this.materialsList = [...materials];
    this.selectedMaterialId = selectedMaterialId;
    this.stateNotifier.notify("MATERIALS_CHANGED", {
      materials: this.materialsList,
      selectedMaterialId: this.selectedMaterialId,
    });
  }
}
