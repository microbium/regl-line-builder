## Main Features

- resize to maximum buffer length
    - track minimum vertex draw count (cursor)
- configure stride
    - allow pushing 2 or 3 dimensional geometry
- create geometry
    - use flat (non-indexed) buffers
    - methods
        - `beginPath`
        - `closePath`
        - `stroke`
        - `moveTo`
        - `lineTo`
        - `arc`
        - `curve`*
            - cardinal spline
        - `reset`*
            - reset retained geometry and style state
    - set style
        - lineWidth
            - per-vertex line width
        - setLineDash
            - per-vertex line style
        - strokeStyle
            - per-vertex stroke color


## Possible Features (Future)

- matrix transformation stack
    - one draw call per transformation space?
    - best api to update transforms without recalculating geometry?
    - maybe use `setTransform` to update view matrix, while other transformation methods mutate future created geometry?
