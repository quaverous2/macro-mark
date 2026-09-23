export interface LocalFileHandle {
  name: string;
  getFile(): Promise<File>;
  createWritable(): Promise<{ write(data: string): Promise<void>; close(): Promise<void> }>;
  queryPermission(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
  requestPermission(descriptor: { mode: 'readwrite' }): Promise<PermissionState>;
}

export interface FilePickerWindow {
  showOpenFilePicker(options: FilePickerOptions): Promise<LocalFileHandle[]>;
  showSaveFilePicker(options: FilePickerOptions): Promise<LocalFileHandle>;
}

interface FilePickerOptions {
  multiple?: boolean;
  suggestedName?: string;
  types: Array<{ description: string; accept: Record<string, string[]> }>;
}
