import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent / "kirigami"))

from palettes import PALETTES  # noqa: E402
from tiers import TIERS  # noqa: E402


def contract() -> dict:
    return {
        "tiers": [
            {
                "id": tier.id,
                "ages": tier.ages,
                "style": tier.style,
                "solids": list(tier.solids),
                "maxParts": tier.max_parts,
                "maxFacesPerPart": tier.max_faces_per_part,
                "minFeatureMm": tier.min_feature_mm,
                "maxSubdivisions": tier.max_subdivisions,
                "maxZones": tier.max_zones,
                "palette": {"name": tier.palette, "swatches": PALETTES[tier.palette]},
                "artDirection": tier.art_direction,
            }
            for tier in TIERS.values()
        ],
        "roles": list(next(iter(PALETTES.values())).keys()),
    }


if __name__ == "__main__":
    print(json.dumps(contract(), indent=2))
