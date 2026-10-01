import { AppController } from "../../Application/Controllers/AppController";

export class FileOperationsHandler {
  public constructor(private readonly controller: AppController) {}

  public handleFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }

    const fileList = Array.from(selectedFiles);
    const objFile = fileList.find((file) =>
      file.name.toLowerCase().endsWith(".obj")
    );
    const mtlFile = fileList.find((file) =>
      file.name.toLowerCase().endsWith(".mtl")
    );

    if (objFile && mtlFile) {
      const objReader = new FileReader();
      objReader.onload = () => {
        const objString = objReader.result as string;
        const mtlReader = new FileReader();
        mtlReader.onload = () => {
          const mtlString = mtlReader.result as string;
          this.controller.loadModelFromFile(objFile.name, objString, mtlString);
        };
        mtlReader.readAsText(mtlFile);
      };
      objReader.readAsText(objFile);
    } else if (objFile) {
      const objReader = new FileReader();
      objReader.onload = () => {
        const objString = objReader.result as string;
        this.controller.loadModelFromFile(objFile.name, objString);
      };
      objReader.readAsText(objFile);
    } else if (mtlFile) {
      const mtlReader = new FileReader();
      mtlReader.onload = () => {
        const mtlString = mtlReader.result as string;
        this.controller.loadMaterialsFromFile(mtlFile.name, mtlString);
      };
      mtlReader.readAsText(mtlFile);
    } else if (fileList.length > 0) {
      const fallbackFile = fileList[0];
      const fallbackReader = new FileReader();
      fallbackReader.onload = () => {
        const fallbackString = fallbackReader.result as string;
        this.controller.loadModelFromFile(fallbackFile.name, fallbackString);
      };
      fallbackReader.readAsText(fallbackFile);
    }
  }

  public handleMtlFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    const targetFile = selectedFiles[0];
    if (!targetFile) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const fileContentString = fileReader.result as string;
      this.controller.loadMaterialsFromFile(targetFile.name, fileContentString);
    };
    fileReader.readAsText(targetFile);
  }

  public handleZipFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const selectedFiles = event.target.files;
    if (!selectedFiles || selectedFiles.length === 0) {
      return;
    }
    const targetFile = selectedFiles[0];
    if (!targetFile) {
      return;
    }
    const fileReader = new FileReader();
    fileReader.onload = () => {
      const arrayBuffer = fileReader.result as ArrayBuffer;
      this.controller.importZip(arrayBuffer, targetFile.name);
    };
    fileReader.readAsArrayBuffer(targetFile);
  }

  public handleSaveFileSelected(event: React.ChangeEvent<HTMLInputElement>): void {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    const file = files[0];
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const jsonText = reader.result as string;
      this.controller.loadProjectFromJson(jsonText);
    };
    reader.readAsText(file);
  }

  public exportModelAndMaterials(): void {
    const objContent = this.controller.exportModelToFile();
    this.triggerDownload("model.obj", new Blob([objContent], { type: "text/plain" }));

    const materials = this.controller.getMaterialService().getMaterials();
    if (materials.length > 0) {
      const mtlContent = this.controller.exportMtlFile("model");
      this.triggerDownload("model.mtl", new Blob([mtlContent], { type: "text/plain" }));

      const exportedImages = this.controller.exportImages("model");
      for (const image of exportedImages) {
        if (image.dataUrl.startsWith("data:")) {
          const imgBlob = this.dataUrlToBlob(image.dataUrl);
          this.triggerDownload(image.fileName, imgBlob);
        } else if (
          image.dataUrl.startsWith("blob:") ||
          image.dataUrl.startsWith("http")
        ) {
          const imgAnchor = document.createElement("a");
          imgAnchor.href = image.dataUrl;
          imgAnchor.download = image.fileName;
          document.body.appendChild(imgAnchor);
          imgAnchor.click();
          document.body.removeChild(imgAnchor);
        }
      }
    }
  }

  public exportZip(): void {
    const zipContent = this.controller.exportModelAsZip();
    const zipBlob = new Blob([new Uint8Array(zipContent)], {
      type: "application/zip",
    });
    this.triggerDownload("model.zip", zipBlob);
  }

  public exportProjectSaveFile(): void {
    const jsonString = this.controller.exportProjectSaveJson();
    const saveName = this.controller.getActiveProjectSaveName() ?? "project";
    const blob = new Blob([jsonString], { type: "application/json" });
    this.triggerDownload(`${saveName}.json`, blob);
  }

  private triggerDownload(fileName: string, blob: Blob): void {
    const downloadUrl = URL.createObjectURL(blob);
    const anchorElement = document.createElement("a");
    anchorElement.href = downloadUrl;
    anchorElement.download = fileName;
    document.body.appendChild(anchorElement);
    anchorElement.click();
    document.body.removeChild(anchorElement);
    URL.revokeObjectURL(downloadUrl);
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(",");
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/png";
    const b64Data = parts[1] || "";
    const byteCharacters = atob(b64Data);
    const byteNumbers = new Uint8Array(byteCharacters.length);
    for (let index = 0; index < byteCharacters.length; index += 1) {
      byteNumbers[index] = byteCharacters.charCodeAt(index);
    }
    return new Blob([byteNumbers], { type: mimeType });
  }
}
