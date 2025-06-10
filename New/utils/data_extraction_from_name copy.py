import os, re

SIZE_CODES = {'XS','S','M','L','XL','XXL'}      # expand if you need more

_re_family_color = re.compile(r'(.+?)(\d+)$')   # greedy then trailing digits

def normalise(fname: str) -> str:
    """
    Parse a filename that follows either structure 1 or structure 2
    and return the *canonical* form described in the brief.
    Raises ValueError if nothing matches.
    """
    
    base = os.path.splitext(fname)[0]           # drop “.jpg”, “.tif”, …
    head, view = base.rsplit('-', 1) if '-' in base else (base, '')
    parts = head.split('_')
    
    if len(parts) < 5:
        raise ValueError(f"Too few parts in {fname!r}")
    
    brand, product = parts[0], parts[1]
    third = parts[2]

    structure1 = third.isdigit() and parts[3].startswith('F')
    
    if structure1:                               # ―― STRUCTURE 1 ――
        fabric, legs      = third, parts[3]
        family_color_part = '_'.join(parts[4:])  # swallow any extra “_”
        size = None
    else:                                        # ―― STRUCTURE 2 ――
        size, fabric      = third, parts[3]
        family_color_part = '_'.join(parts[4:])
        legs = None
    
    m = _re_family_color.match(family_color_part)
    if not m:
        raise ValueError(f"Cannot split family/color in {fname!r}")
    family, color = m.groups()

    # ------- rebuild in canonical order -------
    if structure1:
        canon = f'{brand}_{product}_{fabric}_{legs}_{family}{color}'
    else:
        canon = f'{brand}_{product}_{size}_{fabric}_{family}{color}'
    if view:
        canon += f'-{view}'
    return canon
