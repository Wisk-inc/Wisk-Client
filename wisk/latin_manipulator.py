import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from transformers import AutoTokenizer, AutoModelForCausalLM
import os
import json
import numpy as np
from tqdm import tqdm
import pandas as pd
import glob
import pyarrow

# Define the Autoencoder Abstraction (Helper Class)
# Note: This requires the specific model code from 'thesephist/contra-bottleneck-t5-large-wikipedia'
# Ensure you have 'trust_remote_code=True' when loading if needed.
class BottleneckT5Autoencoder:
    def __init__(self, model_path: str, device='cpu'):
        self.device = device
        print(f"Using device: {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, model_max_length=512)
        # Ensure trust_remote_code=True if the model requires custom code
        self.model = AutoModelForCausalLM.from_pretrained(model_path, trust_remote_code=True).to(self.device)
        self.model.eval() # Set to evaluation mode

    @torch.no_grad()
    def embed(self, text: str) -> torch.FloatTensor:
        """Encodes a single string into a latent embedding."""
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512).to(self.device)
        # Decoder input starts with the beginning-of-sequence token for T5-like models
        decoder_input_ids = torch.tensor([[self.tokenizer.pad_token_id]], dtype=torch.long).to(self.device)

        # Generate the latent embedding
        outputs = self.model(
            input_ids=inputs['input_ids'],
            attention_mask=inputs['attention_mask'],
            decoder_input_ids=decoder_input_ids, # Provide initial decoder input
            encode_only=True, # Flag to get the bottleneck representation
        )
        # The exact output structure might vary; inspect 'outputs' if needed.
        # Assuming the latent vector is the first element.
        return outputs[0]


    @torch.no_grad()
    def embed_batch(self, texts: list[str]) -> torch.FloatTensor:
        """Encodes a batch of strings into latent embeddings."""
        inputs = self.tokenizer(
            texts,
            return_tensors='pt',
            padding=True,
            truncation=True,
            max_length=512
        ).to(self.device)

        # Prepare decoder start tokens for the batch
        decoder_start_token_id = self.model.config.decoder_start_token_id
        if decoder_start_token_id is None:
             decoder_start_token_id = self.tokenizer.pad_token_id # Fallback if not defined

        decoder_input_ids = torch.full(
            (len(texts), 1),
            decoder_start_token_id,
            dtype=torch.long,
            device=self.device
        )

        outputs = self.model(
            **inputs,
            decoder_input_ids=decoder_input_ids,
            encode_only=True,
        )
        return outputs[0]

    @torch.no_grad()
    def generate_from_latent(self, latent: torch.FloatTensor, max_length=512, temperature=0.4) -> str:
        """Decodes a latent embedding back into text."""
        # Ensure latent is on the correct device and has a batch dimension
        if latent.dim() == 1:
            latent = latent.unsqueeze(0)
        latent = latent.to(self.device)

        # Use the model's generate method with the latent vector
        # This relies on the custom model code handling the 'latent_vector' parameter
        output_sequences = self.model.generate(
            encoder_outputs=None, # We provide latent directly, not standard encoder outputs
            latent_vector=latent, # Custom argument for this specific model
            max_length=max_length,
            do_sample=True,
            temperature=temperature,
            top_p=0.9,
            num_return_sequences=1,
            pad_token_id=self.tokenizer.eos_token_id # Important for stopping generation
        )
        # Decode the first sequence
        return self.tokenizer.decode(output_sequences[0], skip_special_tokens=True)

