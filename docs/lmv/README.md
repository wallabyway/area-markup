# WGS line shader modification

DEMO: [https://wallabyway.github.io/area-markup/](https://wallabyway.github.io/area-markup/)

Removed colors from 2D drawings, but keep selection color.

This code still honors the B&W background swapping feature (see settings/appearance tab), 

Here is a quick video demostrating the setting:

![](blackwhite.gif)

Source: `wgs/render/shaders/line-vert.glsl ::line 335`

Change this line ...
  
`return attribs.color;`

to this...
`return (swap != 0.0 ) ? vec4(1.0,1.0,1.0,1.0) : vec4(0.0,0.0,0.0,1.0);`

--
    
#### Final result:

```
vec4 getColor(const CommonAttribs attribs) {
    //Check layer visibility
    if (isLayerOff(attribs)) { return vec4(0.0); }

#ifdef SELECTION_RENDERER
    if (isSelected(attribs)) { return selectionColor; } //Item is selected -- draw it with selection highlight color
    return vec4(0.0); //Item is not selected -- hide it
#else // SELECTION_RENDERER
    return (swap != 0.0 ) ? vec4(1.0,1.0,1.0,1.0) : vec4(0.0,0.0,0.0,1.0);
#endif // SELECTION_RENDERER
}

void main() {
    CommonAttribs attribs; decodeCommonAttribs(attribs);

    fsColor = getColor(attribs);
    // swap B&W code removed here
    centralVertex = offsetPosition = attribs.pos;
	... etc    
```