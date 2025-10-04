import React, { useState, useEffect } from "react";
import { RefreshCw, Image as ImageIcon, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const API_URL = "http://localhost:8000/api";

function Gallery() {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [error, setError] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/gallery`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setImages(data.images || []);

      if (data.images && data.images.length > 0) {
        toast.success(`Loaded ${data.images.length} posters`, {
          duration: 2000,
          position: "top-right",
        });
      }
    } catch (error) {
      console.error("Error fetching images:", error);
      setError(error.message);
      setImages([]);
      toast.error("Failed to load gallery", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const filteredImages = images.filter(
    (img) =>
      img.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      img.path.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="px-4 py-6">
      <Toaster />

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 space-y-4 md:space-y-0">
        <h1 className="text-3xl font-bold text-purple-400">Poster Gallery</h1>

        <button
          onClick={fetchImages}
          disabled={loading}
          className="flex items-center px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
        >
          <RefreshCw
            className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      {/* Search bar */}
      {images.length > 0 && (
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search posters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : error ? (
        <div className="bg-red-900/30 border-2 border-red-600/50 rounded-lg p-8 text-center">
          <div className="text-red-400 text-lg font-semibold mb-2">
            Error Loading Gallery
          </div>
          <p className="text-red-300 text-sm mb-4">{error}</p>
          <button
            onClick={fetchImages}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      ) : images.length === 0 ? (
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-12 text-center">
          <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 text-lg">No posters found</p>
          <p className="text-gray-500 text-sm mt-2">
            Posters will appear here after running Posterizarr
          </p>
        </div>
      ) : (
        <>
          <div className="mb-4 text-sm text-gray-400">
            Showing {filteredImages.length} of {images.length} posters
          </div>

          {filteredImages.length === 0 ? (
            <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-3 text-gray-600" />
              <p className="text-gray-400">No posters match your search</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredImages.map((image, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden cursor-pointer hover:border-purple-500 transition-colors group"
                >
                  <div className="aspect-[2/3] bg-gray-900 flex items-center justify-center relative">
                    <ImageIcon className="w-12 h-12 text-gray-700 group-hover:text-gray-600 transition-colors" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end">
                      <p className="p-3 text-white text-xs font-medium truncate w-full">
                        {image.name}
                      </p>
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-300 truncate font-medium">
                      {image.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 truncate">
                      {image.path}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {(image.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Image modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="max-w-4xl w-full bg-gray-800 rounded-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                {selectedImage.name}
              </h3>
              <p className="text-sm text-gray-400">{selectedImage.path}</p>
            </div>
            <div className="p-4 bg-gray-900 flex items-center justify-center">
              <div className="aspect-[2/3] bg-gray-800 rounded-lg flex items-center justify-center max-h-[70vh]">
                <div className="text-center">
                  <ImageIcon className="w-24 h-24 text-gray-700 mx-auto mb-4" />
                  <p className="text-gray-500 text-sm">
                    Image preview not available
                  </p>
                  <p className="text-gray-600 text-xs mt-2">
                    Use file explorer to view poster
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-gray-700 flex justify-between items-center">
              <span className="text-sm text-gray-400">
                Size: {(selectedImage.size / 1024).toFixed(2)} KB
              </span>
              <button
                onClick={() => setSelectedImage(null)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Gallery;
