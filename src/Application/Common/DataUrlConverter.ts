export class DataUrlConverter {
  public toUint8Array(dataUrl: string): Uint8Array {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) {
      return new TextEncoder().encode(dataUrl);
    }

    const metaPrefix = dataUrl.substring(0, commaIndex).toLowerCase();
    const dataPart = dataUrl.substring(commaIndex + 1);

    if (metaPrefix.includes("base64")) {
      return this.decodeBase64Part(dataPart);
    }

    return this.decodeTextPart(dataPart);
  }

  private decodeBase64Part(base64Content: string): Uint8Array {
    const normalizedContent = base64Content
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    try {
      const binaryString = atob(normalizedContent);
      const byteNumbers = new Uint8Array(binaryString.length);
      for (let index = 0; index < binaryString.length; index += 1) {
        byteNumbers[index] = binaryString.charCodeAt(index);
      }
      return byteNumbers;
    } catch {
      return new Uint8Array(0);
    }
  }

  private decodeTextPart(textContent: string): Uint8Array {
    try {
      return new TextEncoder().encode(decodeURIComponent(textContent));
    } catch {
      return new TextEncoder().encode(textContent);
    }
  }

  public toDataUrl(bytes: Uint8Array, mimeType: string = "image/png"): string {
    let base64: string;
    if (typeof Buffer !== "undefined") {
      base64 = Buffer.from(bytes).toString("base64");
    } else {
      let binary = "";
      const len = bytes.byteLength;
      for (let index = 0; index < len; index += 8192) {
        const chunk = bytes.subarray(index, Math.min(index + 8192, len));
        binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
      }
      base64 = btoa(binary);
    }
    return `data:${mimeType};base64,${base64}`;
  }
}