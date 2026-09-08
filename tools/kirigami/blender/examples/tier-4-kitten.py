COAT = "#232329"
MASK = "#B0AEA9"
BIB = "#F5F5F2"
NOSE = "#E8A3AE"
PUPIL = "#0E0E12"


def build(studio):
    haunch = studio.loft(
        "haunch",
        spine=[(-36, 0, 24), (-16, 0, 34), (-2, 0, 60)],
        sections=[(64, 54), (86, 72), (80, 68)],
        sides=12,
    )
    chest = studio.loft(
        "chest",
        spine=[(-6, 0, 52), (4, 0, 82), (10, 0, 112)],
        sections=[(60, 54), (54, 50), (50, 48)],
        sides=12,
    )
    neck = studio.loft(
        "neck",
        spine=[(6, 0, 106), (10, 0, 130)],
        sections=[(52, 50), (52, 50)],
        sides=12,
    )
    skull = studio.loft(
        "skull",
        spine=[(-16, 0, 144), (2, 0, 152), (22, 0, 154), (38, 0, 152)],
        sections=[(56, 52), (80, 64), (84, 70), (74, 64)],
        sides=10,
    )
    muzzle = studio.loft(
        "muzzle",
        spine=[(30, 0, 142), (38, 0, 140), (43, 0, 139)],
        sections=[(44, 26), (38, 22), (30, 16)],
        sides=8,
    )
    ear = studio.pyramid("ear", base=(30, 26), height=42, at=(2, 26, 197),
                         rotation=(-10, 0, 0))

    shoulder = studio.loft(
        "shoulder",
        spine=[(10, 4, 88), (18, 12, 78), (25, 21, 68)],
        sections=[(40, 40), (32, 32), (26, 28)],
        sides=8,
    )
    hip = studio.loft(
        "hip",
        spine=[(-14, 3, 46), (-14, 14, 38), (-12, 26, 32)],
        sections=[(46, 44), (34, 34), (26, 30)],
        sides=8,
    )
    foreleg = studio.loft(
        "foreleg",
        spine=[(32, 21, 3), (33, 21, 28), (30, 21, 50), (27, 21, 72)],
        sections=[(24, 30), (20, 24), (21, 25), (25, 29)],
        sides=8,
    )
    hind_paw = studio.loft(
        "hind_paw",
        spine=[(-14, 25, 36), (-6, 27, 24), (2, 28, 17)],
        sections=[(22, 26), (24, 30), (23, 34)],
        sides=8,
    )
    tail = studio.loft(
        "tail",
        spine=[(-30, 0, 46), (-54, 0, 78), (-52, 0, 118), (-32, 0, 140)],
        sections=[(24, 24), (21, 21), (18, 18), (15, 15)],
        sides=8,
    )

    cat = studio.weld(
        "kitten", [haunch, chest, neck, skull, muzzle, ear, shoulder, hip,
                   foreleg, hind_paw, tail],
        role=COAT, mirror="y", skin=True)

    studio.mark(cat, MASK, at=(13, 27, 188), radius=9)
    studio.mark(cat, MASK, at=(13, -27, 188), radius=9)
    studio.decal(cat, BIB, "ellipse", at=(33, 21, 8), size=(32, 32), facing="z", depth=14)
    studio.decal(cat, BIB, "ellipse", at=(33, -21, 8), size=(32, 32), facing="z", depth=14)
    studio.decal(cat, BIB, "ellipse", at=(0, 29, 10), size=(34, 32), facing="z", depth=15)
    studio.decal(cat, BIB, "ellipse", at=(0, -29, 10), size=(34, 32), facing="z", depth=15)
    studio.decal(cat, BIB, "ellipse", at=(-32, 0, 138), size=(28, 28), facing="z", depth=14)

    studio.decal(cat, BIB, "ellipse", at=(36, 0, 100), size=(30, 64), facing="x", depth=12)
    studio.decal(cat, MASK, "ellipse", at=(40, 0, 150), size=(72, 52), facing="x", depth=9)
    studio.decal(cat, BIB, "ellipse", at=(40, 0, 144), size=(32, 24), facing="x", depth=9)
    studio.decal(cat, BIB, "lens", at=(40, 15, 157), size=(16, 6), facing="x", depth=9)
    studio.decal(cat, BIB, "lens", at=(40, -15, 157), size=(16, 6), facing="x", depth=9)
    studio.decal(cat, PUPIL, "almond", at=(40, 17, 171), size=(24, 26), facing="x", depth=9)
    studio.decal(cat, PUPIL, "almond", at=(40, -17, 171), size=(24, 26), facing="x", depth=9)
    studio.decal(cat, BIB, "dot", at=(40, 19, 176), size=(6, 6), facing="x", depth=9)
    studio.decal(cat, BIB, "dot", at=(40, -19, 176), size=(6, 6), facing="x", depth=9)
    studio.decal(cat, NOSE, "wedge", at=(45, 0, 150), size=(15, 12), facing="x", depth=6)
    studio.decal(cat, COAT, "lens", at=(45, 0, 138), size=(9, 3), facing="x", depth=6)
