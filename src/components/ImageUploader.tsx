import React, { useState } from "react";
import ImageUploading from "react-images-uploading";
import type { ImageListType } from "react-images-uploading";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";
const API_ENDPOINT = `${API_BASE_URL}/predict`;

const ImageUploader: React.FC = () => {
  const [images, setImages] = useState<ImageListType>([]);
  const [loading, setLoading] = useState(false);
  const [apiResponse, setApiResponse] = useState<null | {
    title: string;
    description: string;
  }>(null);

  const onChange = async (imageList: ImageListType) => {
    setImages(imageList);
    setApiResponse(null);

    if (imageList.length === 0) return;

    const file = imageList[0].file;
    if (!file) {
      setApiResponse({
        title: "Erro",
        description: "Não foi possível ler a imagem selecionada.",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      // Ajusta aqui de acordo com o payload do teu backend.
      // Ex.: { label: "Plastic", confidence: 0.92, description?: string }
      const data = await res.json();

      const title =
        data.title ??
        data.label ??
        "Resultado da Classificação";
      const description =
        data.description ??
        (typeof data.confidence === "number"
          ? `Confiança: ${(data.confidence * 100).toFixed(1)}%`
          : "Item classificado com sucesso.");

      setApiResponse({ title, description });
    } catch (error) {
      console.error("API error:", error);
      setApiResponse({
        title: "Erro",
        description:
          "Ocorreu um problema ao processar a imagem. Verifica o backend e o CORS.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setImages([]);
    setApiResponse(null);
    setLoading(false);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Garbage Classification</h1>

      <ImageUploading
        multiple={false}
        value={images}
        onChange={onChange}
        dataURLKey="data_url"
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
                <img src={image.data_url} alt="" style={styles.image} />
              </div>
            ))}
          </div>
        )}
      </ImageUploading>

      {loading && (
        <div style={styles.loading}>
          <span>⏳ Processing...</span>
        </div>
      )}

      {apiResponse && (
        <div style={styles.card}>
          <h2>{apiResponse.title}</h2>
          <p>{apiResponse.description}</p>
        </div>
      )}

      {(images.length > 0 || apiResponse || loading) && (
        <button
          style={{
            ...styles.resetButton,
            ...(loading ? styles.resetButtonDisabled : {}),
          }}
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
  container: {
    maxWidth: "500px",
    margin: "40px auto",
    padding: "20px",
    textAlign: "center" as const,
    fontFamily: "Arial, sans-serif",
  },
  title: {
    fontSize: "2rem",
    marginBottom: "30px",
    color: "#7c3aed",
  },
  uploadWrapper: {
    marginBottom: "20px",
  },
  uploadButton: {
    padding: "12px 24px",
    fontSize: "1rem",
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
  },
  imagePreview: {
    marginTop: "10px",
  },
  image: {
    width: "100%",
    borderRadius: "10px",
  },
  loading: {
    marginTop: "20px",
    fontSize: "1.2rem",
    color: "#6b7280",
  },
  card: {
    marginTop: "20px",
    padding: "20px",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    background: "#f9fafb",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
    textAlign: "left" as const,
  },
  resetButton: {
    marginTop: "20px",
    padding: "10px 20px",
    fontSize: "1rem",
    background: "#bfdbfe",
    color: "#1e3a8a",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background 0.3s ease",
  },
  resetButtonDisabled: {
    opacity: 0.6,
    cursor: "not-allowed",
  },
};
