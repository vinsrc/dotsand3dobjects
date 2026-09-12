import { describe, it, expect } from "vitest";
import { DataUrlConverter } from "../../../src/Application/Common/DataUrlConverter";

describe("DataUrlConverter", () => {
  it("should decode a base64 data URL into its bytes", () => {
    const pngBase64 = "iVBORw0KGgo="; // minimal bytes
    const dataUrl = `data:image/png;base64,${pngBase64}`;
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(dataUrl);

    const expectedBytes = atob(pngBase64);
    expect(result.length).toBe(expectedBytes.length);
    for (let index = 0; index < expectedBytes.length; index += 1) {
      expect(result[index]).toBe(expectedBytes.charCodeAt(index));
    }
  });

  it("should decode a real PNG data URL and preserve the PNG signature", () => {
    const pngSignatureBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0k";
    const dataUrl = `data:image/png;base64,${pngSignatureBase64}`;
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(dataUrl);

    expect(result[0]).toBe(0x89);
    expect(result[1]).toBe(0x50);
    expect(result[2]).toBe(0x4e);
    expect(result[3]).toBe(0x47);
  });

  it("should decode a percent-encoded non-base64 data URL", () => {
    const dataUrl = "data:image/svg+xml,%3Csvg%3E%3C/svg%3E";
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(dataUrl);

    const decodedText = new TextDecoder().decode(result);
    expect(decodedText).toBe("<svg></svg>");
  });

  it("should encode plain text without a comma separator", () => {
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array("plain text content");

    expect(new TextDecoder().decode(result)).toBe("plain text content");
  });

  it("should normalize url-safe base64 characters", () => {
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(
      "data:image/png;base64,iVBORw0KGgoAAA-_"
    );

    const expected = atob("iVBORw0KGgoAAA+/");
    expect(result.length).toBe(expected.length);
    for (let index = 0; index < expected.length; index += 1) {
      expect(result[index]).toBe(expected.charCodeAt(index));
    }
  });

  it("should decode a data URL with an uppercase BASE64 header", () => {
    const pngBase64 = "iVBORw0KGgo=";
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(
      `data:image/png;BASE64,${pngBase64}`
    );

    const expectedBytes = atob(pngBase64);
    expect(result.length).toBe(expectedBytes.length);
    for (let index = 0; index < expectedBytes.length; index += 1) {
      expect(result[index]).toBe(expectedBytes.charCodeAt(index));
    }
  });

  it("should return empty bytes for a data URL with invalid base64 content", () => {
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array(
      "data:image/png;base64,%%%INVALID%%%"
    );

    expect(result.length).toBe(0);
  });

  it("should fall back to raw bytes when percent decoding fails", () => {
    const converter = new DataUrlConverter();

    const result = converter.toUint8Array("data:text/plain,%ZZmalformed");

    expect(new TextDecoder().decode(result)).toBe("%ZZmalformed");
  });
});