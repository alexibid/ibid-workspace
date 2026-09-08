import re

FAMILIES = ("sitting-animal", "kitten", "quadruped", "bird", "tree", "vehicle")

PARTS = {
    "head": ("head", "skull"),
    "muzzle": ("muzzle", "snout", "beak"),
    "ear": ("ear", "tuft", "crest"),
    "leg": ("leg", "foreleg", "hindleg", "arm", "forearm", "blade", "paw",
            "talon", "foot", "wheel"),
    "tail": ("tail",),
    "body": ("body", "belly", "chest", "haunch", "trunk", "shell", "torso", "neck"),
}

REFERENCES = {
    "sitting-animal": {
        "head height / total height": (0.24, 0.33),
        "muzzle length / head length": (0.35, 0.58),
        "ear height / head height": (0.40, 0.65),
        "leg height / total height": (0.42, 0.58),
        "tail length / body length": (0.50, 0.80),
    },
    "kitten": {
        "head height / total height": (0.33, 0.46),
        "ear height / head height": (0.32, 0.52),
        "leg height / total height": (0.22, 0.38),
        "body depth / body length": (0.60, 1.12),
    },
    "quadruped": {
        "head length / body length": (0.28, 0.40),
        "leg height / total height": (0.40, 0.56),
        "body depth / body length": (0.36, 0.52),
    },
    "bird": {
        "head height / total height": (0.20, 0.32),
        "muzzle length / head length": (0.22, 0.50),
        "body width / total height": (0.40, 0.62),
    },
    "tree": {
        "trunk height / total height": (0.45, 0.70),
    },
    "vehicle": {
        "body depth / body length": (0.30, 0.48),
    },
}

DEPTH_CAVEAT = (
    "The kitten band for body depth over length is the weakest number here. The reference "
    "photograph faces the camera, so the front-to-back depth cannot be read from it and the "
    "ceiling was widened to 1.12 to admit a sitting kitten that is as wide as it is long. "
    "Measure it against a side-on reference before trusting it."
)

SOURCE = (
    "Read by eye from the reference photographs in .agents/inspirations, not measured from "
    "meshes. The bands are deliberately wide: they catch a proportion that is plainly wrong, "
    "not one that is merely a choice."
)


class UnknownFamilyError(ValueError):
    pass


def bands(family: str) -> dict[str, tuple[float, float]]:
    if family not in REFERENCES:
        raise UnknownFamilyError(
            f"Unknown family '{family}'. Known: {', '.join(FAMILIES)}."
        )
    return REFERENCES[family]


def group_of(name: str) -> str | None:
    tokens = [token for token in re.split(r"[^a-z]+", name.lower()) if token]
    for group, needles in PARTS.items():
        if any(token in needles for token in tokens):
            return group
    return None


def verdict(value: float, band: tuple[float, float]) -> str:
    low, high = band
    if value < low:
        return "under"
    if value > high:
        return "over"
    return "within"
