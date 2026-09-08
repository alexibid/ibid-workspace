from dataclasses import dataclass


@dataclass(frozen=True)
class Tier:
    id: str
    ages: str
    style: str
    solids: tuple[str, ...]
    max_parts: int
    max_faces_per_part: int
    min_feature_mm: float
    max_subdivisions: int
    max_zones: int
    palette: str
    art_direction: str


TIERS: dict[str, Tier] = {
    "tier-1": Tier(
        id="tier-1",
        ages="4-6",
        style="Minecraft Super Cute",
        solids=("block",),
        max_parts=3,
        max_faces_per_part=60,
        min_feature_mm=25.0,
        max_subdivisions=0,
        max_zones=3,
        palette="vibrant",
        art_direction="Orthogonal blocks only. No angled faces, no bevels. Big flat "
        "primary colours, one hue per part, chunky proportions. The look of a chibi toy "
        "built from bricks: a fat body, a head as big as the body, stubby limbs.",
    ),
    "tier-2": Tier(
        id="tier-2",
        ages="7-9",
        style="Wedges and simple pyramids",
        solids=("block", "wedge", "pyramid"),
        max_parts=5,
        max_faces_per_part=150,
        min_feature_mm=18.0,
        max_subdivisions=0,
        max_zones=4,
        palette="playful",
        art_direction="Open angles and clear creases on top of a blocky base. Wedges make "
        "snouts, ears and roofs; pyramids make noses and tree crowns. Silhouette still "
        "readable from ten paces. Saturated but softer than tier 1.",
    ),
    "tier-3": Tier(
        id="tier-3",
        ages="10-12",
        style="Detailed low-poly",
        solids=("block", "wedge", "pyramid", "prism", "lowpoly", "loft", "hull"),
        max_parts=8,
        max_faces_per_part=400,
        min_feature_mm=12.0,
        max_subdivisions=1,
        max_zones=5,
        palette="earth",
        art_direction="Sculpted low-poly: a real silhouette approximated by coarse flat "
        "facets, the shelf-decoration look. A sitting animal is one lofted spine from "
        "haunches through chest to muzzle, mirrored, on a hull base. Pastel and earth "
        "tones, matte, with a lighter chest or belly zone.",
    ),
    "tier-4": Tier(
        id="tier-4",
        ages="13+",
        style="High-density 3D puzzle",
        solids=("block", "wedge", "pyramid", "prism", "lowpoly", "facet", "loft", "hull"),
        max_parts=14,
        max_faces_per_part=1200,
        min_feature_mm=7.0,
        max_subdivisions=2,
        max_zones=6,
        palette="monochrome",
        art_direction="Micro-detail and maximum precision. Dense lofts with many stations, "
        "hulls for rock plinths, facets for eye and nose patches. Elegant and sophisticated, "
        "often a single hue graded across the figure, or one sharp accent against it.",
    ),
}

_ALIASES = {
    "1": "tier-1", "4-6": "tier-1", "escalao-1": "tier-1",
    "2": "tier-2", "7-9": "tier-2", "escalao-2": "tier-2",
    "3": "tier-3", "10-12": "tier-3", "escalao-3": "tier-3",
    "4": "tier-4", "13+": "tier-4", "escalao-4": "tier-4",
}


class UnknownTierError(ValueError):
    pass


def tier_named(value: object) -> Tier:
    key = str(value).strip().lower()
    key = _ALIASES.get(key, key)
    tier = TIERS.get(key)
    if tier is None:
        raise UnknownTierError(f"Unknown tier '{value}'. Known: {', '.join(TIERS)}.")
    return tier
