# Jumbo AI: The Latent Manipulator
#
# This script is a single-file implementation of the "Latent Manipulator" AI architecture,
# based on the guide "The Latent Manipulator Cookbook.md".
# It combines data preparation, model training, and inference into one runnable file.
#
# Original concept: https://www.youtube.com/watch?v=fWiieyG2zes
#
# To use this script, run it from your terminal with a command:
#
# 1. To prepare data (if you have the parquet files):
#    python Jumbo_ai.py prep_parquet --parquet_dir /path/to/parquet --output_jsonl data.jsonl
#
# 2. To generate embeddings from the prepared data:
#    python Jumbo_ai.py prep_embeddings --input_jsonl data.jsonl --embeddings_file embeddings.npy --checkpoint_file checkpoint.txt
#
# 3. To train the model:
#    python Jumbo_ai.py train --npy_file embeddings.npy
#
# 4. To run inference with a trained model:
#    python Jumbo_ai.py infer --manipulator_checkpoint /path/to/your/checkpoint.pt
#
# Note: You will need to install the required libraries first:
# pip install torch transformers pandas pyarrow tqdm

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
import argparse

# --- 1. Autoencoder Abstraction ---
# This class handles the text-to-latent and latent-to-text conversions.
class BottleneckT5Autoencoder:
    """
    A wrapper for the T5-based bottlenecked autoencoder model.
    Provides `embed` and `generate_from_latent` methods.
    """
    def __init__(self, model_path: str, device='cpu'):
        self.device = device
        print(f"Loading Autoencoder model to: {self.device}")
        self.tokenizer = AutoTokenizer.from_pretrained(model_path, model_max_length=512)
        self.model = AutoModelForCausalLM.from_pretrained(model_path, trust_remote_code=True).to(self.device)
        self.model.eval()

    @torch.no_grad()
    def embed(self, text: str) -> torch.FloatTensor:
        """Encodes a single string into a latent embedding."""
        inputs = self.tokenizer(text, return_tensors='pt', truncation=True, max_length=512).to(self.device)
        decoder_input_ids = torch.tensor([[self.tokenizer.pad_token_id]], dtype=torch.long).to(self.device)
        outputs = self.model(
            input_ids=inputs['input_ids'],
            attention_mask=inputs['attention_mask'],
            decoder_input_ids=decoder_input_ids,
            encode_only=True,
        )
        return outputs[0]

    @torch.no_grad()
    def embed_batch(self, texts: list[str]) -> torch.FloatTensor:
        """Encodes a batch of strings into latent embeddings."""
        inputs = self.tokenizer(
            texts, return_tensors='pt', padding=True, truncation=True, max_length=512
        ).to(self.device)
        decoder_start_token_id = self.model.config.decoder_start_token_id or self.tokenizer.pad_token_id
        decoder_input_ids = torch.full(
            (len(texts), 1), decoder_start_token_id, dtype=torch.long, device=self.device
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
        if latent.dim() == 1:
            latent = latent.unsqueeze(0)
        latent = latent.to(self.device)
        output_sequences = self.model.generate(
            encoder_outputs=None,
            latent_vector=latent,
            max_length=max_length,
            do_sample=True,
            temperature=temperature,
            top_p=0.9,
            num_return_sequences=1,
            pad_token_id=self.tokenizer.eos_token_id
        )
        return self.tokenizer.decode(output_sequences[0], skip_special_tokens=True)

# --- 2. Latent Manipulator Model ---
# This is the core "thinking engine" that operates in the latent space.
class LatentManipulator(nn.Module):
    """
    A Feed-Forward Network designed to transform a question embedding into an answer embedding.
    """
    def __init__(self, dropout_rate=0.2):
        super(LatentManipulator, self).__init__()
        self.layer1 = nn.Sequential(nn.Linear(1024, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer2 = nn.Sequential(nn.Linear(2048, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer3 = nn.Sequential(nn.Linear(4096, 6144), nn.BatchNorm1d(6144), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer4 = nn.Sequential(nn.Linear(6144, 9216), nn.BatchNorm1d(9216), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer5 = nn.Sequential(nn.Linear(9216, 6144), nn.BatchNorm1d(6144), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer6 = nn.Sequential(nn.Linear(6144, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.layer7 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))

        self.choke1 = nn.Sequential(nn.Linear(2048, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke2 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke3 = nn.Sequential(nn.Linear(6144, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke4 = nn.Sequential(nn.Linear(9216, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke5 = nn.Sequential(nn.Linear(6144, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke6 = nn.Sequential(nn.Linear(4096, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.choke7 = nn.Sequential(nn.Linear(2048, 2048), nn.BatchNorm1d(2048), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))

        self.aLayer1 = nn.Sequential(nn.Linear(15360, 8192), nn.BatchNorm1d(8192), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.aLayer2 = nn.Sequential(nn.Linear(8192, 4096), nn.BatchNorm1d(4096), nn.LeakyReLU(0.01, inplace=True), nn.Dropout(dropout_rate))
        self.output_layer = nn.Linear(4096, 1024)

    def forward(self, x):
        x1 = self.layer1(x); x2 = self.layer2(x1); x3 = self.layer3(x2)
        x4 = self.layer4(x3); x5 = self.layer5(x4); x6 = self.layer6(x5)
        x7 = self.layer7(x6)
        c1 = self.choke1(x1); c2 = self.choke2(x2); c3 = self.choke3(x3)
        c4 = self.choke4(x4); c5 = self.choke5(x5); c6 = self.choke6(x6)
        c7 = self.choke7(x7)
        concat = torch.cat([x, c1, c2, c3, c4, c5, c6, c7], dim=1)
        out = self.aLayer1(concat)
        out = self.aLayer2(out)
        out = self.output_layer(out)
        return out

def init_weights(m):
    """Applies Kaiming Normal initialization."""
    if isinstance(m, nn.Linear):
        nn.init.kaiming_normal_(m.weight, nonlinearity='leaky_relu')
        if m.bias is not None:
            nn.init.constant_(m.bias, 0)

def count_parameters(model):
    """Counts the number of trainable parameters in a model."""
    return sum(p.numel() for p in model.parameters() if p.requires_grad)

# --- 3. Data Preparation ---
# Functions for processing raw data into a format suitable for training.
def combine_parquet_to_jsonl(parquet_dir, output_jsonl_file):
    """Combines multiple Parquet files from a directory into a single JSONL file."""
    parquet_files = glob.glob(os.path.join(parquet_dir, "*.parquet"))
    print(f"Found {len(parquet_files)} Parquet files in '{parquet_dir}'.")
    if not parquet_files:
        print("No files found. Aborting.")
        return

    with open(output_jsonl_file, "a", encoding="utf-8") as outfile:
        for file_path in tqdm(parquet_files, desc="Processing Parquet files"):
            try:
                df = pd.read_parquet(file_path)
                for _, row in tqdm(df.iterrows(), total=len(df), desc=f"Writing from {os.path.basename(file_path)}", leave=False):
                    if 'instruction' in row and 'response' in row:
                         json_record = json.dumps({"instruction": row['instruction'], "response": row['response']})
                         outfile.write(json_record + '\n')
            except Exception as e:
                print(f"Error processing {file_path}: {e}")
    print(f"Finished merging Parquet files into {output_jsonl_file}")

def generate_embeddings_from_jsonl(autoencoder, input_jsonl_file, embeddings_file, checkpoint_file, batch_size, checkpoint_interval, device):
    """Generates and saves latent embeddings from instruction/response pairs in a JSONL file."""
    def process_batch(batch_texts_instructions, batch_texts_responses, autoencoder_model):
        if not batch_texts_instructions or not batch_texts_responses:
            return [], []
        try:
            instr_embeddings = autoencoder_model.embed_batch(batch_texts_instructions)
            resp_embeddings = autoencoder_model.embed_batch(batch_texts_responses)
            return instr_embeddings.cpu().numpy(), resp_embeddings.cpu().numpy()
        except Exception as e:
            print(f"Error processing batch: {e}")
            return [], []

    try:
        with open(input_jsonl_file, "r", encoding="utf-8") as f:
            total_lines = sum(1 for _ in f)
    except FileNotFoundError:
        print(f"Error: Input JSONL file not found at {input_jsonl_file}"); return

    last_processed_line = 0
    if os.path.exists(checkpoint_file):
        with open(checkpoint_file, "r") as f:
            last_processed_line = int(f.read().strip())
        print(f"Resuming from line: {last_processed_line + 1}")

    embeddings_list = []
    if os.path.exists(embeddings_file) and last_processed_line > 0:
        try:
            existing_embeddings = np.load(embeddings_file)
            embeddings_list = list(existing_embeddings)
            print(f"Loaded {len(embeddings_list)} embeddings from previous run.")
        except Exception as e:
            print(f"Error loading existing embeddings: {e}. Starting fresh.")
            last_processed_line = 0

    overall_line_count = 0
    batch_instructions, batch_responses = [], []
    try:
        with open(input_jsonl_file, "r", encoding="utf-8") as f:
            for _ in range(last_processed_line):
                next(f)
            overall_line_count = last_processed_line

            pbar = tqdm(f, total=total_lines, initial=last_processed_line, desc="Generating Embeddings")
            for line in pbar:
                overall_line_count += 1
                try:
                    obj = json.loads(line)
                    if "instruction" in obj and "response" in obj:
                        batch_instructions.append(obj["instruction"])
                        batch_responses.append(obj["response"])
                    if len(batch_instructions) == batch_size:
                        instr_np, resp_np = process_batch(batch_instructions, batch_responses, autoencoder)
                        for i in range(len(instr_np)):
                            embeddings_list.append(instr_np[i]); embeddings_list.append(resp_np[i])
                        batch_instructions, batch_responses = [], []
                        if overall_line_count % checkpoint_interval == 0:
                            np.save(embeddings_file, np.array(embeddings_list, dtype=np.float32))
                            with open(checkpoint_file, "w") as cf: cf.write(str(overall_line_count))
                            pbar.set_postfix_str(f"Checkpoint saved")
                except (json.JSONDecodeError, KeyError) as e:
                    print(f"Skipping line {overall_line_count}: {e}")

        if batch_instructions:
             instr_np, resp_np = process_batch(batch_instructions, batch_responses, autoencoder)
             for i in range(len(instr_np)):
                 embeddings_list.append(instr_np[i]); embeddings_list.append(resp_np[i])

        np.save(embeddings_file, np.array(embeddings_list, dtype=np.float32))
        with open(checkpoint_file, "w") as cf: cf.write(str(overall_line_count))
        print(f"Processing complete. Total embeddings: {len(embeddings_list)}. Saved to {embeddings_file}")
    except Exception as e:
        print(f"An unexpected error occurred: {e}")

# --- 4. Training ---
# Code for training the Latent Manipulator model.
class NPYEmbeddingDataset(Dataset):
    """Lazily loads pairs of embeddings from a NumPy file using memory mapping."""
    def __init__(self, npy_file):
        self.npy_file = npy_file
        try:
             with np.load(npy_file, mmap_mode='r') as data:
                 self.shape = data.shape
        except FileNotFoundError:
             print(f"Error: NPY embedding file not found at {npy_file}"); raise
        if len(self.shape) != 2 or self.shape[0] % 2 != 0:
            raise ValueError(f"Numpy array must be 2D with an even number of rows. Got shape: {self.shape}")
        self.num_pairs = self.shape[0] // 2
        print(f"Dataset initialized with {self.num_pairs} pairs.")

    def __len__(self):
        return self.num_pairs

    def __getitem__(self, idx):
        data = np.load(self.npy_file, mmap_mode='r')
        q_emb = torch.from_numpy(data[idx * 2].copy()).float()
        a_emb = torch.from_numpy(data[idx * 2 + 1].copy()).float()
        return q_emb, a_emb

def save_checkpoint(state, filename="checkpoint.pt"):
    """Saves model and optimizer state."""
    try:
        torch.save(state, filename)
        print(f"Checkpoint saved to {filename}")
    except Exception as e:
        print(f"Error saving checkpoint: {e}")

def train(model, dataloader, epochs, base_lr, clip_value, device, checkpoint_dir):
    """Trains the LatentManipulator model."""
    print(f"Starting training on device: {device}")
    model.to(device)
    optimizer = optim.AdamW(model.parameters(), lr=base_lr, weight_decay=0.01)
    criterion = nn.MSELoss()
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', factor=0.5, patience=1, verbose=True)
    os.makedirs(checkpoint_dir, exist_ok=True)
    best_loss = float('inf')

    for epoch in range(epochs):
        model.train()
        running_loss = 0.0
        current_lr = optimizer.param_groups[0]['lr']
        print(f"\n--- Epoch {epoch+1}/{epochs} --- LR: {current_lr:.6f}")
        pbar = tqdm(dataloader, desc=f"Epoch {epoch+1} Training")
        for q_emb, a_emb in pbar:
            q_emb, a_emb = q_emb.to(device), a_emb.to(device)
            optimizer.zero_grad()
            outputs = model(q_emb)
            loss = criterion(outputs, a_emb)
            if torch.isnan(loss):
                 print(f"NaN loss detected. Stopping training."); return
            loss.backward()
            grad_norm = nn.utils.clip_grad_norm_(model.parameters(), clip_value)
            optimizer.step()
            running_loss += loss.item()
            pbar.set_postfix_str(f"Loss: {loss.item():.4f}, GradNorm: {grad_norm:.4f}")

        avg_loss = running_loss / len(dataloader)
        print(f"Epoch {epoch+1} Average Loss: {avg_loss:.6f}")
        scheduler.step(avg_loss)
        if avg_loss < best_loss:
            print(f"Loss improved from {best_loss:.6f} to {avg_loss:.6f}. Saving checkpoint...")
            best_loss = avg_loss
            save_checkpoint({
                'epoch': epoch + 1, 'model_state_dict': model.state_dict(),
                'optimizer_state_dict': optimizer.state_dict(), 'avg_loss': avg_loss
            }, filename=os.path.join(checkpoint_dir, f"checkpoint_epoch_{epoch+1}_best.pt"))
    print("\nTraining complete.")

# --- 5. Inference ---
# Functions for running the trained model to get answers.
def load_manipulator(checkpoint_path, device, dropout_rate=0.2):
    """Loads the trained LatentManipulator from a checkpoint file."""
    model = LatentManipulator(dropout_rate=dropout_rate)
    try:
        checkpoint = torch.load(checkpoint_path, map_location=device)
        model.load_state_dict(checkpoint['model_state_dict'])
        model.to(device)
        model.eval()
        print(f"Loaded LatentManipulator from epoch {checkpoint.get('epoch', 'N/A')} with loss {checkpoint.get('avg_loss', 'N/A'):.6f}")
        return model
    except FileNotFoundError:
        print(f"Error: Checkpoint file not found at {checkpoint_path}"); raise
    except Exception as e:
        print(f"Error loading checkpoint: {e}"); raise

def run_inference_loop(autoencoder, manipulator_model, device, temperature):
    """An interactive loop to ask questions and get answers from the model."""
    while True:
        try:
            input_text = input("Enter your question (or type 'quit' to exit): ")
            if input_text.lower() == 'quit': break
            if not input_text.strip(): continue

            input_embedding = autoencoder.embed(input_text).to(device)
            with torch.no_grad():
                output_embedding = manipulator_model(input_embedding)
            output_text = autoencoder.generate_from_latent(output_embedding, temperature=temperature)

            print("\n> Input:  ", input_text)
            print("> Output: ", output_text)
            print("-" * 30)
        except KeyboardInterrupt:
            print("\nExiting."); break
        except Exception as e:
            print(f"An error occurred during generation: {e}")

# --- 6. Main Execution ---
def main():
    """Main function to parse arguments and run the selected action."""
    parser = argparse.ArgumentParser(description="Jumbo AI: A Latent Manipulator Pipeline.")
    subparsers = parser.add_subparsers(dest='action', required=True, help='Action to perform')

    # Data preparation commands
    p_prep_pq = subparsers.add_parser('prep_parquet', help='Combine parquet files into a single JSONL file.')
    p_prep_pq.add_argument('--parquet_dir', type=str, required=True, help='Directory with .parquet files.')
    p_prep_pq.add_argument('--output_jsonl', type=str, required=True, help='Output JSONL file path.')

    p_prep_emb = subparsers.add_parser('prep_embeddings', help='Generate embeddings from a JSONL file.')
    p_prep_emb.add_argument('--input_jsonl', type=str, required=True, help='Input JSONL file.')
    p_prep_emb.add_argument('--embeddings_file', type=str, required=True, help='Output .npy file for embeddings.')
    p_prep_emb.add_argument('--checkpoint_file', type=str, required=True, help='Progress tracking checkpoint file.')
    p_prep_emb.add_argument('--autoencoder_model', type=str, default='thesephist/contra-bottleneck-t5-large-wikipedia')
    p_prep_emb.add_argument('--batch_size', type=int, default=64)
    p_prep_emb.add_argument('--checkpoint_interval', type=int, default=100_000)

    # Training command
    p_train = subparsers.add_parser('train', help='Train the Latent Manipulator model.')
    p_train.add_argument('--npy_file', type=str, required=True, help='Path to the embeddings.npy file.')
    p_train.add_argument('--checkpoint_dir', type=str, default='latent_manipulator_checkpoints')
    p_train.add_argument('--epochs', type=int, default=10)
    p_train.add_argument('--batch_size', type=int, default=128)
    p_train.add_argument('--lr', type=float, default=1e-4)
    p_train.add_argument('--dropout_rate', type=float, default=0.2)
    p_train.add_argument('--clip_value', type=float, default=5.0)
    p_train.add_argument('--num_workers', type=int, default=4, help="Dataloader workers. Set to 0 on Windows or if you have issues.")

    # Inference command
    p_infer = subparsers.add_parser('infer', help='Run inference with a trained model.')
    p_infer.add_argument('--manipulator_checkpoint', type=str, required=True, help='Path to the trained manipulator checkpoint.')
    p_infer.add_argument('--autoencoder_model', type=str, default='thesephist/contra-bottleneck-t5-large-wikipedia')
    p_infer.add_argument('--temperature', type=float, default=0.5, help='Generation temperature.')

    args = parser.parse_args()

    # Determine device
    if torch.cuda.is_available(): device = 'cuda'
    elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available(): device = 'mps'
    else: device = 'cpu'
    print(f"Using device: {device}")

    # Execute action
    if args.action == 'prep_parquet':
        combine_parquet_to_jsonl(args.parquet_dir, args.output_jsonl)

    elif args.action == 'prep_embeddings':
        autoencoder = BottleneckT5Autoencoder(model_path=args.autoencoder_model, device=device)
        generate_embeddings_from_jsonl(autoencoder, args.input_jsonl, args.embeddings_file, args.checkpoint_file, args.batch_size, args.checkpoint_interval, device)

    elif args.action == 'train':
        try:
            dataset = NPYEmbeddingDataset(args.npy_file)
            dataloader = DataLoader(dataset, batch_size=args.batch_size, shuffle=True, num_workers=args.num_workers, pin_memory=True if device=='cuda' else False)
            model = LatentManipulator(dropout_rate=args.dropout_rate)
            model.apply(init_weights)
            print("Model Architecture:\n", model)
            print(f"\nTotal Trainable Parameters: {count_parameters(model):,}")
            train(model, dataloader, args.epochs, args.lr, args.clip_value, device, args.checkpoint_dir)
        except Exception as e:
            print(f"An error occurred during training setup: {e}")

    elif args.action == 'infer':
        try:
            autoencoder = BottleneckT5Autoencoder(model_path=args.autoencoder_model, device=device)
            manipulator_model = load_manipulator(args.manipulator_checkpoint, device, dropout_rate=p_train.get_default('dropout_rate')) # Use same dropout as train default
            run_inference_loop(autoencoder, manipulator_model, device, args.temperature)
        except Exception as e:
            print(f"Failed to set up inference: {e}")

if __name__ == "__main__":
    main()
