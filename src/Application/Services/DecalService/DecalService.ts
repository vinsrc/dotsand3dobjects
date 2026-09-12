import { ApplicationStateNotifier } from "../../Common/ApplicationStateNotifier";
import { Vector3D } from "../../Common/Vector3D";
import { DecalPlane } from "./DecalPlane";

export class DecalService {
  private readonly stateNotifier: ApplicationStateNotifier;
  private readonly decalsMap: Map<string, DecalPlane>;
  private selectedDecalId: string | null;
  private idCounter: number;

  public constructor(stateNotifier: ApplicationStateNotifier) {
    this.stateNotifier = stateNotifier;
    this.decalsMap = new Map();
    this.selectedDecalId = null;
    this.idCounter = 0;
  }

  public createDecalOnFace(
    parentFaceIndex: number,
    faceVertices: readonly Vector3D[]
  ): DecalPlane {
    this.idCounter += 1;
    const decalId = `decal_${this.idCounter}`;
    const newDecal = DecalPlane.createFromFace(
      decalId,
      parentFaceIndex,
      faceVertices
    );

    this.decalsMap.set(decalId, newDecal);
    this.selectedDecalId = decalId;
    this.notifyDecalsChanged();
    return newDecal;
  }

  public getDecals(): readonly DecalPlane[] {
    return Array.from(this.decalsMap.values());
  }

  public getDecal(id: string): DecalPlane | null {
    return this.decalsMap.get(id) ?? null;
  }

  public getSelectedDecalId(): string | null {
    return this.selectedDecalId;
  }

  public getSelectedDecal(): DecalPlane | null {
    if (!this.selectedDecalId) {
      return null;
    }
    return this.decalsMap.get(this.selectedDecalId) ?? null;
  }

  public selectDecal(id: string | null): void {
    if (this.selectedDecalId === id) {
      return;
    }
    this.selectedDecalId = id;
    this.notifyDecalsChanged();
  }

  public isDecalSelected(): boolean {
    return this.selectedDecalId !== null;
  }

  public deleteDecal(id?: string): boolean {
    const targetId = id ?? this.selectedDecalId;
    if (!targetId || !this.decalsMap.has(targetId)) {
      return false;
    }
    this.decalsMap.delete(targetId);
    if (this.selectedDecalId === targetId) {
      this.selectedDecalId = null;
    }
    this.notifyDecalsChanged();
    return true;
  }

  public getDecalsForFace(faceIndex: number): readonly DecalPlane[] {
    return Array.from(this.decalsMap.values()).filter((d) =>
      d.isChildOfFace(faceIndex)
    );
  }

  public deleteDecalsForFace(faceIndex: number): void {
    let changed = false;
    for (const [id, decal] of Array.from(this.decalsMap.entries())) {
      if (decal.isChildOfFace(faceIndex)) {
        this.decalsMap.delete(id);
        if (this.selectedDecalId === id) {
          this.selectedDecalId = null;
        }
        changed = true;
      }
    }
    if (changed) {
      this.notifyDecalsChanged();
    }
  }

  public assignMaterialToSelectedDecal(materialId: string | null): void {
    if (!this.selectedDecalId) {
      return;
    }
    const currentDecal = this.decalsMap.get(this.selectedDecalId);
    if (!currentDecal) {
      return;
    }
    const updatedDecal = currentDecal.withMaterialId(materialId);
    this.decalsMap.set(this.selectedDecalId, updatedDecal);
    this.notifyDecalsChanged();
  }

  public applyDecalTransform(
    offset?: Vector3D,
    rotationAngle?: number,
    rotationAxis?: Vector3D
  ): void {
    if (!this.selectedDecalId) {
      return;
    }
    let decal = this.decalsMap.get(this.selectedDecalId);
    if (!decal) {
      return;
    }

    if (offset && (offset.coordinateX !== 0 || offset.coordinateY !== 0 || offset.coordinateZ !== 0)) {
      decal = decal.translate(offset);
    }

    if (rotationAngle !== undefined && rotationAngle !== 0) {
      decal = decal.rotate(rotationAngle, rotationAxis);
    }

    this.decalsMap.set(this.selectedDecalId, decal);
    this.notifyDecalsChanged();
  }

  public restoreState(
    decals: readonly DecalPlane[],
    selectedDecalId: string | null
  ): void {
    this.decalsMap.clear();
    for (const decal of decals) {
      this.decalsMap.set(decal.id, decal);
    }
    this.selectedDecalId = selectedDecalId;
    this.notifyDecalsChanged();
  }

  private notifyDecalsChanged(): void {
    this.stateNotifier.notify("DECALS_CHANGED", {
      decals: this.getDecals(),
      selectedDecalId: this.selectedDecalId,
    });
  }
}
