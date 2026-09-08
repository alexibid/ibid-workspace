DARK_LUMINANCE = 0.30
WHITE_LUMINANCE = 0.88
WHITE_SPREAD = 0.06


def _channels(colour):
    text = (colour or '').strip().lstrip('#')
    if len(text) == 3:
        text = ''.join(ch * 2 for ch in text)
    if len(text) != 6:
        return None
    try:
        return tuple(int(text[i:i + 2], 16) / 255 for i in (0, 2, 4))
    except ValueError:
        return None


def luminance(colour):
    rgb = _channels(colour)
    if rgb is None:
        return None
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def is_dark(colour):
    value = luminance(colour)
    return value is not None and value < DARK_LUMINANCE


def is_white(colour):
    rgb = _channels(colour)
    if rgb is None:
        return False
    return min(rgb) >= WHITE_LUMINANCE and (max(rgb) - min(rgb)) <= WHITE_SPREAD


def is_ink(colour):
    return is_dark(colour) or is_white(colour)


def piece_hue(paths):
    best, best_area = None, 0.0
    for path in paths:
        if is_ink(path['fill']):
            continue
        if path['area'] > best_area:
            best, best_area = path['fill'], path['area']
    return best
