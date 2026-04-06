const API_BASE = import.meta.env.VITE_API_URL || "https://fah-ride-dzg3aqhsfsdqh4fy.centralindia-01.azurewebsites.net/api/v1";

export interface UploadResponse {
  success: boolean;
  imageUrl: string;
}

export const uploadImageToCloudinary = async (
  file: File,
  type: "profile" | "car"
): Promise<string> => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE}/upload/image?type=${type}`, {
    method: "POST",
    body: formData,
    credentials: "include",
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || "Failed to upload image");
  }

  const data: UploadResponse = await response.json();
  return data.imageUrl;
};
