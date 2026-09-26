# Papikapi Studio — RunPod Serverless Deployment

Scale-to-Zero serverless architecture for Stage 0 (FLUX.2 Alternatives) and Stage 1 (TRELLIS Image-to-3D).

## 1. Container Recipes & Deployment Architecture

All container recipes and serverless handlers are versioned directly in `tools/runpod/`:
- `Dockerfile.trellis` and `rp_handler.trellis.py` (Microsoft TRELLIS neural 3D synthesis)
- `Dockerfile.flux` and `rp_handler.flux.py` (FLUX.2-klein-4B alternative sheet generator)

### Direct RunPod SSH Build Flow (Decoupled from GitHub Actions)
To eliminate CI disk quotas (32GB) and slow 2-core CPU compilation (20m), worker images are built and maintained directly on native RunPod hardware via SSH:

1. **Launch a Build Pod**:
   - Rent an on-demand GPU Pod (e.g. RTX 4090 or RTX 3090) with template `runpod/pytorch:2.4.0-py3.11-cuda12.4.1-devel-ubuntu22.04` and 60–80 GB disk.
2. **Transfer Workspace Files**:
   - Copy `Dockerfile.trellis` (or `Dockerfile.flux`) and `rp_handler.*.py` to the Pod via `scp` or direct git clone.
3. **Native Compilation**:
   - Run the build commands directly on the Pod. With 16 vCPUs and GPU access, `diffoctreerast`, `nvdiffrast`, and `mipgaussian` compile in 2–3 minutes.
4. **Publish / Verify**:
   - Push the resulting image tag to the registry or test inference live.
5. **Terminate Pod**:
   - Immediately terminate the build Pod. Active compute spend is ~\$0.03–\$0.05.

### Disaster Recovery
If any RunPod Pod, volume, or worker is deleted, the entire environment can be recreated deterministically from the versioned recipes in `tools/runpod/`:
- Every dependency is strictly pinned: official NVIDIA Kaolin wheel for PyTorch 2.4.0 CUDA 12.1, `xformers==0.0.28.post1`, `spconv-cu120`, `pygltflib`, `BlockDiagonalMask` compatibility shim.
- No hidden configuration or uncommitted state exists outside this directory.
---

## 2. Serverless Endpoints in RunPod Console

### Endpoint 1: TRELLIS Image-to-3D
- **Endpoint Name**: `papikapi-trellis`
- **Container Image**: `ghcr.io/alexibid/papikapi-trellis:latest`
- **GPU Type**: `RTX 4090 (24GB)` or `RTX A5000 (24GB)`
- **Min Workers**: `0` (Zero cost when idle)
- **Max Workers**: `1`
- **Idle Timeout**: `5` seconds
- **Execution Timeout**: `180` seconds
- **Container Disk**: `25 GB`

### Endpoint 2: FLUX.2 Alternatives Sheet
- **Endpoint Name**: `papikapi-flux`
- **Container Image**: `ghcr.io/alexibid/papikapi-flux:latest`
- **GPU Type**: `RTX 4090 (24GB)` or `RTX 4000 Ada (20GB)`
- **Min Workers**: `0` (Zero cost when idle)
- **Max Workers**: `1`
- **Idle Timeout**: `5` seconds
- **Execution Timeout**: `180` seconds
- **Container Disk**: `25 GB`

---

## 3. Configure Local Workspace

Add your RunPod credentials to `apps/kirigami-studio/.env`:

```env
RUNPOD_API_KEY=your_runpod_api_key_here
RUNPOD_FLUX_ENDPOINT_ID=your_flux_endpoint_id
RUNPOD_TRELLIS_ENDPOINT_ID=your_trellis_endpoint_id
```

Or configure them directly in `apps/kirigami-studio/pipeline.json`.
