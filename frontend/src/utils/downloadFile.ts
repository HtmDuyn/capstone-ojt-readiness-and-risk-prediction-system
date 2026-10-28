// Nhận Blob từ service; chỉ xử lý lưu file trên trình duyệt.
export async function downloadFile(
  load: () => Promise<Blob>,
  filename: string,
) {
  try {
    const blob = await load();
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  } catch (error) {
    const blob = (error as { response?: { data?: unknown } }).response?.data;
    if (blob instanceof Blob) {
      const body = await blob.text();
      let message: unknown;
      try {
        message = JSON.parse(body)?.message;
      } catch {
        // Giữ lỗi gốc nếu máy chủ không trả JSON.
      }
      if (typeof message === "string" && message) throw new Error(message);
    }
    throw error;
  }
}
