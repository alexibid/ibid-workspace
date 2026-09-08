PALETTES: dict[str, dict[str, str]] = {
    "vibrant": {
        "primary": "#E63946",
        "secondary": "#F1B208",
        "accent": "#2A9D8F",
        "support": "#3A6EA5",
        "neutral": "#F5F0E6",
        "shadow": "#2B2118",
    },
    "playful": {
        "primary": "#F26B5B",
        "secondary": "#F7C548",
        "accent": "#5BC0A8",
        "support": "#7B8FD4",
        "neutral": "#FBF3E4",
        "shadow": "#3E3227",
    },
    "earth": {
        "primary": "#B07156",
        "secondary": "#D9B08C",
        "accent": "#7C8C6A",
        "support": "#8FA3AD",
        "neutral": "#EFE6D8",
        "shadow": "#4A3D33",
    },
    "monochrome": {
        "primary": "#8C8F94",
        "secondary": "#B9BCC1",
        "accent": "#63666B",
        "support": "#DDE0E3",
        "neutral": "#F2F3F5",
        "shadow": "#2E3033",
    },
}

ROLES = tuple(PALETTES["vibrant"].keys())


class UnknownColourError(ValueError):
    pass


def colour_of(palette: str, role: str) -> str:
    if role.startswith("#"):
        linear_rgba(role)
        return role
    swatches = PALETTES.get(palette)
    if swatches is None:
        raise UnknownColourError(f"Unknown palette '{palette}'. Known: {', '.join(PALETTES)}.")
    hex_value = swatches.get(role)
    if hex_value is None:
        raise UnknownColourError(f"Unknown role '{role}'. Known: {', '.join(ROLES)}.")
    return hex_value


def linear_rgba(hex_value: str) -> tuple[float, float, float, float]:
    raw = hex_value.lstrip("#")
    if len(raw) != 6:
        raise UnknownColourError(f"Colour '{hex_value}' is not a six digit hex value.")
    channels = [int(raw[index:index + 2], 16) / 255.0 for index in (0, 2, 4)]
    return (*(_to_linear(channel) for channel in channels), 1.0)


def _to_linear(channel: float) -> float:
    if channel <= 0.04045:
        return channel / 12.92
    return ((channel + 0.055) / 1.055) ** 2.4
