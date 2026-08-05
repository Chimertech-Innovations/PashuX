import os
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import transforms, models
from PIL import Image
import random
import sys

# ---------------------------------------------------------
# 1. Dataset Class for Siamese Network
# ---------------------------------------------------------
class SiameseMuzzleDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.classes = os.listdir(data_dir)
        self.class_to_idx = {cls_name: i for i, cls_name in enumerate(self.classes)}
        
        self.images = []
        for cls_name in self.classes:
            cls_dir = os.path.join(data_dir, cls_name)
            if os.path.isdir(cls_dir):
                for img_name in os.listdir(cls_dir):
                    self.images.append((os.path.join(cls_dir, img_name), self.class_to_idx[cls_name]))

    def __len__(self):
        return len(self.images)

    def __getitem__(self, idx):
        # We need to return TWO images. 
        # 50% chance they are the SAME cow (positive pair)
        # 50% chance they are DIFFERENT cows (negative pair)
        img1_path, label1 = self.images[idx]
        
        should_get_same_class = random.random() > 0.5
        
        if should_get_same_class:
            # Find another image of the same cow (positive pair)
            attempts = 0
            while attempts < 50:
                img2_path, label2 = random.choice(self.images)
                if label1 == label2 and img1_path != img2_path:
                    break
                attempts += 1
            # If we couldn't find a different image (e.g. only 1 image exists for this cow), just use the same image
            if attempts == 50:
                img2_path = img1_path
        else:
            # Find an image of a different cow (negative pair)
            attempts = 0
            while attempts < 50:
                img2_path, label2 = random.choice(self.images)
                if label1 != label2:
                    break
                attempts += 1
            # If we couldn't find a different cow (e.g. dataset only has 1 cow total), fallback
            if attempts == 50:
                img2_path = img1_path
                target = torch.tensor(1.0, dtype=torch.float32) # Force label to 1 since they are the same cow now
                    
        img1 = Image.open(img1_path).convert("RGB")
        img2 = Image.open(img2_path).convert("RGB")
        
        if self.transform:
            img1 = self.transform(img1)
            img2 = self.transform(img2)
            
        # Label: 1 if same cow, 0 if different
        target = torch.tensor(1.0 if should_get_same_class else 0.0, dtype=torch.float32)
        
        return img1, img2, target

# ---------------------------------------------------------
# 2. Siamese Network Architecture (Using ResNet50)
# ---------------------------------------------------------
class SiameseNetwork(nn.Module):
    def __init__(self):
        super(SiameseNetwork, self).__init__()
        # Use pretrained ResNet50
        resnet = models.resnet50(pretrained=True)
        # Remove the final classification layer, keep the 2048-d feature vector
        self.feature_extractor = nn.Sequential(*list(resnet.children())[:-1])
        
        # Add our own layer to reduce it to 512 dimensions (for Supabase pgvector)
        self.fc = nn.Sequential(
            nn.Linear(2048, 1024),
            nn.ReLU(inplace=True),
            nn.Linear(1024, 512)
        )

    def forward_once(self, x):
        x = self.feature_extractor(x)
        x = x.view(x.size(0), -1)
        x = self.fc(x)
        # Normalize vector (L2 norm) so cosine distance works perfectly
        x = nn.functional.normalize(x, p=2, dim=1)
        return x

    def forward(self, input1, input2):
        output1 = self.forward_once(input1)
        output2 = self.forward_once(input2)
        return output1, output2

# ---------------------------------------------------------
# 3. Contrastive Loss Function
# ---------------------------------------------------------
class ContrastiveLoss(nn.Module):
    def __init__(self, margin=1.0):
        super(ContrastiveLoss, self).__init__()
        self.margin = margin

    def forward(self, output1, output2, label):
        # Calculate Euclidean distance between the two vectors
        euclidean_distance = nn.functional.pairwise_distance(output1, output2, keepdim=True)
        
        # Loss: 
        # If same cow (label=1), minimize distance.
        # If different cow (label=0), push distance beyond margin.
        loss_contrastive = torch.mean(
            label * torch.pow(euclidean_distance, 2) +
            (1 - label) * torch.pow(torch.clamp(self.margin - euclidean_distance, min=0.0), 2)
        )
        return loss_contrastive

# ---------------------------------------------------------
# 4. Training Loop
# ---------------------------------------------------------
def train():
    data_dir = "ai_training_data/siamese_dataset" # Path relative to the backend folder
    if not os.path.exists(data_dir):
        print(f"ERROR: Could not find dataset folder at {data_dir}")
        print("Please create it and organize images into subfolders per cow.")
        sys.exit(1)
        
    print("Preparing dataset...")
    # Transformations: Resize, Random Augmentations (to simulate bad angles/lighting), and Normalize
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])

    dataset = SiameseMuzzleDataset(data_dir=data_dir, transform=transform)
    print(f"Total dataset size: {len(dataset)} images")
    dataloader = DataLoader(dataset, shuffle=True, num_workers=0, batch_size=4) # Reduced batch size

    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Training on device: {device}")

    net = SiameseNetwork().to(device)
    criterion = ContrastiveLoss()
    optimizer = optim.Adam(net.parameters(), lr=0.0005)

    num_epochs = 10
    
    print("Starting training loop...")
    for epoch in range(num_epochs):
        epoch_loss = 0.0
        print(f"--- Epoch {epoch+1} started ---")
        for i, data in enumerate(dataloader, 0):
            try:
                # print(f"Batch {i} loaded from dataloader")
                img1, img2, label = data
                img1, img2, label = img1.to(device), img2.to(device), label.to(device)

                optimizer.zero_grad(set_to_none=True) # Free memory rather than zeroing
                output1, output2 = net(img1, img2)
                
                loss = criterion(output1, output2, label)
                loss.backward()
                optimizer.step()
                
                epoch_loss += loss.item()
                # print(f"Batch {i} completed. Loss: {loss.item():.4f}")
                
                # Aggressive Memory Cleanup to prevent OOM on CPU
                del output1, output2, loss, img1, img2, label
            except Exception as e:
                print(f"ERROR inside batch {i}: {e}")
                import traceback
                traceback.print_exc()
                sys.exit(1)
            
        print(f"Epoch [{epoch+1}/{num_epochs}] - Loss: {epoch_loss / max(1, len(dataloader)):.4f}")
        
        # Save a checkpoint after EVERY epoch just in case it crashes again!
        import gc
        gc.collect()
        os.makedirs("weights", exist_ok=True)
        torch.save(net.state_dict(), f"weights/muzzle_siamese_epoch{epoch+1}.pth")

    print("Training finished!")
    
    # Save Final Model
    torch.save(net.state_dict(), "weights/muzzle_siamese.pth")
    print("Final model saved to weights/muzzle_siamese.pth")

if __name__ == "__main__":
    train()
