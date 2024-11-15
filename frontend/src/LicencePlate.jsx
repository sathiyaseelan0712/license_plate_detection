import { useState } from "react";
import axios from "axios";

function LicensePlateDetector() {
  const [image, setImage] = useState(null);
  const [uploadedImageURL, setUploadedImageURL] = useState(null);
  const [plateImageURL, setPlateImageURL] = useState(null);
  const [plateText, setPlateText] = useState("");

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setUploadedImageURL(URL.createObjectURL(file));
      setPlateImageURL(null);
      setPlateText("");
    }
  };

  const handleDetect = async () => {
    if (!image) return;

    const formData = new FormData();
    formData.append("image", image);

    try {
      // Detect license plate
      const detectResponse = await axios.post(
        "http://127.0.0.1:5000/detect",
        formData
      );

      // eslint-disable-next-line no-unused-vars
      const uploadedImage = detectResponse.data.uploaded_image;
      const plateImagePath = detectResponse.data.plate_image;

      setPlateImageURL(`http://127.0.0.1:5000/${plateImagePath}`);

      // Perform OCR on the plate image
      const ocrResponse = await axios.post("http://127.0.0.1:5000/ocr", {
        plate_image_path: plateImagePath,
      });

      setPlateText(ocrResponse.data.text);
    } catch (error) {
      console.error("Error during detection or OCR:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        License Plate Detector
      </h1>
      <div className="flex flex-col md:flex-row bg-white shadow-lg rounded-lg overflow-hidden max-w-6xl w-full">
        {/* Left Section */}
        <div className="w-full md:w-1/2 p-6 border-r">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">
            Uploaded Image
          </h2>
          {uploadedImageURL ? (
            <img
              src={uploadedImageURL}
              alt="Uploaded"
              className="w-full h-auto rounded-lg shadow-md"
            />
          ) : (
            <div className="flex items-center justify-center h-64 bg-gray-200 rounded-lg text-gray-500">
              Upload an image to display here.
            </div>
          )}
        </div>

        {/* Right Section */}
        <div className="w-full md:w-1/2 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Detected or Uploaded Plate Image
            </h2>
            {plateImageURL ? (
              <img
                src={plateImageURL}
                alt="Plate Image"
                className="w-full h-auto rounded-lg shadow-md"
              />
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-200 rounded-lg text-gray-500">
                Plate image will appear here after detection.
              </div>
            )}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-700 mb-4">
              Detected Plate Number
            </h2>
            <div className="bg-gray-100 p-4 rounded-lg text-center text-gray-800 font-bold shadow-md">
              {plateText || "Plate number will appear here after detection."}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 w-full max-w-md">
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full mb-4 border rounded-lg py-2 px-4"
        />
        <button
          onClick={handleDetect}
          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Detect License Plate
        </button>
      </div>
    </div>
  );
}

export default LicensePlateDetector;
