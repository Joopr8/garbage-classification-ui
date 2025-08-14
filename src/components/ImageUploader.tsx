import React, { useState } from "react";
import ImageUploading from "react-images-uploading";
import type { ImageListType, ErrorsType } from "react-images-uploading";

// const API_ENDPOINT = "https://c04b3f94c594.ngrok-free.app/predict"; // ← removido
const MAX_SIZE_BYTES = 8 * 1024 * 1024; // 8MB (ajusta se quiseres)
const ACCEPT_TYPES = ["jpg", "jpeg", "png", "webp"]; // evita HEIC/HEIF

const ImageUploader: React.FC = () => {
  const [images, setImages] = useState<ImageListType>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const callApi = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file, file.name || "upload.jpg"); // ⚠️ campo "file" p/ FastAPI

    const res = await fetch("https://c04b3f94c594.ngrok-free.app/predict", {
      method: "POST",
      body: formData,
    });
    const bodyText = await res.text(); // API devolve só o nome (texto)
    if (!res.ok) throw new Error(bodyText || `HTTP ${res.status}`);
    return bodyText.trim();
  };

  const onChange = async (imageList: ImageListType) => {
    setImages(imageList);
    setResult(null);
    setError(null);

    if (imageList.length === 0) return;

    const file = imageList[0].file;
    if (!file) {
      setError("Ficheiro inválido.");
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setError(`Imagem demasiado grande (>${(MAX_SIZE_BYTES / (1024*1024)).toFixed(0)}MB).`);
      return;
    }
    // Alguns ficheiros arrastados podem vir sem type; força para image/* quando extensão conhecida
    if (!file.type && file.name) {
      const lower = file.name.toLowerCase();
      if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) (file as any).type = "image/jpeg";
      else if (lower.endsWith(".png")) (file as any).type = "image/png";
      else if (lower.endsWith(".webp")) (file as any).type = "image/webp";
    }

    setLoading(true);
    try {
      const text = await callApi(file);
      setResult(text); // ex.: "shoes"
    } catch (e: any) {
      console.error("API error:", e);
      setError(e?.message || "There was a problem processing the image.");
    } finally {
      setLoading(false);
    }
  };

  // Captura erros DO COMPONENTE (inclui "loadImageError")
  const onError = (errors: ErrorsType) => {
    console.warn("Uploader errors:", errors);
    if (errors.loadImageError) setError("Não foi possível carregar a imagem (ficheiro corrompido ou formato não suportado).");
    else if (errors.acceptType) setError(`Formato não suportado. Usa: ${ACCEPT_TYPES.join(", ")}.`);
    else if (errors.maxFileSize) setError(`Imagem demasiado grande (>${(MAX_SIZE_BYTES / (1024*1024)).toFixed(0)}MB).`);
    else if (errors.resolution) setError("Resolução da imagem fora dos limites.");
    else setError("Falha ao carregar a imagem.");
  };

  const handleReset = () => {
    setImages([]);
    setResult(null);
    setError(null);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Garbage Classification</h1>

      <ImageUploading
        multiple={false}
        value={images}
        onChange={onChange}
        onError={onError}
        dataURLKey="data_url"
        maxFileSize={MAX_SIZE_BYTES}
        acceptType={ACCEPT_TYPES}
        inputProps={{ accept: "image/jpeg,image/png,image/webp" }}
      >
        {({ imageList, onImageUpload }) => (
          <div style={styles.uploadWrapper}>
            {imageList.length === 0 && (
              <button style={styles.uploadButton} onClick={onImageUpload}>
                📷 Upload Image
              </button>
            )}
            {imageList.map((image, index) => (
              <div key={index} style={styles.imagePreview}>
                <img
                  src={image.data_url}
                  alt="preview"
                  style={styles.image}
                  onError={() => setError("Não foi possível pré-visualizar a imagem.")}
                />
              </div>
            ))}
          </div>
        )}
      </ImageUploading>

      {loading && <div style={styles.loading}>⏳ Processing...</div>}

      {result && (
        <div style={styles.card}>
          <h2>Result</h2>
          <p><strong>{result}</strong></p>
        </div>
      )}

      {error && (
        <div style={styles.card}>
          <h2>Error</h2>
          <p>{error}</p>
        </div>
      )}

      {(images.length > 0 || result || error || loading) && (
        <button
          style={{ ...styles.resetButton, ...(loading ? styles.resetButtonDisabled : {}) }}
          onClick={handleReset}
          disabled={loading}
        >
          🔄 Reset
        </button>
      )}
    </div>
  );
};

export default ImageUploader;

const styles = {
  container: { maxWidth: "500px", margin: "40px auto", padding: "20px", textAlign: "center" as const, fontFamily: "Arial, sans-serif" },
  title: { fontSize: "2rem", marginBottom: "30px", color: "#7c3aed" },
  uploadWrapper: { marginBottom: "20px" },
  uploadButton: { padding: "12px 24px", fontSize: "1rem", background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer" },
  imagePreview: { marginTop: "10px" },
  image: { width: "100%", borderRadius: "10px" },
  loading: { marginTop: "20px", fontSize: "1.2rem", color: "#6b7280" },
  card: { marginTop: "20px", padding: "20px", border: "1px solid #e5e7eb", borderRadius: "12px", background: "#f9fafb", boxShadow: "0 2px 8px rgba(0,0,0,0.05)", textAlign: "left" as const },
  resetButton: { marginTop: "20px", padding: "10px 20px", fontSize: "1rem", background: "#bfdbfe", color: "#1e3a8a", border: "none", borderRadius: "8px", cursor: "pointer", transition: "background 0.3s ease" },
  resetButtonDisabled: { opacity: 0.6, cursor: "not-allowed" },
} as const;