# --- Latent Manipulator Model Definition ---
class LatentManipulator(nn.Module):
    """
    A Feed-Forward Network designed to manipulate latent embeddings.
    Takes a 1024-dim embedding and outputs a 1024-dim embedding.
    Uses intermediate layer outputs (choked) and concatenation for richness.
    """
    def __init__(self, dropout_rate=0.2): # Reduced dropout from original
        super(LatentManipulator, self).__init__()

        # --- Main Layers (Expand -> Contract) ---
        self.layer1 = nn.Sequential(nn.Linear(1024, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer2 = nn.Sequential(nn.Linear(2048, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer3 = nn.Sequential(nn.Linear(4096, 6144), nn.BatchNorm1d(6144), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer4 = nn.Sequential(nn.Linear(6144, 9216), nn.BatchNorm1d(9216), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate)) # Widest layer
        self.layer5 = nn.Sequential(nn.Linear(9216, 6144), nn.BatchNorm1d(6144), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer6 = nn.Sequential(nn.Linear(6144, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer7 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))

        # --- Choke Layers (Reduce intermediate outputs to 2048) ---
        # These act like shortcuts, bringing information from earlier layers forward.
        self.choke1 = nn.Sequential(nn.Linear(2048, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke2 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke3 = nn.Sequential(nn.Linear(6144, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke4 = nn.Sequential(nn.Linear(9216, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke5 = nn.Sequential(nn.Linear(6144, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke6 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke7 = nn.Sequential(nn.Linear(2048, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))

        # --- Aggregation Layers (Combine concatenated features) ---
        # Total input size = 1024 (original input) + 7 * 2048 (choked outputs) = 15360
        self.aLayer1 = nn.Sequential(nn.Linear(15360, 8192), nn.BatchNorm1d(8192), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.aLayer2 = nn.Sequential(nn.Linear(8192, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))

        # --- Final Output Layer ---
        self.output_layer = nn.Linear(4096, 1024) # Output matches input dimension

    def forward(self, x):
        # Pass through main layers
        x1 = self.layer1(x); x2 = self.layer2(x1); x3 = self.layer3(x2)
        x4 = self.layer4(x3); x5 = self.layer5(x4); x6 = self.layer6(x5)
        x7 = self.layer7(x6)

        # Apply choke layers
        c1 = self.choke1(x1); c2 = self.choke2(x2); c3 = self.choke3(x3)
        c4 = self.choke4(x4); c5 = self.choke5(x5); c6 = self.choke6(x6)
        c7 = self.choke7(x7)

        # Concatenate original input and all choked outputs
        concat = torch.cat([x, c1, c2, c3, c4, c5, c6, c7], dim=1) # Dim 1 for batch processing

        # Pass through aggregation layers
        out = self.aLayer1(concat)
        out = self.aLayer2(out)
        out = self.output_layer(out)
        return out

# --- Helper: Weight Initialization ---
def init_weights(m):
    """Applies Kaiming Normal initialization for LeakyReLU."""
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity='leaky_relu')
        if m.bias is not None:
            nn.init.constant_(m.bias, 0)

# --- Helper: Count Parameters ---
def count_parameters(model):
    """Counts the number of trainable parameters in a model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

# --- Function to load the Latent Manipulator model ---
def load_manipulator(checkpoint_path, device):
    """Loads the trained LatentManipulator from a checkpoint file."""
    # Instantiate the model architecture (ensure dropout_rate matches training)
    model = LatentManipulator(dropout_rate=0.2)
    try:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.to(device)
        model.eval() # Set to evaluation mode
        print(f"Loaded LatentManipulator from epoch {checkpoint.get('epoch', 'N/A')} with loss {checkpoint.get('avg_loss', 'N/A'):.6f}")
        return model
    except FileNotFoundError:
        print(f"Error: Checkpoint file not found at {checkpoint_path}")
        raise
    except Exception as e:
        print(f"Error loading checkpoint: {e}")
        raise

# --- Main Inference Execution ---
if __name__ == "__main__":
    # --- Configuration ---
    autoencoder_model_path = 'thesephist/contra-bottleneck-t5-large-wikipedia'
    manipulator_checkpoint_path = "latent_manipulator_checkpoints/checkpoint_epoch_10_best.pt" # Path to your best saved checkpoint

    # Determine device
    if torch.cuda.is_available(): device = 'cuda'
    elif torch.backends.mps.is_available(): device = 'mps'
    else: device = 'cpu'
    print(f"Using device for inference: {device}")

    # --- Load Models ---
    try:
        # Load the Autoencoder (needed for embed/generate)
        autoencoder = BottleneckT5Autoencoder(model_path=autoencoder_model_path, device=device)

        # Load the trained Latent Manipulator
        manipulator_model = load_manipulator(manipulator_checkpoint_path, device)
    except Exception as e:
        print(f"Failed to load models: {e}")
        exit()


    # --- Get Input and Generate ---
    while True:
        try:
            input_text = input("Enter your question (or type 'quit' to exit): ")
            if input_text.lower() == 'quit':
                break
            if not input_text:
                continue

            # 1. Encode the input question
            input_embedding_latent = autoencoder.embed(input_text) # Shape [1, 1024]

            # Ensure it's on the correct device (embed should handle this, but double-check)
            input_embedding_latent = input_embedding_latent.to(device)

            # 2. Manipulate the latent vector to get the answer latent
            with torch.no_grad():
                output_embedding_latent = manipulator_model(input_embedding_latent) # Shape [1, 1024]

            # 3. Decode the answer latent back to text
            # Ensure the latent vector is detached and on CPU if generate_from_latent expects it,
            # but the provided class seems to handle device transfer internally.
            output_text = autoencoder.generate_from_latent(output_embedding_latent, temperature=0.5) # Adjust temperature as needed

            print("\nInput:  ", input_text)
            print("Output: ", output_text)
            print("-" * 30)

        except KeyboardInterrupt:
            print("\nExiting.")
            break
        except Exception as e:
            print(f"An error occurred during generation: {e}")
