import { getAccessToken } from "./firebase";

export const uploadPdfToDrive = async (
  pdfBlob: Blob,
  fileName: string,
  folderName: string
): Promise<string> => {
  const accessToken = getAccessToken();
  if (!accessToken) {
    throw new Error("User is not authenticated with Google Drive. Please sign in first.");
  }

  // 1. Search for the folder or create it
  let folderId = await searchFolder(folderName, accessToken);
  if (!folderId) {
    folderId = await createFolder(folderName, accessToken);
  }

  // 2. Upload the file to the folder
  return await uploadFile(pdfBlob, fileName, folderId, accessToken);
};

const searchFolder = async (folderName: string, accessToken: string) => {
  const query = encodeURIComponent(`mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`);
  const response = await fetch(`https://www.googleapis.com/drive/v3/files?q=${query}&fields=files(id,name)`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!response.ok) throw new Error("Failed to search Drive folders.");
  const data = await response.json();
  if (data.files && data.files.length > 0) {
    return data.files[0].id; // Return the first matching folder ID
  }
  return null;
};

const createFolder = async (folderName: string, accessToken: string) => {
  const metadata = {
    name: folderName,
    mimeType: "application/vnd.google-apps.folder",
  };
  const response = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(metadata),
  });
  if (!response.ok) throw new Error("Failed to create Drive folder.");
  const data = await response.json();
  return data.id;
};

const uploadFile = async (fileBlob: Blob, fileName: string, folderId: string, accessToken: string) => {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const form = new FormData();
  form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
  form.append("file", fileBlob);

  const response = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
    body: form,
  });

  if (!response.ok) throw new Error("Failed to upload file to Drive.");
  const data = await response.json();
  return data.webViewLink || data.id; // Return the link if possible
};
