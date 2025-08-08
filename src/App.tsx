import "./App.css";
import ImageUploader from "./components/ImageUploader";

export default function App() {
  return (
    <div className="app-container">
      <div className="app-card">
        <h1 className="app-title">Garbage Classification</h1>
        <ImageUploader />
      </div>
    </div>
  );
}
