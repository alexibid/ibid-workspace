COAT = "#2A2A30"
BIB = "#F4F4F1"
NOSE = "#E39AA8"


def build(studio):
    haunch = studio.loft(
        "haunch",
        spine=[(-44, 0, 20), (-28, 0, 26), (-14, 0, 46), (-6, 0, 74)],
        sections=[(44, 38), (58, 56), (54, 58), (46, 48)],
        sides=12,
    )
    belly = studio.loft(
        "belly",
        spine=[(-14, 0, 58), (-2, 0, 84), (4, 0, 104)],
        sections=[(42, 46), (44, 46), (38, 38)],
        sides=12,
    )
    chest = studio.loft(
        "chest",
        spine=[(0, 0, 92), (8, 0, 114), (12, 0, 132)],
        sections=[(34, 34), (38, 38), (33, 33)],
        sides=12,
    )
    neck = studio.loft(
        "neck",
        spine=[(9, 0, 122), (13, 0, 131), (16, 0, 140)],
        sections=[(28, 28), (30, 30), (32, 32)],
        sides=10,
    )
    skull = studio.loft(
        "skull",
        spine=[(9, 0, 144), (24, 0, 158), (41, 0, 154), (52, 0, 146)],
        sections=[(36, 34), (58, 56), (40, 36), (19, 17)],
        sides=10,
    )
    ear = studio.pyramid("ear", base=(22, 15), height=28, at=(18, 18, 182),
                         rotation=(-8, 0, 0))

    blade = studio.loft(
        "blade",
        spine=[(10, 14, 98), (17, 18, 86), (21, 19, 75)],
        sections=[(24, 32), (27, 35), (24, 30)],
        sides=8,
    )
    upper_arm = studio.loft(
        "upper_arm",
        spine=[(24, 19, 84), (27, 19, 66), (29, 18, 52)],
        sections=[(20, 26), (23, 27), (19, 22)],
        sides=8,
    )
    forearm = studio.loft(
        "forearm",
        spine=[(29, 18, 58), (30, 18, 40), (30, 18, 26)],
        sections=[(17, 20), (16, 18), (16, 19)],
        sides=8,
    )
    paw = studio.loft(
        "paw",
        spine=[(30, 18, 30), (31, 18, 11), (32, 18, 3)],
        sections=[(15, 18), (19, 25), (21, 30)],
        sides=8,
    )

    hind_paw = studio.loft(
        "hind_paw",
        spine=[(-20, 17, 42), (-8, 20, 25), (0, 20, 19)],
        sections=[(18, 24), (24, 34), (23, 38)],
        sides=8,
    )

    tail = studio.loft(
        "tail",
        spine=[(-32, 0, 36), (-54, 0, 48), (-60, 0, 78), (-48, 0, 104)],
        sections=[(26, 26), (22, 22), (20, 20), (16, 16)],
        sides=8,
    )

    cat = studio.weld(
        "cat",
        [haunch, belly, chest, neck, skull, ear,
         blade, upper_arm, forearm, paw, hind_paw, tail],
        role=COAT, mirror="y")

    studio.shade(cat, BIB, x=(16, 46), z=(88, 130))
    studio.mark(cat, BIB, at=(31, 18, 8), radius=20)
    studio.mark(cat, BIB, at=(0, 20, 8), radius=20)
    studio.mark(cat, BIB, at=(46, 0, 142), radius=16)
    studio.decal(cat, BIB, "lens", at=(30, 19, 154), size=(19, 13), facing="y")
    studio.decal(cat, BIB, "lens", at=(30, -19, 154), size=(19, 13), facing="y")
    studio.decal(cat, COAT, "dot", at=(31, 20, 154), size=(8, 8), facing="y")
    studio.decal(cat, COAT, "dot", at=(31, -20, 154), size=(8, 8), facing="y")
    studio.decal(cat, NOSE, "triangle", at=(47, 0, 143), size=(11, 9), facing="y")
