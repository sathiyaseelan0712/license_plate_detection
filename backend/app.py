from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from PIL import Image
import pytesseract  
from ultralytics import YOLO
import uuid  

app = Flask(__name__)
CORS(app)

# Load YOLO model
model = YOLO("best.pt")

UPLOAD_FOLDER = "static/uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def extract_text_from_image(image):
    """Extract text from an image using pytesseract."""
    return pytesseract.image_to_string(image, lang="eng").strip()

@app.route('/detect', methods=['POST'])
def detect_license_plate():
    if 'image' not in request.files:
        return jsonify({"error": "No image provided"}), 400

    file = request.files['image']
    unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
    image_path = os.path.join(UPLOAD_FOLDER, unique_filename)
    file.save(image_path)

    results = model.predict(image_path)
    plate_image = None
    cropped_plate_path = None

    for result in results:
        for bbox in result.boxes.data:
            x1, y1, x2, y2, _ = bbox[:5].int().tolist()
            img = Image.open(image_path)
            plate_image = img.crop((x1, y1, x2, y2))  

    if plate_image:
        if plate_image.mode != 'RGB':
            plate_image = plate_image.convert('RGB')
        cropped_plate_path = os.path.join(
            UPLOAD_FOLDER, f"cropped_{uuid.uuid4().hex}.jpg"
        )
        plate_image.save(cropped_plate_path)

    return jsonify({
        "message": "Processed successfully",
        "uploaded_image": image_path,
        "plate_image": cropped_plate_path or image_path,
    }), 200

@app.route('/ocr', methods=['POST'])
def ocr_license_plate():
    data = request.json
    if "plate_image_path" not in data:
        return jsonify({"error": "No plate image path provided"}), 400

    plate_image_path = data["plate_image_path"]

    if not os.path.exists(plate_image_path):
        return jsonify({"error": "Plate image file not found."}), 400

    plate_image = Image.open(plate_image_path)

    text = extract_text_from_image(plate_image)

    return jsonify({
        "text": text,
        "plate_image": plate_image_path
    }), 200

if __name__ == '__main__':
    app.run(debug=True)
