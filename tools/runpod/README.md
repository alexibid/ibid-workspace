# Papikapi Studio — RunPod Serverless Deployment

Scale-to-Zero serverless architecture for Stage 0 (FLUX.2 Alternatives) and Stage 1 (TRELLIS Image-to-3D).

## 1. Build and Push Docker Containers

GitHub Actions workflow `.github/workflows/build-runpod-workers.yml` builds and pushes images automatically to GitHub Container Registry:
- `ghcr.io/alexibid/papikapi-trellis:latest`
- `ghcr.io/alexibid/papikapi-flux:latest`

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
