export interface MaterialProperties {
  readonly id: string;
  readonly name: string;
  readonly baseColor?: string;
  readonly roughness?: number;
  readonly metalness?: number;
  readonly imageUrl?: string | null;
  readonly extraProperties?: readonly string[];
}

export class Material3D {
  public readonly id: string;
  public readonly name: string;
  public readonly baseColor: string;
  public readonly roughness: number;
  public readonly metalness: number;
  public readonly imageUrl: string | null;
  public readonly extraProperties: readonly string[];

  public constructor(properties: MaterialProperties) {
    this.id = properties.id;
    this.name = properties.name;
    this.baseColor = properties.baseColor ?? "#cccccc";
    this.roughness = Math.max(0, Math.min(1, properties.roughness ?? 0.5));
    this.metalness = Math.max(0, Math.min(1, properties.metalness ?? 0.0));
    this.imageUrl = properties.imageUrl ?? null;
    this.extraProperties = properties.extraProperties
      ? [...properties.extraProperties]
      : [];
  }

  public hasImage(): boolean {
    return this.imageUrl !== null && this.imageUrl.trim().length > 0;
  }

  public withName(name: string): Material3D {
    return new Material3D({ ...this, name });
  }

  public withBaseColor(baseColor: string): Material3D {
    return new Material3D({ ...this, baseColor });
  }

  public withRoughness(roughness: number): Material3D {
    return new Material3D({ ...this, roughness });
  }

  public withMetalness(metalness: number): Material3D {
    return new Material3D({ ...this, metalness });
  }

  public withImage(imageUrl: string | null): Material3D {
    return new Material3D({ ...this, imageUrl });
  }

  public withExtraProperties(extraProperties: readonly string[]): Material3D {
    return new Material3D({ ...this, extraProperties });
  }

  public clone(): Material3D {
    return new Material3D({ ...this });
  }
}
