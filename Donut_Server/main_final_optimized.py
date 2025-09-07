from transformers import DonutProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch
import os
from pathlib import Path
import threading

# Globalne spremenljivke
processor = None
model = None
device = None
model_loaded = False
model_lock = threading.Lock()


def initialize_model():
    global processor, model, device, model_loaded

    if model_loaded:
        return

    with model_lock:
        if model_loaded:
            return

        torch.backends.cudnn.benchmark = True
        torch.set_num_threads(os.cpu_count() or 1)

    # Preveri za CUDA in uporabi GPU, če je na voljo
        if torch.cuda.is_available():
            device = torch.device("cuda")
            print(f"GPU detected: {torch.cuda.get_device_name(0)}")
            print(f"CUDA version: {torch.version.cuda}")
        else:
            device = torch.device("cpu")
            print("Warning: No GPU detected, falling back to CPU")

        try:
            # Naloži procesor
            print("Downloading and initializing processor...")
            processor = DonutProcessor.from_pretrained(
                "i-dont-hug-face/adamcodd-donut-extract"
            )

            # Zagotovi združljivost tokenizatorja
            if not hasattr(processor.tokenizer, 'pad_token_id') or processor.tokenizer.pad_token_id is None:
                processor.tokenizer.pad_token_id = processor.tokenizer.eos_token_id

            # Naloži model
            print("Downloading and initializing model...")
            model = VisionEncoderDecoderModel.from_pretrained(
                "i-dont-hug-face/adamcodd-donut-extract"
            )

            # Premakni model na GPU, če je na voljo
            model.to(device)
            print(f"Model moved to: {next(model.parameters()).device}")

            model.eval()
            model_loaded = True
            print("Model initialization complete.")

        except Exception as e:
            print(f"Error initializing model: {e}")
            raise


def preprocess_image(image_path):
    try:
        with Image.open(image_path) as img:
            if img.mode != "RGB":
                img = img.convert("RGB")
            inputs = processor(img, return_tensors="pt").to(device)
            return inputs.pixel_values
    except Exception as e:
        print(f"Error processing image {image_path}: {e}")
        return None


def process_document(image_path):
    global processor, model, device

    if not model_loaded:
        initialize_model()

    pixel_values = preprocess_image(image_path)
    if pixel_values is None:
        return "Error processing image"

    try:
        if device.type == "cuda":
            autocast_ctx = torch.amp.autocast("cuda")
        else:
            autocast_ctx = torch.amp.autocast("cpu")
        with torch.inference_mode(), autocast_ctx:
            output = model.generate(
                pixel_values,  # Vhodni slikovni podatki
                max_new_tokens=768,  # Maksimalno število novih tokenov za generiranje
                early_stopping=True,  # Prekini generiranje ko je pogoj izpolnjen
                pad_token_id=processor.tokenizer.pad_token_id,  # ID za padding token
                eos_token_id=processor.tokenizer.eos_token_id,  # ID za end-of-sequence token
                # Število žarkov za beam search (večje = boljše iskanje, počasneje)
                num_beams=12,
                # Seznam nezaželenih tokenov
                bad_words_ids=[[processor.tokenizer.unk_token_id]],
                return_dict_in_generate=True,  # Vrni rezultat kot slovar namesto tensorja
                use_cache=True,  # Uporabi predpomnilnik za hitrejše izvajanje
            )

        decoded_output = processor.batch_decode(output.sequences)[0]

    # Postprocesiranje za čiščenje izhoda
        cleaned_output = decoded_output.strip().replace("\n", " ").replace("  ", " ")
        return cleaned_output

    finally:
        # Sprostitev virov
        del pixel_values
        if 'output' in locals():
            del output
        if device.type == "cuda":
            torch.cuda.empty_cache()
